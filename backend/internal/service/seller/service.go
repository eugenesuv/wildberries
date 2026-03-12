package seller

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
	"wildberries/internal/entity"
	"wildberries/internal/repository"

	"github.com/jackc/pgx/v5"
)

// Service handles seller business logic
type Service struct {
	productRepo    repository.ProductRepository
	betRepo        repository.BetRepository
	auctionRepo    repository.AuctionRepository
	slotRepo       repository.SlotRepository
	segmentRepo    repository.SegmentRepository
	promotionRepo  repository.PromotionRepository
	moderationRepo repository.ModerationRepository
}

// New creates a new seller service
func New(
	productRepo repository.ProductRepository,
	betRepo repository.BetRepository,
	auctionRepo repository.AuctionRepository,
	slotRepo repository.SlotRepository,
	segmentRepo repository.SegmentRepository,
	promotionRepo repository.PromotionRepository,
	moderationRepo repository.ModerationRepository,
) *Service {
	return &Service{
		productRepo:    productRepo,
		betRepo:        betRepo,
		auctionRepo:    auctionRepo,
		slotRepo:       slotRepo,
		segmentRepo:    segmentRepo,
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
	_ = sellerID // auth/ownership filtering is not implemented yet
	rows, err := s.promotionRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]*entity.SellerAction, 0, len(rows))
	for _, row := range rows {
		if row == nil {
			continue
		}
		if row.Status != "RUNNING" && row.Status != "READY_TO_START" {
			continue
		}
		categoryHint := ""
		segments, err := s.segmentRepo.ByPromotionID(ctx, row.ID)
		if err == nil && len(segments) > 0 && segments[0].CategoryName != nil {
			categoryHint = *segments[0].CategoryName
		}
		out = append(out, &entity.SellerAction{
			ID:           row.ID,
			Name:         row.Name,
			Status:       row.Status,
			DateFrom:     row.DateFrom,
			DateTo:       row.DateTo,
			CategoryHint: categoryHint,
			Theme:        row.Theme,
		})
	}
	return out, nil
}

type ActionSegmentSummary struct {
	ID          int64
	Name        string
	Category    string
	Population  int64
	BookedSlots int64
	TotalSlots  int64
}

func (s *Service) GetActionSegments(ctx context.Context, actionID int64) ([]*ActionSegmentSummary, error) {
	segs, err := s.segmentRepo.ByPromotionID(ctx, actionID)
	if err != nil {
		return nil, err
	}
	activePricingType, err := s.getPromotionPricingType(ctx, actionID)
	if err != nil {
		return nil, err
	}
	slots, err := s.slotRepo.ByPromotionID(ctx, actionID)
	if err != nil {
		return nil, err
	}
	type agg struct{ total, booked int64 }
	aggBySeg := map[int64]*agg{}
	for _, slot := range slots {
		if activePricingType != "" && strings.ToLower(slot.PricingType) != activePricingType {
			continue
		}
		a := aggBySeg[slot.SegmentID]
		if a == nil {
			a = &agg{}
			aggBySeg[slot.SegmentID] = a
		}
		a.total++
		if slot.Status != "available" {
			a.booked++
		}
	}
	out := make([]*ActionSegmentSummary, 0, len(segs))
	for _, seg := range segs {
		a := aggBySeg[seg.ID]
		if a == nil {
			a = &agg{}
		}
		category := ""
		if seg.CategoryName != nil {
			category = *seg.CategoryName
		}
		out = append(out, &ActionSegmentSummary{
			ID:          seg.ID,
			Name:        seg.Name,
			Category:    category,
			Population:  0,
			BookedSlots: a.booked,
			TotalSlots:  a.total,
		})
	}
	return out, nil
}

type SegmentSlotsMarket struct {
	Auction []AuctionSlotMarketItem
	Fixed   []FixedSlotMarketItem
}

type AuctionSlotMarketItem struct {
	SlotID        int64
	Position      int
	CurrentBid    int64
	MinBid        int64
	BidStep       int64
	TimeLeft      string
	TopBidderName string
}

type FixedSlotMarketItem struct {
	SlotID   int64
	Position int
	Price    int64
	Status   string
}

