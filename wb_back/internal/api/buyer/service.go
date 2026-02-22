package buyer

import (
	"context"
	"errors"

	"wildberries/internal/service/buyer"
	desc "wildberries/pkg/buyer"
	commonpb "wildberries/pkg/common"
)

// Service handles buyer API requests
type Service struct {
	buyerService *buyer.Service
	desc.UnimplementedBuyerPromotionServiceServer
	desc.UnimplementedIdentificationServiceServer
}

// New creates a new buyer service
func New(buyerService *buyer.Service) *Service {
	return &Service{
		buyerService: buyerService,
	}
}

// GetCurrentPromotion gets the current promotion
func (s *Service) GetCurrentPromotion(ctx context.Context, req *desc.GetCurrentPromotionRequest) (*desc.GetCurrentPromotionResponse, error) {
	promotion, err := s.buyerService.GetCurrentPromotion(ctx)
	if err != nil {
		return nil, err
	}
	if promotion == nil {
		return &desc.GetCurrentPromotionResponse{}, nil
	}
	segments, _ := s.buyerService.GetCurrentPromotionSegments(ctx, promotion.ID)
	resp := &desc.GetCurrentPromotionResponse{
		Id:          promotion.ID,
		Name:        promotion.Name,
		Description: promotion.Description,
		Theme:       promotion.Theme,
		Status:      promotion.Status.String(),
		DateFrom:    promotion.DateFrom,
		DateTo:      promotion.DateTo,
	}
	if len(segments) > 0 {
		resp.Segments = make([]*commonpb.Segment, len(segments))
		for i, seg := range segments {
			resp.Segments[i] = &commonpb.Segment{
				Id:           seg.ID,
				Name:         seg.Name,
				CategoryName: seg.CategoryName,
				OrderIndex:   seg.OrderIndex,
			}
		}
	}
	return resp, nil
}

// GetSegmentProducts gets products for a segment
func (s *Service) GetSegmentProducts(ctx context.Context, req *desc.GetSegmentProductsRequest) (*desc.GetSegmentProductsResponse, error) {
	// Convert request filters
	filters := &buyer.ProductFilters{
		Category:      req.Category,
		OnlyDiscounts: req.OnlyDiscounts,
		Sort:          req.Sort,
		Page:          int(req.Page),
		PerPage:       int(req.PerPage),
	}

	// Call service
	items, total, err := s.buyerService.GetSegmentProducts(ctx, req.PromotionId, req.SegmentId, filters)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseItems := make([]*commonpb.ProductItem, len(items))
	for i, item := range items {
		responseItems[i] = &commonpb.ProductItem{
			Id:       item.ID,
			Name:     item.Name,
			Image:    item.Image,
			Price:    item.Price,
			OldPrice: item.OldPrice,
			Discount: item.Discount,
			Badge:    item.Badge,
		}
	}

	return &desc.GetSegmentProductsResponse{
		Items:   responseItems,
		Total:   int32(total),
		Page:    int32(filters.Page),
		PerPage: int32(filters.PerPage),
	}, nil
}

func (s *Service) StartIdentification(ctx context.Context, req *desc.StartIdentificationRequest) (*desc.StartIdentificationResponse, error) {
	result, err := s.buyerService.StartIdentification(ctx, req.PromotionId)
	if err != nil {
		return nil, err
	}
	if result == nil {
		return &desc.StartIdentificationResponse{}, nil
	}

	resp := &desc.StartIdentificationResponse{Method: result.Method}
	if result.Method == "user_profile" {
		resp.PollOrSegment = &desc.StartIdentificationResponse_ResultSegmentId{
			ResultSegmentId: result.ResultSegmentID,
		}
		return resp, nil
	}

	poll := &desc.Poll{}
	for _, q := range result.Questions {
		pbQ := &desc.PollQuestion{
			Id:   q.ID,
			Text: q.Text,
		}
		for _, opt := range q.Options {
			pbQ.Options = append(pbQ.Options, &desc.PollOption{
				Id:    opt.ID,
				Text:  opt.Text,
				Value: opt.Value,
			})
		}
		poll.Questions = append(poll.Questions, pbQ)
	}
	resp.PollOrSegment = &desc.StartIdentificationResponse_Poll{Poll: poll}
	return resp, nil
}

func (s *Service) Answer(ctx context.Context, req *desc.AnswerRequest) (*desc.AnswerResponse, error) {
	nextQ, resultSegment, err := s.buyerService.AnswerIdentification(ctx, req.PromotionId, req.QuestionId, req.OptionId)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return nil, err
		}
		return nil, err
	}
	return &desc.AnswerResponse{
		NextQuestionId: nextQ,
		ResultSegmentId: resultSegment,
	}, nil
}
