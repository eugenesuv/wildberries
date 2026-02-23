package buyer

import (
	"context"
	"errors"

	"wildberries/internal/entity"
	"wildberries/internal/repository"
)

// Service handles buyer business logic
type Service struct {
	productRepo   repository.ProductRepository
	promotionRepo repository.PromotionRepository
	slotRepo      repository.SlotRepository
	segmentRepo   repository.SegmentRepository
	pollRepo      repository.PollRepository
}

// New creates a new buyer service
func New(
	productRepo repository.ProductRepository,
	promotionRepo repository.PromotionRepository,
	slotRepo repository.SlotRepository,
	segmentRepo repository.SegmentRepository,
	pollRepo repository.PollRepository,
) *Service {
	return &Service{
		productRepo:   productRepo,
		promotionRepo: promotionRepo,
		slotRepo:      slotRepo,
		segmentRepo:   segmentRepo,
		pollRepo:      pollRepo,
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
func (s *Service) GetSegmentProducts(ctx context.Context, promotionID, segmentID int64, filters *ProductFilters) ([]*entity.ProductItem, int, bool, error) {
	slots, err := s.slotRepo.BySegmentID(ctx, segmentID, true)
	if err != nil {
		return nil, 0, false, err
	}
	promoRow, err := s.promotionRepo.GetByID(ctx, promotionID)
	if err != nil {
		return nil, 0, false, err
	}
	completed := false
	promoDiscount := 0
	if promoRow != nil {
		promoDiscount = promoRow.Discount
		completed = entity.ParsePromotionStatus(promoRow.Status) == entity.PromotionStatusCompleted
	}
	if len(slots) == 0 {
		return nil, 0, completed, nil
	}
	var productIDs []int64
	for _, slot := range slots {
		if slot.ProductID != nil && *slot.ProductID > 0 {
			productIDs = append(productIDs, *slot.ProductID)
		}
	}
	if len(productIDs) == 0 {
		return nil, 0, completed, nil
	}
	productRows, err := s.productRepo.GetByIDs(ctx, productIDs, repository.ProductFilters{
		Category:      filters.Category,
		OnlyDiscounts: filters.OnlyDiscounts,
		Sort:          filters.Sort,
	})
	if err != nil {
		return nil, 0, completed, err
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
	return items, total, completed, nil
}

// ProductFilters represents filters for product queries
type ProductFilters struct {
	Category      string
	OnlyDiscounts bool
	Sort          string
	Page          int
	PerPage       int
}

type IdentificationStart struct {
	Method          string
	Questions       []PollQuestion
	ResultSegmentID int64
}

type PollQuestion struct {
	ID      int64
	Text    string
	Options []PollOption
}

type PollOption struct {
	ID    int64
	Text  string
	Value string
}

func (s *Service) StartIdentification(ctx context.Context, promotionID int64) (*IdentificationStart, error) {
	promo, err := s.promotionRepo.GetByID(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	if promo == nil {
		return nil, errors.New("promotion not found")
	}
	if promo.IdentificationMode == "user_profile" {
		segmentID, err := s.firstSegmentID(ctx, promotionID)
		if err != nil {
			return nil, err
		}
		return &IdentificationStart{
			Method:          "user_profile",
			ResultSegmentID: segmentID,
		}, nil
	}

	questions, err := s.buildPollQuestions(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	return &IdentificationStart{
		Method:    "questions",
		Questions: questions,
	}, nil
}

func (s *Service) AnswerIdentification(ctx context.Context, promotionID, questionID, optionID int64) (int64, int64, error) {
	questions, err := s.buildPollQuestions(ctx, promotionID)
	if err != nil {
		return 0, 0, err
	}
	if len(questions) == 0 {
		segmentID, err := s.firstSegmentID(ctx, promotionID)
		return 0, segmentID, err
	}

	var idx = -1
	for i, q := range questions {
		if q.ID == questionID {
			idx = i
			valid := false
			for _, opt := range q.Options {
				if opt.ID == optionID {
					valid = true
					break
				}
			}
			if !valid {
				return 0, 0, errors.New("invalid option for question")
			}
			break
		}
	}
	if idx == -1 {
		return 0, 0, errors.New("question not found")
	}
	if idx < len(questions)-1 {
		return questions[idx+1].ID, 0, nil
	}
	segmentID, err := s.firstSegmentID(ctx, promotionID)
	if err != nil {
		return 0, 0, err
	}
	return 0, segmentID, nil
}

func (s *Service) buildPollQuestions(ctx context.Context, promotionID int64) ([]PollQuestion, error) {
	if s.pollRepo == nil {
		return nil, nil
	}
	qRows, err := s.pollRepo.QuestionsByPromotion(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	if len(qRows) == 0 {
		return nil, nil
	}
	ids := make([]int64, 0, len(qRows))
	for _, q := range qRows {
		ids = append(ids, q.ID)
	}
	optRows, err := s.pollRepo.OptionsByQuestionIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	optsByQuestion := make(map[int64][]PollOption, len(qRows))
	for _, o := range optRows {
		optsByQuestion[o.QuestionID] = append(optsByQuestion[o.QuestionID], PollOption{
			ID:    o.ID,
			Text:  o.Text,
			Value: o.Value,
		})
	}
	out := make([]PollQuestion, 0, len(qRows))
	for _, q := range qRows {
		out = append(out, PollQuestion{
			ID:      q.ID,
			Text:    q.Text,
			Options: optsByQuestion[q.ID],
		})
	}
	return out, nil
}

func (s *Service) firstSegmentID(ctx context.Context, promotionID int64) (int64, error) {
	segs, err := s.segmentRepo.ByPromotionID(ctx, promotionID)
	if err != nil {
		return 0, err
	}
	if len(segs) == 0 {
		return 0, nil
	}
	return segs[0].ID, nil
}
