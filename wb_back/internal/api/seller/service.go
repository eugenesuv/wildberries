package seller

import (
	"context"

	"wildberries/internal/service/seller"
	desc "wildberries/pkg/seller"
)

// Service handles seller API requests
type Service struct {
	sellerService *seller.Service
	desc.UnimplementedSellerBetsServiceServer
	desc.UnimplementedSellerActionsServiceServer
	desc.UnimplementedSellerProductServiceServer
}

// New creates a new seller service
func New(sellerService *seller.Service) *Service {
	return &Service{
		sellerService: sellerService,
	}
}

func (s *Service) GetActionSegments(ctx context.Context, req *desc.GetActionSegmentsRequest) (*desc.GetActionSegmentsResponse, error) {
	items, err := s.sellerService.GetActionSegments(ctx, req.ActionId)
	if err != nil {
		return nil, err
	}
	resp := &desc.GetActionSegmentsResponse{
		ActionSegments: make([]*desc.ActionSegment, 0, len(items)),
	}
	for _, item := range items {
		resp.ActionSegments = append(resp.ActionSegments, &desc.ActionSegment{
			Id:         item.ID,
			Name:       item.Name,
			Category:   item.Category,
			Population: item.Population,
			BookedSlots: item.BookedSlots,
			TotalSlots: item.TotalSlots,
		})
	}
	return resp, nil
}

// ListProductsBy lists products by seller
func (s *Service) ListProductsBy(ctx context.Context, req *desc.ListProductsByRequest) (*desc.ListProductsByResponse, error) {
	// Call service
	items, total, err := s.sellerService.ListProductsBy(ctx, req.SellerId, req.CategoryId, int(req.Page), int(req.PerPage))
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseItems := make([]*desc.ProductListItem, len(items))
	for i, item := range items {
		responseItems[i] = &desc.ProductListItem{
			Id:           item.ID,
			NmId:         item.NmID,
			CategoryName: item.CategoryName,
			Name:         item.Name,
			Image:        item.Image,
			Price:        item.Price,
			Discount:     item.Discount,
		}
	}

	return &desc.ListProductsByResponse{
		Items:   responseItems,
		Total:   int32(total),
		Page:    int32(req.Page),
		PerPage: int32(req.PerPage),
	}, nil
}

// GetSellerActions gets seller actions
func (s *Service) GetSellerActions(ctx context.Context, req *desc.GetSellerActionsRequest) (*desc.GetSellerActionsResponse, error) {
	// Call service
	actions, err := s.sellerService.GetSellerActions(ctx, req.SellerId)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseActions := make([]*desc.SellerActionSummary, len(actions))
	for i, action := range actions {
		responseActions[i] = &desc.SellerActionSummary{
			Id:           action.ID,
			Name:         action.Name,
			Status:       action.Status,
			DateFrom:     action.DateFrom,
			DateTo:       action.DateTo,
			CategoryHint: action.CategoryHint,
			Theme:        action.Theme,
		}
	}

	return &desc.GetSellerActionsResponse{
		Actions: responseActions,
	}, nil
}

// GetSellerBetsList gets seller bets list
func (s *Service) GetSellerBetsList(ctx context.Context, req *desc.GetSellerBetsListRequest) (*desc.GetSellerBetsListResponse, error) {
	// Call service
	bets, err := s.sellerService.GetSellerBetsList(ctx, req.SellerId, req.PromotionId, req.Status)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseBets := make([]*desc.SellerBetItem, len(bets))
	for i, bet := range bets {
		responseBets[i] = &desc.SellerBetItem{
			Id:          bet.ID,
			PromotionId: bet.PromotionID,
			SegmentId:   bet.SegmentID,
			SlotId:      bet.SlotID,
			Bet:         bet.Bet,
			Price:       bet.Price,
			Status:      bet.Status,
			ProductName: bet.ProductName,
		}
	}

	return &desc.GetSellerBetsListResponse{
		Items: responseBets,
	}, nil
}

// MakeBet makes a bet (auction: amount; fixed: product_id)
func (s *Service) MakeBet(ctx context.Context, req *desc.MakeBetRequest) (*desc.MakeBetResponse, error) {
	success, message, err := s.sellerService.MakeBet(ctx, req.SellerId, req.SlotId, req.Amount, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &desc.MakeBetResponse{
		Success: success,
		Message: message,
	}, nil
}

// RemoveBet removes a bet
func (s *Service) RemoveBet(ctx context.Context, req *desc.RemoveBetRequest) (*desc.RemoveBetResponse, error) {
	// Call service
	success, err := s.sellerService.RemoveBet(ctx, req.SellerId, req.SlotId)
	if err != nil {
		return nil, err
	}

	return &desc.RemoveBetResponse{
		Success: success,
	}, nil
}
