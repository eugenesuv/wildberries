package buyer

import (
	"context"

	"wildberries/internal/entity"
	"wildberries/internal/repository"
)

// Service handles buyer business logic
type Service struct {
	productRepo   repository.ProductRepository
	promotionRepo repository.PromotionRepository
	slotRepo      repository.SlotRepository
	segmentRepo   repository.SegmentRepository
}

// New creates a new buyer service
func New(productRepo repository.ProductRepository, promotionRepo repository.PromotionRepository, slotRepo repository.SlotRepository, segmentRepo repository.SegmentRepository) *Service {
	return &Service{
		productRepo:   productRepo,
		promotionRepo: promotionRepo,
		slotRepo:      slotRepo,
		segmentRepo:   segmentRepo,
	}
}

// GetCurrentPromotionSegments returns segments for a promotion (for buyer response)
func (s *Service) GetCurrentPromotionSegments(ctx context.Context, promotionID int64) ([]*entity.Segment, error) {
	rows, err := s.segmentRepo.ByPromotionID(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	out := make([]*entity.Segment, len(rows))
	for i, r := range rows {
		catName := ""
		if r.CategoryName != nil {
			catName = *r.CategoryName
		}
		out[i] = &entity.Segment{
			ID:           r.ID,
			Name:         r.Name,
			CategoryName: catName,
			OrderIndex:   int32(r.OrderIndex),
		}
	}
	return out, nil
}

// GetCurrentPromotion gets the current active promotion
func (s *Service) GetCurrentPromotion(ctx context.Context) (*entity.Promotion, error) {
	row, err := s.promotionRepo.GetActive(ctx)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, nil
	}
	p := &entity.Promotion{
		ID:                 row.ID,
		Name:               row.Name,
		Description:        row.Description,
		Theme:              row.Theme,
		DateFrom:           row.DateFrom,
		DateTo:             row.DateTo,
		Status:             entity.ParsePromotionStatus(row.Status),
		IdentificationMode: entity.ParseIdentificationMode(row.IdentificationMode),
		PricingModel:       entity.ParsePricingModel(row.PricingModel),
		SlotCount:          row.SlotCount,
		Discount:           row.Discount,
		MinPrice:           row.MinPrice,
		BidStep:            row.BidStep,
	}
	return p, nil
}

// GetSegmentProducts gets products for a segment (occupied slots); discount from WB or seller
func (s *Service) GetSegmentProducts(ctx context.Context, promotionID, segmentID int64, filters *ProductFilters) ([]*entity.ProductItem, int, error) {
	slots, err := s.slotRepo.BySegmentID(ctx, segmentID, true)
	if err != nil {
		return nil, 0, err
	}
	if len(slots) == 0 {
		return nil, 0, nil
	}
	promoRow, err := s.promotionRepo.GetByID(ctx, promotionID)
	if err != nil {
		return nil, 0, err
	}
	promoDiscount := 0
	if promoRow != nil {
		promoDiscount = promoRow.Discount
	}
	var productIDs []int64
	for _, slot := range slots {
		if slot.ProductID != nil && *slot.ProductID > 0 {
			productIDs = append(productIDs, *slot.ProductID)
		}
	}
	if len(productIDs) == 0 {
		return nil, 0, nil
	}
	productRows, err := s.productRepo.GetByIDs(ctx, productIDs, repository.ProductFilters{
		Category:      filters.Category,
		OnlyDiscounts: filters.OnlyDiscounts,
		Sort:          filters.Sort,
	})
	if err != nil {
		return nil, 0, err
	}
	// WB-filled slot (seller_id nil) uses promotion.discount; seller-filled uses product.discount
	productIDToWBDiscount := make(map[int64]bool)
	for _, slot := range slots {
		if slot.ProductID != nil && slot.SellerID == nil {
			productIDToWBDiscount[*slot.ProductID] = true
		}
	}
	items := make([]*entity.ProductItem, 0, len(productRows))
	for _, r := range productRows {
		discount := r.Discount
		if productIDToWBDiscount[r.ID] {
			discount = promoDiscount
		}
		img := ""
		if r.Image != nil {
			img = *r.Image
		}
		oldPrice := r.Price
		if discount > 0 {
			oldPrice = r.Price * 100 / int64(100-discount)
		}
		items = append(items, &entity.ProductItem{
			ID:           r.ID,
			NmID:         r.NmID,
			Name:         r.Name,
			Image:        img,
			Price:        r.Price,
			OldPrice:     oldPrice,
			Discount:     int32(discount),
			CategoryName: r.CategoryName,
		})
	}
	total := len(items)
	return items, total, nil
}

// ProductFilters represents filters for product queries
type ProductFilters struct {
	Category      string
	OnlyDiscounts bool
	Sort          string
	Page          int
	PerPage       int
}
