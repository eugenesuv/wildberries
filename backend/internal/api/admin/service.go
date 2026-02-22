package admin

import (
	"context"
	"encoding/json"
	"log"

	"wildberries/backend/internal/entity"
	"wildberries/backend/internal/service/promotion"
	desc "wildberries/backend/pkg/admin"
)

// Service handles admin API requests
type Service struct {
	promotionService *promotion.Service
	desc.UnimplementedModerationServiceServer
	desc.UnimplementedPollAdminServiceServer
	desc.UnimplementedPromotionAdminServiceServer
	desc.UnimplementedSegmentAdminServiceServer
}

// New creates a new admin service
func New(promotionService *promotion.Service) *Service {
	return &Service{
		promotionService: promotionService,
	}
}

// CreatePromotion creates a new promotion
func (s *Service) CreatePromotion(ctx context.Context, req *desc.CreatePromotionRequest) (*desc.CreatePromotionResponse, error) {
	log.Println("create promotion")
	promo := &entity.Promotion{
		Name:               req.Name,
		Description:        req.Description,
		Theme:              req.Theme,
		DateFrom:           req.DateFrom,
		DateTo:             req.DateTo,
		IdentificationMode: entity.ParseIdentificationMode(req.IdentificationMode),
		PricingModel:       entity.ParsePricingModel(req.PricingModel),
		SlotCount:          int(req.SlotCount),
		Discount:           int(req.Discount),
		StopFactors:        entity.StopFactors{Factors: req.StopFactors},
	}
	id, err := s.promotionService.CreatePromotion(ctx, promo)
	if err != nil {
		return nil, err
	}
	return &desc.CreatePromotionResponse{
		Id:     id,
		Status: entity.PromotionStatusNotReady.String(),
	}, nil
}