func (s *Service) GetSegmentSlotsMarket(ctx context.Context, actionID, segmentID int64) (*SegmentSlotsMarket, error) {
	if _, err := s.segmentRepo.GetByPromoAndSegment(ctx, actionID, segmentID); err != nil {
		return nil, err
	}

	activePricingType, err := s.getPromotionPricingType(ctx, actionID)
	if err != nil {
		return nil, err
	}

	slots, err := s.slotRepo.BySegmentID(ctx, segmentID, false)
	if err != nil {
		return nil, err
	}
	if activePricingType != "" {
		filtered := make([]*repository.SlotRow, 0, len(slots))
		for _, slot := range slots {
			if strings.ToLower(slot.PricingType) != activePricingType {
				continue
			}
			filtered = append(filtered, slot)
		}
		slots = filtered
	}

	var auctionMin, auctionStep int64
	var auctionDateFrom string
	var auctionDateTo string
	if activePricingType == "auction" && len(slots) > 0 {
		id, minPrice, bidStep, dateFrom, dateTo, err := s.auctionRepo.GetByPromotionID(ctx, slots[0].PromotionID)
		if err == nil && id > 0 {
			auctionMin = minPrice
			auctionStep = bidStep
			auctionDateFrom = dateFrom
			auctionDateTo = dateTo

			if err := s.finalizeSegmentAuctionIfNeeded(ctx, slots[0].PromotionID, segmentID, dateFrom, dateTo); err != nil {
				return nil, err
			}
			slots, err = s.slotRepo.BySegmentID(ctx, segmentID, false)
			if err != nil {
				return nil, err
			}
			if activePricingType != "" {
				filtered := make([]*repository.SlotRow, 0, len(slots))
				for _, slot := range slots {
					if strings.ToLower(slot.PricingType) != activePricingType {
						continue
					}
					filtered = append(filtered, slot)
				}
				slots = filtered
			}
		}
	}

	currentSegmentBid := int64(0)
	if activePricingType == "auction" {
		currentSegmentBid, err = s.getTopBidBySegment(ctx, actionID, segmentID, auctionDateFrom, auctionDateTo)
		if err != nil {
			return nil, err
		}
	}
	minBid := nextAuctionBidMin(auctionMin, auctionStep, currentSegmentBid)

	out := &SegmentSlotsMarket{
		Auction: make([]AuctionSlotMarketItem, 0),
		Fixed:   make([]FixedSlotMarketItem, 0),
	}
	for _, slot := range slots {
		switch strings.ToLower(slot.PricingType) {
		case "auction":
			out.Auction = append(out.Auction, AuctionSlotMarketItem{
				SlotID:        slot.ID,
				Position:      slot.Position,
				CurrentBid:    currentSegmentBid,
				MinBid:        minBid,
				BidStep:       auctionStep,
				TimeLeft:      formatTimeLeft(auctionDateTo),
				TopBidderName: "",
			})
		default:
			var price int64
			if slot.Price != nil {
				price = *slot.Price
			}
			out.Fixed = append(out.Fixed, FixedSlotMarketItem{
				SlotID:   slot.ID,
				Position: slot.Position,
				Price:    price,
				Status:   slot.Status,
			})
		}
	}
	return out, nil
}

func (s *Service) getPromotionPricingType(ctx context.Context, promotionID int64) (string, error) {
	promo, err := s.promotionRepo.GetByID(ctx, promotionID)
	if err != nil {
		return "", err
	}
	if promo == nil {
		return "", errors.New("promotion not found")
	}

	pricingType := entity.ParsePricingModel(promo.PricingModel).APIString()
	if pricingType == "unspecified" {
		return "", nil
	}
	return pricingType, nil
}

