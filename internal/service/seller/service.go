package seller

import (
	"context"
	"wildberries/internal/entity"
	"wildberries/internal/repository"
)

// Service handles seller business logic
type Service struct {
	productRepo repository.ProductRepository
	betRepo     repository.BetRepository
	auctionRepo repository.AuctionRepository
}

// New creates a new seller service
func New(
	productRepo repository.ProductRepository,
	betRepo repository.BetRepository,
	auctionRepo repository.AuctionRepository,
) *Service {
	return &Service{
		productRepo: productRepo,
		betRepo:     betRepo,
		auctionRepo: auctionRepo,
	}
}

// ListProductsBy lists products by seller
func (s *Service) ListProductsBy(ctx context.Context, sellerID int64, categoryID string, page, perPage int) ([]*entity.ProductItem, int, error) {
	rawProducts, total, err := s.productRepo.ListBySeller(ctx, sellerID, categoryID, page, perPage)
	if err != nil {
		return nil, 0, err
	}
	var res []*entity.ProductItem
	for _, r := range rawProducts {
		res = append(res, &entity.ProductItem{
			ID:   r.ID,
			Name: r.Name,
			Image: func(s *string) string {
				if s == nil {
					return ""
				}
				return *s
			}(r.Image),
			Price:        r.Price,
			OldPrice:     r.Price, // TODO ?
			Discount:     int32(r.Discount),
			Badge:        "", // TODO ?
			CategoryName: r.CategoryName,
		})
	}
	return res, total, nil
}

// GetSellerActions gets seller actions
func (s *Service) GetSellerActions(ctx context.Context, sellerID int64) ([]*entity.SellerAction, error) {

}

// GetSellerBetsList gets seller bets list
func (s *Service) GetSellerBetsList(ctx context.Context, sellerID int64, promotionID int64, status string) ([]*entity.SellerBet, error) {
	// Implementation would go here
	return nil, nil
}

// MakeBet makes a bet
func (s *Service) MakeBet(ctx context.Context, sellerID int64, slotID int64, amount int64, product *entity.ProductForSlot) (bool, string, error) {
	// Implementation would go here
	return false, "", nil
}

// RemoveBet removes a bet
func (s *Service) RemoveBet(ctx context.Context, sellerID int64, slotID int64) (bool, error) {
	// Implementation would go here
	return false, nil
}
