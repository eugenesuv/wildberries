package promotion

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"
	"wildberries/internal/entity"
	"wildberries/internal/repository"

	"github.com/jackc/pgx/v5"
)

// Service handles promotion business logic
type Service struct {
	promotionRepo  repository.PromotionRepository
	segmentRepo    repository.SegmentRepository
	slotRepo       repository.SlotRepository
	productRepo    repository.ProductRepository
	moderationRepo repository.ModerationRepository
	auctionRepo    repository.AuctionRepository
	pollRepo       repository.PollRepository
}

// ChangeStatusValidationError represents a bad status change request (HTTP 400).
type ChangeStatusValidationError struct {
	Message string
}

func (e *ChangeStatusValidationError) Error() string {
	if e == nil || e.Message == "" {
		return "invalid status change request"
	}
	return e.Message
}

// ChangeStatusConflictError represents a status transition conflict (HTTP 409).
type ChangeStatusConflictError struct {
	Message string
}

func (e *ChangeStatusConflictError) Error() string {
	if e == nil || e.Message == "" {
		return "status transition conflict"
	}
	return e.Message
}

// New creates a new promotion service
func New(
	promotionRepo repository.PromotionRepository,
	segmentRepo repository.SegmentRepository,
	slotRepo repository.SlotRepository,
	productRepo repository.ProductRepository,
	moderationRepo repository.ModerationRepository,
	auctionRepo repository.AuctionRepository,
	pollRepo repository.PollRepository,
) *Service {
	return &Service{
		promotionRepo:  promotionRepo,
		segmentRepo:    segmentRepo,
		slotRepo:       slotRepo,
		productRepo:    productRepo,
		moderationRepo: moderationRepo,
		auctionRepo:    auctionRepo,
		pollRepo:       pollRepo,
	}
}

func rowToPromotion(row *repository.PromotionRow) (*entity.Promotion, error) {
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
	if len(row.StopFactors) > 0 {
		var factors []string
		if json.Unmarshal(row.StopFactors, &factors) != nil {
			_ = json.Unmarshal(row.StopFactors, &p.StopFactors)
		} else {
			p.StopFactors = entity.StopFactors{Factors: factors}
		}
	}
	if len(row.FixedPrices) > 0 {
		_ = json.Unmarshal(row.FixedPrices, &p.FixedPrices)
	}
	return p, nil
}

// GetPromotion gets a promotion by ID
func (s *Service) GetPromotion(ctx context.Context, id int64) (*entity.Promotion, error) {
	row, err := s.promotionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return rowToPromotion(row)
}

// ListPromotions returns all non-deleted promotions.
func (s *Service) ListPromotions(ctx context.Context) ([]*entity.Promotion, error) {
	rows, err := s.promotionRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]*entity.Promotion, 0, len(rows))
	for _, row := range rows {
		p, err := rowToPromotion(row)
		if err != nil {
			return nil, err
		}
		if p != nil {
			out = append(out, p)
		}
	}
	return out, nil
}