// GetPromotion gets a promotion by ID
func (s *Service) GetPromotion(ctx context.Context, req *desc.GetPromotionRequest) (*desc.GetPromotionResponse, error) {
	promo, err := s.promotionService.GetPromotion(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	resp := &desc.GetPromotionResponse{
		Id:                 promo.ID,
		Name:               promo.Name,
		Description:        promo.Description,
		Theme:              promo.Theme,
		Status:             promo.Status.String(),
		DateFrom:           promo.DateFrom,
		DateTo:             promo.DateTo,
		IdentificationMode: promo.IdentificationMode.APIString(),
		PricingModel:       promo.PricingModel.APIString(),
		SlotCount:          int32(promo.SlotCount),
		Discount:           int32(promo.Discount),
		StopFactors:        promo.StopFactors.Factors,
	}
	// Segments, FixedPrices, Poll filled by service if needed
	segments, err := s.promotionService.GetPromotionSegments(ctx, req.Id)
	if err == nil && len(segments) > 0 {
		resp.Segments = make([]*desc.SegmentWithOrder, len(segments))
		for i, seg := range segments {
			resp.Segments[i] = &desc.SegmentWithOrder{
				Id:           seg.ID,
				Name:         seg.Name,
				CategoryName: seg.CategoryName,
				OrderIndex:   seg.OrderIndex,
			}
		}
	}
	if promo.FixedPrices != nil {
		resp.FixedPrices = promo.FixedPrices
	}
	return resp, nil
}

// UpdatePromotion updates a promotion
func (s *Service) UpdatePromotion(ctx context.Context, req *desc.UpdatePromotionRequest) (*desc.UpdatePromotionResponse, error) {
	promo, err := s.promotionService.GetPromotion(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		promo.Name = *req.Name
	}
	if req.Description != nil {
		promo.Description = *req.Description
	}
	if req.Theme != nil {
		promo.Theme = *req.Theme
	}
	if req.DateFrom != nil {
		promo.DateFrom = *req.DateFrom
	}
	if req.DateTo != nil {
		promo.DateTo = *req.DateTo
	}
	if req.IdentificationMode != nil {
		promo.IdentificationMode = entity.ParseIdentificationMode(*req.IdentificationMode)
	}
	if req.PricingModel != nil {
		promo.PricingModel = entity.ParsePricingModel(*req.PricingModel)
	}
	if req.SlotCount != nil {
		promo.SlotCount = int(*req.SlotCount)
	}
	if req.Discount != nil {
		promo.Discount = int(*req.Discount)
	}
	if len(req.StopFactors) > 0 {
		promo.StopFactors = entity.StopFactors{Factors: req.StopFactors}
	}
	err = s.promotionService.UpdatePromotion(ctx, promo)
	if err != nil {
		return nil, err
	}
	return &desc.UpdatePromotionResponse{}, nil
}

// DeletePromotion deletes a promotion
func (s *Service) DeletePromotion(ctx context.Context, req *desc.DeletePromotionRequest) (*desc.DeletePromotionResponse, error) {
	err := s.promotionService.DeletePromotion(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &desc.DeletePromotionResponse{}, nil
}

// SetFixedPrices sets fixed prices for promotion slots
func (s *Service) SetFixedPrices(ctx context.Context, req *desc.SetFixedPricesRequest) (*desc.SetFixedPricesResponse, error) {
	prices := make(map[int32]int64)
	for _, e := range req.Prices {
		prices[e.Position] = e.Price
	}
	err := s.promotionService.SetFixedPrices(ctx, req.PromotionId, prices)
	if err != nil {
		return nil, err
	}
	return &desc.SetFixedPricesResponse{}, nil
}

// ChangeStatus changes promotion status
func (s *Service) ChangeStatus(ctx context.Context, req *desc.ChangeStatusRequest) (*desc.ChangeStatusResponse, error) {
	status := entity.ParsePromotionStatus(req.Status)
	err := s.promotionService.ChangeStatus(ctx, req.PromotionId, status)
	if err != nil {
		return nil, err
	}
	return &desc.ChangeStatusResponse{}, nil
}

// SetSlotProduct sets product in slot (WB curation)
func (s *Service) SetSlotProduct(ctx context.Context, req *desc.SetSlotProductRequest) (*desc.SetSlotProductResponse, error) {
	err := s.promotionService.SetSlotProduct(ctx, req.SegmentId, req.SlotId, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &desc.SetSlotProductResponse{}, nil
}

// --- SegmentAdminService ---

// GenerateSegments generates segments for a promotion (AI or stub)
func (s *Service) GenerateSegments(ctx context.Context, req *desc.GenerateSegmentsRequest) (*desc.GenerateSegmentsResponse, error) {
	// Stub: would call AI; return empty for now
	return &desc.GenerateSegmentsResponse{Segments: nil}, nil
}

// CreateSegment creates a segment
func (s *Service) CreateSegment(ctx context.Context, req *desc.CreateSegmentRequest) (*desc.CreateSegmentResponse, error) {
	id, err := s.promotionService.CreateSegment(ctx, req.PromotionId, req.Name, req.CategoryName, req.OrderIndex)
	if err != nil {
		return nil, err
	}
	return &desc.CreateSegmentResponse{Id: id, Name: req.Name, CategoryName: req.CategoryName}, nil
}

// UpdateSegment updates a segment
func (s *Service) UpdateSegment(ctx context.Context, req *desc.UpdateSegmentRequest) (*desc.UpdateSegmentResponse, error) {
	var name, categoryName *string
	var orderIndex *int32
	if req.Name != nil {
		name = req.Name
	}
	if req.CategoryName != nil {
		categoryName = req.CategoryName
	}
	if req.OrderIndex != nil {
		orderIndex = req.OrderIndex
	}
	err := s.promotionService.UpdateSegment(ctx, req.PromotionId, req.SegmentId, name, categoryName, orderIndex)
	if err != nil {
		return nil, err
	}
	return &desc.UpdateSegmentResponse{}, nil
}

// DeleteSegment deletes a segment
func (s *Service) DeleteSegment(ctx context.Context, req *desc.DeleteSegmentRequest) (*desc.DeleteSegmentResponse, error) {
	err := s.promotionService.DeleteSegment(ctx, req.SegmentId)
	if err != nil {
		return nil, err
	}
	return &desc.DeleteSegmentResponse{}, nil
}

// ShuffleSegmentCategories shuffles categories
func (s *Service) ShuffleSegmentCategories(ctx context.Context, req *desc.ShuffleSegmentCategoriesRequest) (*desc.ShuffleSegmentCategoriesResponse, error) {
	err := s.promotionService.ShuffleSegmentCategories(ctx, req.PromotionId)
	if err != nil {
		return nil, err
	}
	return &desc.ShuffleSegmentCategoriesResponse{}, nil
}

// --- ModerationService ---

// GetApplications returns moderation applications
func (s *Service) GetApplications(ctx context.Context, req *desc.GetModerationApplicationsRequest) (*desc.GetModerationApplicationsResponse, error) {
	rows, err := s.promotionService.GetModerationApplications(ctx, req.PromotionId, req.Status)
	if err != nil {
		return nil, err
	}
	out := make([]*desc.ModerationApplication, len(rows))
	for i, r := range rows {
		var stopFactors []string
		if len(r.StopFactors) > 0 {
			_ = json.Unmarshal(r.StopFactors, &stopFactors)
		}
		out[i] = &desc.ModerationApplication{
			Id:          r.ID,
			SellerId:    r.SellerID,
			SegmentId:   r.SegmentID,
			SlotId:      r.SlotID,
			ProductName: "", // would load from product
			Price:       0,
			Discount:    int32(r.Discount),
			StopFactors: stopFactors,
			Status:      r.Status,
		}
	}
	return &desc.GetModerationApplicationsResponse{Applications: out}, nil
}

// Approve approves a moderation application
func (s *Service) Approve(ctx context.Context, req *desc.ApproveModerationRequest) (*desc.ApproveModerationResponse, error) {
	err := s.promotionService.ApproveModeration(ctx, req.ApplicationId, nil)
	if err != nil {
		return nil, err
	}
	return &desc.ApproveModerationResponse{}, nil
}

// Reject rejects a moderation application
func (s *Service) Reject(ctx context.Context, req *desc.RejectModerationRequest) (*desc.RejectModerationResponse, error) {
	err := s.promotionService.RejectModeration(ctx, req.ApplicationId, req.Reason, nil)
	if err != nil {
		return nil, err
	}
	return &desc.RejectModerationResponse{}, nil
}
