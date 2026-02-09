package seller

import (
	"context"
	"errors"
	"fmt"
	"wildberries/internal/entity"
	"wildberries/internal/repository"
)

// Service handles seller business logic
type Service struct {
	productRepo    repository.ProductRepository
	betRepo        repository.BetRepository
	auctionRepo    repository.AuctionRepository
	slotRepo       repository.SlotRepository
	promotionRepo  repository.PromotionRepository
	moderationRepo repository.ModerationRepository
}

// New creates a new seller service
func New(
	productRepo repository.ProductRepository,
	betRepo repository.BetRepository,
	auctionRepo repository.AuctionRepository,
	slotRepo repository.SlotRepository,
	promotionRepo repository.PromotionRepository,
	moderationRepo repository.ModerationRepository,
) *Service {
	return &Service{
		productRepo:    productRepo,
		betRepo:        betRepo,
		auctionRepo:    auctionRepo,
		slotRepo:       slotRepo,
		promotionRepo:  promotionRepo,
		moderationRepo: moderationRepo,
	}
}

// ListProductsBy lists products by seller
func (s *Service) ListProductsBy(ctx context.Context, sellerID int64, categoryID string, page, perPage int) ([]*entity.ProductItem, int, error) {
	rows, total, err := s.productRepo.ListBySeller(ctx, sellerID, categoryID, page, perPage)
	if err != nil {
		return nil, 0, err
	}
	items := make([]*entity.ProductItem, len(rows))
	for i, r := range rows {
		img := ""
		if r.Image != nil {
			img = *r.Image
		}
		items[i] = &entity.ProductItem{
			ID:           r.ID,
			NmID:         r.NmID,
			Name:         r.Name,
			Image:        img,
			Price:        r.Price,
			OldPrice:     r.Price,
			Discount:     int32(r.Discount),
			CategoryName: r.CategoryName,
		}
	}
	return items, total, nil
}

// GetSellerActions gets seller actions (promotions)
func (s *Service) GetSellerActions(ctx context.Context, sellerID int64) ([]*entity.SellerAction, error) {
	// Return active/ready promotions; full impl would filter by promotion status/dates
	// Stub: would use promotionRepo list by status RUNNING or READY_TO_START
	return nil, nil
}

// GetSellerBetsList gets seller bets/applications
func (s *Service) GetSellerBetsList(ctx context.Context, sellerID int64, promotionID int64, status string) ([]*entity.SellerBet, error) {
	slots, err := s.slotRepo.BySellerID(ctx, sellerID, &promotionID)
	if err != nil {
		return nil, err
	}
	out := make([]*entity.SellerBet, 0, len(slots))
	for _, slot := range slots {
		if status != "" && slot.Status != status {
			continue
		}
		item := &entity.SellerBet{
			ID:          slot.ID,
			SlotID:      slot.ID,
			PromotionID: slot.PromotionID,
			SegmentID:   slot.SegmentID,
			Status:      slot.Status,
		}
		if slot.Price != nil {
			item.Price = *slot.Price
		}
		out = append(out, item)
	}
	return out, nil
}

// MakeBet makes a bet (auction) or buys fixed slot (product_id)
func (s *Service) MakeBet(ctx context.Context, sellerID, slotID, amount, productID int64) (bool, string, error) {
	slot, err := s.slotRepo.GetByID(ctx, slotID)
	if err != nil {
		return false, "", err
	}
	if slot == nil {
		return false, "slot not found", nil
	}
	if slot.Status != "available" {
		return false, "slot not available", nil
	}
	promoRow, err := s.promotionRepo.GetByID(ctx, slot.PromotionID)
	if err != nil {
		return false, "", err
	}
	if promoRow == nil {
		return false, "promotion not found", nil
	}
	pricingModel := entity.ParsePricingModel(promoRow.PricingModel)

	if pricingModel == entity.PricingModelAuction {
		auctionID, minPrice, bidStep, _, _, err := s.auctionRepo.GetByPromotionID(ctx, slot.PromotionID)
		if err != nil {
			return false, "", err
		}
		if auctionID == 0 {
			return false, "auction not found", nil
		}
		if amount < minPrice {
			return false, fmt.Sprintf("bid must be >= %d", minPrice), nil
		}
		if bidStep > 0 && (amount-minPrice)%bidStep != 0 {
			return false, fmt.Sprintf("bid step is %d", bidStep), nil
		}
		if productID <= 0 {
			return false, "product_id required for bid", nil
		}
		prod, err := s.productRepo.GetByID(ctx, productID)
		if err != nil {
			return false, "", err
		}
		if prod == nil || prod.SellerID != sellerID {
			return false, "product not found or not yours", nil
		}
		_, err = s.betRepo.Create(ctx, auctionID, slotID, sellerID, productID, amount)
		if err != nil {
			return false, "", err
		}
		return true, "ok", nil
	}

	// Fixed price: create moderation application
	if productID <= 0 {
		return false, "product_id required", nil
	}
	prod, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return false, "", err
	}
	if prod == nil || prod.SellerID != sellerID {
		return false, "product not found or not yours", nil
	}
	row := &repository.ModerationRow{
		PromotionID: slot.PromotionID,
		SegmentID:   slot.SegmentID,
		SlotID:      slot.ID,
		SellerID:    sellerID,
		ProductID:   productID,
		Discount:    prod.Discount,
		Status:      "pending",
	}
	_, err = s.moderationRepo.Create(ctx, row)
	if err != nil {
		return false, "", err
	}
	// Mark slot as moderation
	slot.Status = "moderation"
	slot.SellerID = &sellerID
	slot.ProductID = &productID
	_ = s.slotRepo.Update(ctx, slot)
	return true, "pending_moderation", nil
}

// RemoveBet removes a bet or application
func (s *Service) RemoveBet(ctx context.Context, sellerID, slotID int64) (bool, error) {
	slot, err := s.slotRepo.GetByID(ctx, slotID)
	if err != nil {
		return false, err
	}
	if slot == nil {
		return false, errors.New("slot not found")
	}
	if slot.SellerID == nil || *slot.SellerID != sellerID {
		return false, errors.New("not your slot")
	}
	if slot.Status == "moderation" {
		// Cancel moderation and free slot
		slot.Status = "available"
		slot.SellerID = nil
		slot.ProductID = nil
		return true, s.slotRepo.Update(ctx, slot)
	}
	if slot.Status == "pending" || slot.AuctionID != nil {
		err = s.betRepo.DeleteBySlotAndSeller(ctx, slotID, sellerID)
		if err != nil {
			return false, err
		}
		slot.Status = "available"
		slot.SellerID = nil
		slot.ProductID = nil
		return true, s.slotRepo.Update(ctx, slot)
	}
	return false, errors.New("cannot remove")
}