// GetSellerBetsList gets seller bets/applications
func (s *Service) GetSellerBetsList(ctx context.Context, sellerID int64, promotionID int64, status string) ([]*entity.SellerBet, error) {
	slots, err := s.slotRepo.ByPromotionID(ctx, promotionID)
	if err != nil {
		return nil, err
	}

	slotByID := make(map[int64]*repository.SlotRow, len(slots))
	out := make([]*entity.SellerBet, 0, len(slots))
	for _, slot := range slots {
		slotByID[slot.ID] = slot

		if strings.ToLower(slot.PricingType) == "auction" {
			continue
		}
		if slot.SellerID == nil || *slot.SellerID != sellerID {
			continue
		}
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

	auctionBets, err := s.betRepo.ListBestBySeller(ctx, sellerID, promotionID)
	if err != nil {
		return nil, err
	}
	for _, bet := range auctionBets {
		slot := slotByID[bet.SlotID]
		if slot == nil || strings.ToLower(slot.PricingType) != "auction" {
			continue
		}
		if status != "" && slot.Status != status {
			continue
		}

		out = append(out, &entity.SellerBet{
			ID:          bet.ID,
			SlotID:      slot.ID,
			PromotionID: slot.PromotionID,
			SegmentID:   slot.SegmentID,
			Status:      slot.Status,
			Bet:         bet.Bet,
		})
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
		auctionID, minPrice, bidStep, auctionDateFrom, auctionDateTo, err := s.auctionRepo.GetByPromotionID(ctx, slot.PromotionID)
		if err != nil {
			return false, "", err
		}
		if auctionID == 0 {
			return false, "auction not found", nil
		}

		if auctionEnded(auctionDateTo) {
			if err := s.finalizeSegmentAuctionIfNeeded(ctx, slot.PromotionID, slot.SegmentID, auctionDateFrom, auctionDateTo); err != nil {
				return false, "", err
			}
			return false, "auction finished", nil
		}

		currentBid, err := s.getTopBidBySegment(ctx, slot.PromotionID, slot.SegmentID, auctionDateFrom, auctionDateTo)
		if err != nil {
			return false, "", err
		}
		minAllowedBid := nextAuctionBidMin(minPrice, bidStep, currentBid)
		if amount < minAllowedBid {
			return false, fmt.Sprintf("bid must be >= %d", minAllowedBid), nil
		}
		stepBase := minPrice
		if currentBid > 0 {
			stepBase = currentBid
		}
		if bidStep > 0 && amount > stepBase && (amount-stepBase)%bidStep != 0 {
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

		topSellerID, topProductID, _, err := s.betRepo.TopBySlot(ctx, slotID)
		if err != nil {
			return false, "", err
		}
		slot.SellerID = &topSellerID
		slot.ProductID = &topProductID
		slot.Status = "available"
		if err := s.slotRepo.Update(ctx, slot); err != nil {
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
	if slot.AuctionID != nil {
		err = s.betRepo.DeleteBySlotAndSeller(ctx, slotID, sellerID)
		if err != nil {
			return false, err
		}

		topSellerID, topProductID, _, err := s.betRepo.TopBySlot(ctx, slotID)
		if err == nil {
			slot.Status = "available"
			slot.SellerID = &topSellerID
			slot.ProductID = &topProductID
			return true, s.slotRepo.Update(ctx, slot)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return false, err
		}

		slot.Status = "available"
		slot.SellerID = nil
		slot.ProductID = nil
		return true, s.slotRepo.Update(ctx, slot)
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
	if slot.Status == "pending" {
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

func formatTimeLeft(dateTo string) string {
	if dateTo == "" {
		return ""
	}

	t, err := parseAuctionTime(dateTo)
	if err != nil {
		return ""
	}
	d := time.Until(t)
	if d < 0 {
		return "0ч 0м"
	}
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	return strconv.Itoa(h) + "ч " + strconv.Itoa(m) + "м"
}

func parseAuctionTime(value string) (time.Time, error) {
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999Z07:00",
		"2006-01-02 15:04:05Z07:00",
		"2006-01-02 15:04:05.999999999-07",
		"2006-01-02 15:04:05-07",
		"2006-01-02 15:04:05+00",
		"2006-01-02 15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported auction time format: %q", value)
}

func auctionEnded(auctionDateTo string) bool {
	if auctionDateTo == "" {
		return false
	}
	auctionEndTime, err := parseAuctionTime(auctionDateTo)
	if err != nil {
		return false
	}
	return !time.Now().Before(auctionEndTime)
}

func (s *Service) getTopBidBySegment(ctx context.Context, promotionID, segmentID int64, auctionDateFrom, auctionDateTo string) (int64, error) {
	activeBets, err := s.listActiveBetsBySegment(ctx, promotionID, segmentID, auctionDateFrom, auctionDateTo)
	if err != nil {
		return 0, err
	}
	if len(activeBets) == 0 {
		return 0, nil
	}
	return activeBets[0].Bet, nil
}

func (s *Service) finalizeSegmentAuctionIfNeeded(ctx context.Context, promotionID, segmentID int64, auctionDateFrom, auctionDateTo string) error {
	if !auctionEnded(auctionDateTo) {
		return nil
	}

	slots, err := s.slotRepo.BySegmentID(ctx, segmentID, false)
	if err != nil {
		return err
	}

	auctionSlots := make([]*repository.SlotRow, 0)
	for _, slot := range slots {
		if strings.ToLower(slot.PricingType) == "auction" {
			auctionSlots = append(auctionSlots, slot)
		}
	}
	if len(auctionSlots) == 0 {
		return nil
	}

	needsFinalize := false
	for _, slot := range auctionSlots {
		if slot.Status == "available" {
			needsFinalize = true
			break
		}
	}
	if !needsFinalize {
		return nil
	}

	sort.Slice(auctionSlots, func(i, j int) bool {
		return auctionSlots[i].Position < auctionSlots[j].Position
	})

	activeBets, err := s.listActiveBetsBySegment(ctx, promotionID, segmentID, auctionDateFrom, auctionDateTo)
	if err != nil {
		return err
	}
	winners := make([]*repository.BetRow, 0, len(activeBets))
	seenOffers := make(map[string]struct{}, len(activeBets))
	for _, bet := range activeBets {
		offerKey := fmt.Sprintf("%d:%d", bet.SellerID, bet.ProductID)
		if _, exists := seenOffers[offerKey]; exists {
			continue
		}
		seenOffers[offerKey] = struct{}{}
		winners = append(winners, bet)
		if len(winners) >= len(auctionSlots) {
			break
		}
	}

	for _, slot := range auctionSlots {
		slot.Status = "rejected"
		slot.SellerID = nil
		slot.ProductID = nil
		slot.Price = nil
		if err := s.slotRepo.Update(ctx, slot); err != nil {
			return err
		}
	}

	for i, winner := range winners {
		if i >= len(auctionSlots) {
			break
		}

		slot := auctionSlots[i]
		slot.Status = "moderation"
		slot.SellerID = &winner.SellerID
		slot.ProductID = &winner.ProductID
		slotPrice := winner.Bet
		slot.Price = &slotPrice
		if err := s.slotRepo.Update(ctx, slot); err != nil {
			return err
		}

		discount := 0
		product, err := s.productRepo.GetByID(ctx, winner.ProductID)
		if err != nil {
			return err
		}
		if product != nil {
			discount = product.Discount
		}

		row := &repository.ModerationRow{
			PromotionID: promotionID,
			SegmentID:   segmentID,
			SlotID:      slot.ID,
			SellerID:    winner.SellerID,
			ProductID:   winner.ProductID,
			Discount:    discount,
			Status:      "pending",
		}
		if _, err := s.moderationRepo.Create(ctx, row); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) listActiveBetsBySegment(
	ctx context.Context,
	promotionID int64,
	segmentID int64,
	auctionDateFrom string,
	auctionDateTo string,
) ([]*repository.BetRow, error) {
	bets, err := s.betRepo.ListBySegment(ctx, promotionID, segmentID, 0)
	if err != nil {
		return nil, err
	}

	fromTime, fromErr := parseAuctionTime(auctionDateFrom)
	toTime, toErr := parseAuctionTime(auctionDateTo)
	if fromErr != nil || toErr != nil {
		return bets, nil
	}

	active := make([]*repository.BetRow, 0, len(bets))
	for _, bet := range bets {
		betTime, err := parseAuctionTime(bet.CreatedAt)
		if err != nil {
			continue
		}
		if betTime.Before(fromTime) || betTime.After(toTime) {
			continue
		}
		active = append(active, bet)
	}
	return active, nil
}

func (s *Service) getTopBid(ctx context.Context, slotID int64) (int64, error) {
	_, _, topBet, err := s.betRepo.TopBySlot(ctx, slotID)
	if err == nil {
		return topBet, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return 0, err
}

func nextAuctionBidMin(minPrice, bidStep, currentBid int64) int64 {
	if currentBid <= 0 {
		return minPrice
	}
	if bidStep > 0 {
		return currentBid + bidStep
	}
	return currentBid
}