// GetPromotionSegments returns segments for a promotion
func (s *Service) GetPromotionSegments(ctx context.Context, promotionID int64) ([]*entity.Segment, error) {
	rows, err := s.segmentRepo.ByPromotionID(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	out := make([]*entity.Segment, len(rows))
	for i, r := range rows {
		out[i] = &entity.Segment{
			ID:           r.ID,
			Name:         r.Name,
			CategoryName: ptrStr(r.CategoryName),
			OrderIndex:   int32(r.OrderIndex),
		}
	}
	return out, nil
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// CreatePromotion creates a new promotion
func (s *Service) CreatePromotion(ctx context.Context, p *entity.Promotion) (int64, error) {
	row := &repository.PromotionRow{
		Name:               p.Name,
		Description:        p.Description,
		Theme:              p.Theme,
		DateFrom:           p.DateFrom,
		DateTo:             p.DateTo,
		Status:             entity.PromotionStatusNotReady.String(),
		IdentificationMode: p.IdentificationMode.APIString(),
		PricingModel:       p.PricingModel.APIString(),
		SlotCount:          p.SlotCount,
		Discount:           p.Discount,
		MinPrice:           p.MinPrice,
		BidStep:            p.BidStep,
		StopFactors:        mustJSON(p.StopFactors),
		FixedPrices:        mustJSON(p.FixedPrices),
	}
	return s.promotionRepo.Create(ctx, row)
}

func mustJSON(v interface{}) []byte {
	if v == nil {
		return []byte("null")
	}
	b, _ := json.Marshal(v)
	return b
}

// UpdatePromotion updates a promotion
func (s *Service) UpdatePromotion(ctx context.Context, p *entity.Promotion) error {
	row := &repository.PromotionRow{
		ID:                 p.ID,
		Name:               p.Name,
		Description:        p.Description,
		Theme:              p.Theme,
		DateFrom:           p.DateFrom,
		DateTo:             p.DateTo,
		Status:             p.Status.String(),
		IdentificationMode: p.IdentificationMode.APIString(),
		PricingModel:       p.PricingModel.APIString(),
		SlotCount:          p.SlotCount,
		Discount:           p.Discount,
		MinPrice:           p.MinPrice,
		BidStep:            p.BidStep,
		StopFactors:        mustJSON(p.StopFactors),
		FixedPrices:        mustJSON(p.FixedPrices),
	}
	return s.promotionRepo.Update(ctx, row)
}

// DeletePromotion soft-deletes a promotion
func (s *Service) DeletePromotion(ctx context.Context, id int64) error {
	return s.promotionRepo.SoftDelete(ctx, id)
}

// SetFixedPrices sets fixed prices for positions 1..slot_count
func (s *Service) SetFixedPrices(ctx context.Context, promotionID int64, prices map[int32]int64) error {
	return s.promotionRepo.SetFixedPrices(ctx, promotionID, mustJSON(prices))
}

func newChangeStatusValidationError(msg string) error {
	return &ChangeStatusValidationError{Message: msg}
}

func newChangeStatusConflictError(msg string) error {
	return &ChangeStatusConflictError{Message: msg}
}

// ChangeStatus validates status transitions and materializes slots/auction when going READY_TO_START.
func (s *Service) ChangeStatus(ctx context.Context, promotionID int64, status entity.PromotionStatus) error {
	promo, err := s.GetPromotion(ctx, promotionID)
	if err != nil {
		return err
	}

	if err := validatePromotionStatusTransition(promo.Status, status); err != nil {
		return err
	}
	if promo.Status == status {
		return nil
	}

	if status != entity.PromotionStatusReadyToStart {
		return s.promotionRepo.SetStatus(ctx, promotionID, status.String())
	}

	if err := s.validateReadyToStart(ctx, promo); err != nil {
		return err
	}
	if err := s.ensureSlotsForPromotion(ctx, promo); err != nil {
		return err
	}
	if err := s.ensureAuctionForReadyToStart(ctx, promo); err != nil {
		return err
	}
	return s.promotionRepo.SetStatus(ctx, promotionID, status.String())
}

func validatePromotionStatusTransition(from, to entity.PromotionStatus) error {
	if to == entity.PromotionStatusUnspecified {
		return newChangeStatusValidationError("invalid target status")
	}
	if from == entity.PromotionStatusUnspecified {
		return newChangeStatusValidationError("invalid current promotion status")
	}
	if from == to {
		return nil
	}

	switch from {
	case entity.PromotionStatusNotReady:
		if to == entity.PromotionStatusReadyToStart {
			return nil
		}
	case entity.PromotionStatusReadyToStart:
		if to == entity.PromotionStatusNotReady || to == entity.PromotionStatusRunning {
			return nil
		}
	case entity.PromotionStatusRunning:
		if to == entity.PromotionStatusPaused || to == entity.PromotionStatusCompleted {
			return nil
		}
	case entity.PromotionStatusPaused:
		if to == entity.PromotionStatusRunning || to == entity.PromotionStatusCompleted {
			return nil
		}
	case entity.PromotionStatusCompleted:
		// terminal state
	default:
		return newChangeStatusValidationError("unknown promotion status")
	}

	return newChangeStatusConflictError(
		fmt.Sprintf("invalid status transition: %s -> %s", from.String(), to.String()),
	)
}

func (s *Service) validateReadyToStart(ctx context.Context, promo *entity.Promotion) error {
	if promo == nil {
		return newChangeStatusValidationError("promotion not found")
	}

	dateFrom, err := parsePromotionTime(promo.DateFrom)
	if err != nil {
		return newChangeStatusValidationError("invalid date_from format")
	}
	dateTo, err := parsePromotionTime(promo.DateTo)
	if err != nil {
		return newChangeStatusValidationError("invalid date_to format")
	}
	if !dateFrom.Before(dateTo) {
		return newChangeStatusValidationError("date_from must be earlier than date_to")
	}
	if promo.SlotCount <= 0 {
		return newChangeStatusValidationError("slot_count must be greater than 0")
	}

	segments, err := s.segmentRepo.ByPromotionID(ctx, promo.ID)
	if err != nil {
		return err
	}
	if len(segments) == 0 {
		return newChangeStatusValidationError("at least one segment is required")
	}

	switch promo.PricingModel {
	case entity.PricingModelAuction:
		if promo.MinPrice == nil || *promo.MinPrice <= 0 {
			return newChangeStatusValidationError("auction min_price must be set and > 0")
		}
		if promo.BidStep == nil || *promo.BidStep <= 0 {
			return newChangeStatusValidationError("auction bid_step must be set and > 0")
		}
	case entity.PricingModelFixed:
		if promo.FixedPrices == nil {
			return newChangeStatusValidationError("fixed prices must be set for all slot positions")
		}
		for pos := 1; pos <= promo.SlotCount; pos++ {
			price, ok := promo.FixedPrices[int32(pos)]
			if !ok {
				return newChangeStatusValidationError(
					fmt.Sprintf("fixed price for position %d is required", pos),
				)
			}
			if price <= 0 {
				return newChangeStatusValidationError(
					fmt.Sprintf("fixed price for position %d must be > 0", pos),
				)
			}
		}
	default:
		return newChangeStatusValidationError("pricing_model must be set")
	}

	switch promo.IdentificationMode {
	case entity.IdentificationModeQuestions:
		poll, err := s.GetPromotionPoll(ctx, promo.ID)
		if err != nil {
			return err
		}
		if poll == nil || len(poll.Questions) == 0 {
			return newChangeStatusValidationError("questions identification requires at least one question")
		}
		optionCounts := make(map[int64]int, len(poll.Questions))
		for _, opt := range poll.Options {
			if opt != nil {
				optionCounts[opt.QuestionID]++
			}
		}
		for _, q := range poll.Questions {
			if q == nil {
				return newChangeStatusValidationError("questions identification contains an invalid question")
			}
			if optionCounts[q.ID] == 0 {
				return newChangeStatusValidationError(
					fmt.Sprintf("question %d must have at least one option", q.ID),
				)
			}
		}
	case entity.IdentificationModeUserProfile:
		// MVP fallback is allowed and treated as ready.
	default:
		return newChangeStatusValidationError("identification_mode must be set")
	}

	return nil
}

func (s *Service) ensureAuctionForReadyToStart(ctx context.Context, promo *entity.Promotion) error {
	if promo.PricingModel != entity.PricingModelAuction {
		return nil
	}
	if promo.MinPrice == nil || promo.BidStep == nil {
		return newChangeStatusValidationError("auction parameters are not configured")
	}

	auctionID, _, _, _, _, err := s.auctionRepo.GetByPromotionID(ctx, promo.ID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		auctionID, err = s.auctionRepo.Create(ctx, promo.ID, promo.DateFrom, promo.DateTo, *promo.MinPrice, *promo.BidStep)
		if err != nil {
			return err
		}
	}

	slots, err := s.slotRepo.ByPromotionID(ctx, promo.ID)
	if err != nil {
		return err
	}
	for _, slot := range slots {
		if slot.PricingType != "auction" || slot.AuctionID != nil {
			continue
		}
		slot.AuctionID = &auctionID
		if err := s.slotRepo.Update(ctx, slot); err != nil {
			return err
		}
	}
	return nil
}

func parsePromotionTime(value string) (time.Time, error) {
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999Z07:00",
		"2006-01-02 15:04:05Z07:00",
		"2006-01-02 15:04:05.999999999-07",
		"2006-01-02 15:04:05-07",
		"2006-01-02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported time format: %q", value)
}

func keySlot(segmentID int64, position int, pricingType string) string {
	return pricingType + ":" + strconv.FormatInt(segmentID, 10) + ":" + strconv.Itoa(position)
}

// SetSlotProduct sets product in slot (WB curation); seller_id is left nil
func (s *Service) SetSlotProduct(ctx context.Context, segmentID, slotID, productID int64) error {
	var sid *int64 // nil = WB curation
	return s.slotRepo.SetProduct(ctx, slotID, sid, productID, "occupied")
}

func (s *Service) ensureSlotsForPromotion(ctx context.Context, promo *entity.Promotion) error {
	segments, err := s.segmentRepo.ByPromotionID(ctx, promo.ID)
	if err != nil {
		return err
	}
	if len(segments) == 0 || promo.SlotCount <= 0 {
		return nil
	}

	existing, err := s.slotRepo.ByPromotionID(ctx, promo.ID)
	if err != nil {
		return err
	}
	exists := make(map[string]struct{}, len(existing))
	for _, slot := range existing {
		key := keySlot(slot.SegmentID, slot.Position, slot.PricingType)
		exists[key] = struct{}{}
	}

	for _, seg := range segments {
		for pos := 1; pos <= promo.SlotCount; pos++ {
			pricingType := promo.PricingModel.APIString()
			key := keySlot(seg.ID, pos, pricingType)
			if _, ok := exists[key]; ok {
				continue
			}
			row := &repository.SlotRow{
				PromotionID: promo.ID,
				SegmentID:   seg.ID,
				Position:    pos,
				PricingType: pricingType,
				Status:      "available",
			}
			if promo.PricingModel == entity.PricingModelFixed && promo.FixedPrices != nil {
				if price, ok := promo.FixedPrices[int32(pos)]; ok {
					priceCopy := price
					row.Price = &priceCopy
				}
			}
			if _, err := s.slotRepo.Create(ctx, row); err != nil {
				return err
			}
		}
	}
	return nil
}

// CreateSegment creates a segment for a promotion
func (s *Service) CreateSegment(ctx context.Context, promotionID int64, name, categoryName string, orderIndex int32) (int64, error) {
	row := &repository.SegmentRow{
		PromotionID:  promotionID,
		Name:         name,
		CategoryName: strPtr(categoryName),
		OrderIndex:   int(orderIndex),
	}
	return s.segmentRepo.Create(ctx, row)
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// UpdateSegment updates a segment
func (s *Service) UpdateSegment(ctx context.Context, promotionID, segmentID int64, name, categoryName *string, orderIndex *int32) error {
	seg, err := s.segmentRepo.GetByPromoAndSegment(ctx, promotionID, segmentID)
	if err != nil {
		return err
	}
	if name != nil {
		seg.Name = *name
	}
	if categoryName != nil {
		seg.CategoryName = categoryName
	}
	if orderIndex != nil {
		seg.OrderIndex = int(*orderIndex)
	}
	return s.segmentRepo.Update(ctx, seg)
}

// DeleteSegment deletes a segment
func (s *Service) DeleteSegment(ctx context.Context, segmentID int64) error {
	return s.segmentRepo.Delete(ctx, segmentID)
}

// ShuffleSegmentCategories shuffles category names across segments
func (s *Service) ShuffleSegmentCategories(ctx context.Context, promotionID int64) error {
	return s.segmentRepo.ShuffleCategories(ctx, promotionID)
}

// GetModerationApplications returns applications for moderation
func (s *Service) GetModerationApplications(ctx context.Context, promotionID int64, status string) ([]*repository.ModerationRow, error) {
	return s.moderationRepo.ListByPromotion(ctx, promotionID, status)
}

// ApproveModeration approves an application and sets slot to occupied
func (s *Service) ApproveModeration(ctx context.Context, applicationID int64, moderatorID *int64) error {
	return s.moderationRepo.ResolveApplication(ctx, applicationID, "approved", moderatorID)
}

// RejectModeration rejects an application and frees the slot
func (s *Service) RejectModeration(ctx context.Context, applicationID int64, reason string, moderatorID *int64) error {
	_ = reason // reason is accepted by API but not persisted in MVP schema
	return s.moderationRepo.ResolveApplication(ctx, applicationID, "rejected", moderatorID)
}

type PromotionPoll struct {
	Questions  []*repository.PollQuestionRow
	Options    []*repository.PollOptionRow
	AnswerTree []*repository.PollAnswerTreeRow
}

func (s *Service) GetPromotionPoll(ctx context.Context, promotionID int64) (*PromotionPoll, error) {
	if s.pollRepo == nil {
		return &PromotionPoll{}, nil
	}
	questions, err := s.pollRepo.QuestionsByPromotion(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	questionIDs := make([]int64, 0, len(questions))
	for _, q := range questions {
		questionIDs = append(questionIDs, q.ID)
	}
	options, err := s.pollRepo.OptionsByQuestionIDs(ctx, questionIDs)
	if err != nil {
		return nil, err
	}
	nodes, err := s.pollRepo.AnswerTreeByPromotion(ctx, promotionID)
	if err != nil {
		return nil, err
	}
	return &PromotionPoll{
		Questions:  questions,
		Options:    options,
		AnswerTree: nodes,
	}, nil
}

func (s *Service) SavePollQuestions(ctx context.Context, promotionID int64, questions []repository.PollQuestionInput) error {
	if s.pollRepo == nil {
		return nil
	}
	return s.pollRepo.SaveQuestions(ctx, promotionID, questions)
}

func (s *Service) SaveAnswerTree(ctx context.Context, promotionID int64, nodes []repository.PollAnswerTreeInput) error {
	if s.pollRepo == nil {
		return nil
	}
	return s.pollRepo.SaveAnswerTree(ctx, promotionID, nodes)
}
