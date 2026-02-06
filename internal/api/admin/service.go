package admin

import (
	"context"

	"wildberries/internal/entity"
	"wildberries/internal/service/promotion"
	desc "wildberries/pkg/admin"
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
	// Convert request to entity
	promotion := &entity.Promotion{
		Name:               req.Name,
		Description:        req.Description,
		Theme:              req.Theme,
		DateFrom:           req.DateFrom,
		DateTo:             req.DateTo,
		IdentificationMode: req.IdentificationMode,
		PricingModel:       req.PricingModel,
		SlotCount:          int(req.SlotCount),
		MinDiscount:        &req.MinDiscount,
		MaxDiscount:        &req.MaxDiscount,
	}

	// Call service
	id, err := s.promotionService.CreatePromotion(ctx, promotion)
	if err != nil {
		return nil, err
	}

	return &desc.CreatePromotionResponse{
		Id: id,
	}, nil
}

// GetPromotion gets a promotion by ID
func (s *Service) GetPromotion(ctx context.Context, req *desc.GetPromotionRequest) (*desc.GetPromotionResponse, error) {
	// Call service
	promotion, err := s.promotionService.GetPromotion(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	// Convert entity to response
	return &desc.GetPromotionResponse{
		Id:                 promotion.ID,
		Name:               promotion.Name,
		Description:        promotion.Description,
		Theme:              promotion.Theme,
		Status:             string(promotion.Status),
		DateFrom:           promotion.DateFrom,
		DateTo:             promotion.DateTo,
		IdentificationMode: string(promotion.IdentificationMode),
		PricingModel:       string(promotion.PricingModel),
		SlotCount:          int32(promotion.SlotCount),
		MinDiscount:        int32(*promotion.MinDiscount),
		MaxDiscount:        int32(*promotion.MaxDiscount),
	}, nil
}

// UpdatePromotion updates a promotion
func (s *Service) UpdatePromotion(ctx context.Context, req *desc.UpdatePromotionRequest) (*desc.UpdatePromotionResponse, error) {
	// Convert request to entity
	promotion := &entity.Promotion{
		ID:                 req.Id,
		Name:               *req.Name,
		Description:        *req.Description,
		Theme:              *req.Theme,
		DateFrom:           *req.DateFrom,
		DateTo:             *req.DateTo,
		IdentificationMode: entity.IdentificationMode(req.IdentificationMode),
		PricingModel:       entity.PricingModel(req.PricingModel),
		SlotCount:          int(req.SlotCount),
		MinDiscount:        &req.MinDiscount,
		MaxDiscount:        &req.MaxDiscount,
	}

	// Call service
	err := s.promotionService.UpdatePromotion(ctx, promotion)
	if err != nil {
		return nil, err
	}

	return &desc.UpdatePromotionResponse{}, nil
}

// DeletePromotion deletes a promotion
func (s *Service) DeletePromotion(ctx context.Context, req *desc.DeletePromotionRequest) (*desc.DeletePromotionResponse, error) {
	// Call service
	err := s.promotionService.DeletePromotion(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &desc.DeletePromotionResponse{}, nil
}
