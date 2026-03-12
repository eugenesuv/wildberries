package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	"wildberries/internal/entity"

	"github.com/jackc/pgx/v5"
)

func (a *App) serveCustomHTTP(w http.ResponseWriter, r *http.Request) bool {
	path := r.URL.Path

	if r.Method == http.MethodGet && path == "/admin/promotions" {
		a.handleAdminListPromotions(w, r)
		return true
	}

	if strings.HasPrefix(path, "/admin/promotions/") {
		parts := splitPath(path)
		// /admin/promotions/{id}
		if len(parts) == 3 && parts[0] == "admin" && parts[1] == "promotions" {
			if r.Method == http.MethodGet {
				a.handleAdminGetPromotion(w, r, parts[2])
				return true
			}
			if r.Method == http.MethodPatch {
				a.handleAdminUpdatePromotion(w, r, parts[2])
				return true
			}
		}
		// /admin/promotions/{id}/segments/{segmentId}
		if len(parts) == 5 && parts[0] == "admin" && parts[1] == "promotions" && parts[3] == "segments" && r.Method == http.MethodPatch {
			a.handleAdminUpdateSegment(w, r, parts[2], parts[4])
			return true
		}
	}

	if strings.HasPrefix(path, "/admin/promotions/") && strings.HasSuffix(path, "/auction-params") {
		switch r.Method {
		case http.MethodGet:
			a.handleAdminGetAuctionParams(w, r)
		case http.MethodPut:
			a.handleAdminSetAuctionParams(w, r)
		default:
			writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return true
	}

	if strings.HasPrefix(path, "/seller/actions/") {
		parts := splitPath(path)
		// /seller/actions/{id}/segments
		if len(parts) == 4 && parts[0] == "seller" && parts[1] == "actions" && parts[3] == "segments" && r.Method == http.MethodGet {
			a.handleSellerSegmentsAlias(w, r, parts[2])
			return true
		}
		// /seller/actions/{id}/segments/{segmentId}/slots
		if len(parts) == 6 && parts[0] == "seller" && parts[1] == "actions" && parts[3] == "segments" && parts[5] == "slots" && r.Method == http.MethodGet {
			a.handleSellerSegmentSlots(w, r, parts[2], parts[4])
			return true
		}
	}

	return false
}

func splitPath(path string) []string {
	path = strings.Trim(path, "/")
	if path == "" {
		return nil
	}
	return strings.Split(path, "/")
}

func (a *App) handleAdminListPromotions(w http.ResponseWriter, r *http.Request) {
	items, err := a.promotionService.ListPromotions(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	type item struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		Theme    string `json:"theme"`
		Status   string `json:"status"`
		DateFrom string `json:"dateFrom"`
		DateTo   string `json:"dateTo"`
	}
	resp := struct {
		Promotions []item `json:"promotions"`
	}{Promotions: make([]item, 0, len(items))}
	for _, p := range items {
		resp.Promotions = append(resp.Promotions, item{
			ID:       p.ID,
			Name:     p.Name,
			Theme:    p.Theme,
			Status:   p.Status.String(),
			DateFrom: p.DateFrom,
			DateTo:   p.DateTo,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (a *App) handleAdminGetAuctionParams(w http.ResponseWriter, r *http.Request) {
	id, ok := parseInt64PathParam(w, extractPromotionIDFromAuctionPath(r.URL.Path))
	if !ok {
		return
	}
	promo, err := a.promotionService.GetPromotion(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "promotion not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
	}
	resp := struct {
		MinPrice             *int64 `json:"minPrice,omitempty"`
		BidStep              *int64 `json:"bidStep,omitempty"`
		AuctionDurationHours *int64 `json:"durationHours,omitempty"`
		AuctionDurationMins  *int64 `json:"durationMinutes,omitempty"`
	}{MinPrice: promo.MinPrice, BidStep: promo.BidStep}

	_, _, _, auctionDateFrom, auctionDateTo, auctionErr := a.promotionService.GetAuctionByPromotionID(r.Context(), id)
	if auctionErr == nil {
		if fromTime, err := parseFlexibleTime(auctionDateFrom); err == nil {
			if toTime, err := parseFlexibleTime(auctionDateTo); err == nil && toTime.After(fromTime) {
				durationMinutes := int64(toTime.Sub(fromTime).Minutes())
				durationHours := durationMinutes / 60
				resp.AuctionDurationHours = &durationHours
				resp.AuctionDurationMins = &durationMinutes
			}
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

func (a *App) handleAdminGetPromotion(w http.ResponseWriter, r *http.Request, idRaw string) {
	id, ok := parseInt64PathParam(w, idRaw)
	if !ok {
		return
	}

	promo, err := a.promotionService.GetPromotion(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "promotion not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
	}

	segments, err := a.promotionService.GetPromotionSegments(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	sort.Slice(segments, func(i, j int) bool {
		return segments[i].OrderIndex < segments[j].OrderIndex
	})

	pollData, err := a.promotionService.GetPromotionPoll(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	type segmentItem struct {
		ID           int64  `json:"id"`
		Name         string `json:"name"`
		CategoryName string `json:"categoryName"`
		OrderIndex   int32  `json:"orderIndex"`
	}
	type pollOption struct {
		ID    int64  `json:"id"`
		Text  string `json:"text"`
		Value string `json:"value"`
	}
	type pollQuestion struct {
		ID      int64        `json:"id"`
		Text    string       `json:"text"`
		Options []pollOption `json:"options"`
	}
	type answerTreeNode struct {
		NodeID       string `json:"nodeId"`
		ParentNodeID string `json:"parentNodeId"`
		Label        string `json:"label"`
		Value        string `json:"value"`
	}
	type pollPayload struct {
		Questions  []pollQuestion   `json:"questions"`
		AnswerTree []answerTreeNode `json:"answerTree"`
	}
	type response struct {
		ID                 int64             `json:"id"`
		Name               string            `json:"name"`
		Description        string            `json:"description"`
		Theme              string            `json:"theme"`
		Status             string            `json:"status"`
		DateFrom           string            `json:"dateFrom"`
		DateTo             string            `json:"dateTo"`
		IdentificationMode string            `json:"identificationMode"`
		PricingModel       string            `json:"pricingModel"`
		SlotCount          int               `json:"slotCount"`
		Discount           int               `json:"discount"`
		StopFactors        []string          `json:"stopFactors"`
		Segments           []segmentItem     `json:"segments"`
		FixedPrices        map[string]string `json:"fixedPrices"`
		Poll               pollPayload       `json:"poll"`
	}

	result := response{
		ID:                 promo.ID,
		Name:               promo.Name,
		Description:        promo.Description,
		Theme:              promo.Theme,
		Status:             promo.Status.String(),
		DateFrom:           promo.DateFrom,
		DateTo:             promo.DateTo,
		IdentificationMode: promo.IdentificationMode.APIString(),
		PricingModel:       promo.PricingModel.APIString(),
		SlotCount:          promo.SlotCount,
		Discount:           promo.Discount,
		StopFactors:        promo.StopFactors.Factors,
		Segments:           make([]segmentItem, 0, len(segments)),
		FixedPrices:        map[string]string{},
		Poll: pollPayload{
			Questions:  []pollQuestion{},
			AnswerTree: []answerTreeNode{},
		},
	}

	for _, segment := range segments {
		result.Segments = append(result.Segments, segmentItem{
			ID:           segment.ID,
			Name:         segment.Name,
			CategoryName: segment.CategoryName,
			OrderIndex:   segment.OrderIndex,
		})
	}

	for position, price := range promo.FixedPrices {
		result.FixedPrices[strconv.Itoa(int(position))] = strconv.FormatInt(price, 10)
	}

	if pollData != nil {
		optionsByQuestion := make(map[int64][]*repositoryPollOption)
		for _, option := range pollData.Options {
			optionsByQuestion[option.QuestionID] = append(optionsByQuestion[option.QuestionID], &repositoryPollOption{
				ID:         option.ID,
				Text:       option.Text,
				Value:      option.Value,
				OrderIndex: option.OrderIndex,
			})
		}

		sort.Slice(pollData.Questions, func(i, j int) bool {
			return pollData.Questions[i].OrderIndex < pollData.Questions[j].OrderIndex
		})

		for _, question := range pollData.Questions {
			optionRows := optionsByQuestion[question.ID]
			sort.Slice(optionRows, func(i, j int) bool {
				return optionRows[i].OrderIndex < optionRows[j].OrderIndex
			})

			options := make([]pollOption, 0, len(optionRows))
			for _, option := range optionRows {
				options = append(options, pollOption{
					ID:    option.ID,
					Text:  option.Text,
					Value: option.Value,
				})
			}

			result.Poll.Questions = append(result.Poll.Questions, pollQuestion{
				ID:      question.ID,
				Text:    question.Text,
				Options: options,
			})
		}

		for _, node := range pollData.AnswerTree {
			parentNodeID := ""
			if node.ParentNodeID != nil {
				parentNodeID = *node.ParentNodeID
			}
			result.Poll.AnswerTree = append(result.Poll.AnswerTree, answerTreeNode{
				NodeID:       node.NodeID,
				ParentNodeID: parentNodeID,
				Label:        node.Label,
				Value:        node.Value,
			})
		}
	}

	writeJSON(w, http.StatusOK, result)
}

type repositoryPollOption struct {
	ID         int64
	Text       string
	Value      string
	OrderIndex int
}

func (a *App) handleAdminUpdatePromotion(w http.ResponseWriter, r *http.Request, idRaw string) {
	id, ok := parseInt64PathParam(w, idRaw)
	if !ok {
		return
	}

	// Frontend sends camelCase fields for PATCH /admin/promotions/{id}.
	var req struct {
		Name               *string   `json:"name"`
		Description        *string   `json:"description"`
		Theme              *string   `json:"theme"`
		DateFrom           *string   `json:"dateFrom"`
		DateTo             *string   `json:"dateTo"`
		IdentificationMode *string   `json:"identificationMode"`
		PricingModel       *string   `json:"pricingModel"`
		SlotCount          *int      `json:"slotCount"`
		Discount           *int      `json:"discount"`
		StopFactors        *[]string `json:"stopFactors"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}

	promo, err := a.promotionService.GetPromotion(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "promotion not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
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
		parsed := entity.ParseIdentificationMode(*req.IdentificationMode)
		if parsed == entity.IdentificationModeUnspecified {
			writeJSONError(w, http.StatusBadRequest, "invalid identificationMode")
			return
		}
		promo.IdentificationMode = parsed
	}
	if req.PricingModel != nil {
		parsed := entity.ParsePricingModel(*req.PricingModel)
		if parsed == entity.PricingModelUnspecified {
			writeJSONError(w, http.StatusBadRequest, "invalid pricingModel")
			return
		}
		promo.PricingModel = parsed
	}
	if req.SlotCount != nil {
		promo.SlotCount = *req.SlotCount
	}
	if req.Discount != nil {
		promo.Discount = *req.Discount
	}
	if req.StopFactors != nil {
		promo.StopFactors = entity.StopFactors{Factors: *req.StopFactors}
	}

	if err := a.promotionService.UpdatePromotion(r.Context(), promo); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, struct{}{})
}

func (a *App) handleAdminSetAuctionParams(w http.ResponseWriter, r *http.Request) {
	id, ok := parseInt64PathParam(w, extractPromotionIDFromAuctionPath(r.URL.Path))
	if !ok {
		return
	}
	var req struct {
		MinPrice      *int64 `json:"minPrice"`
		BidStep       *int64 `json:"bidStep"`
		DurationHours *int64 `json:"durationHours"`
		DurationMins  *int64 `json:"durationMinutes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}
	promo, err := a.promotionService.GetPromotion(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "promotion not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
	}
	if req.MinPrice != nil {
		promo.MinPrice = req.MinPrice
	}
	if req.BidStep != nil {
		promo.BidStep = req.BidStep
	}
	if err := a.promotionService.UpdatePromotion(r.Context(), promo); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if promo.MinPrice == nil || promo.BidStep == nil {
		writeJSONError(w, http.StatusBadRequest, "minPrice and bidStep are required")
		return
	}

	startAt, err := parseFlexibleTime(promo.DateFrom)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid promotion dateFrom")
		return
	}
	nowUTC := time.Now().UTC()
	if nowUTC.After(startAt) {
		startAt = nowUTC
	}

	endAt, err := parseFlexibleTime(promo.DateTo)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid promotion dateTo")
		return
	}
	if req.DurationMins != nil && *req.DurationMins > 0 {
		endAt = startAt.Add(time.Duration(*req.DurationMins) * time.Minute)
	} else if req.DurationHours != nil && *req.DurationHours > 0 {
		endAt = startAt.Add(time.Duration(*req.DurationHours) * time.Hour)
	}
	if !endAt.After(startAt) {
		endAt = startAt.Add(24 * time.Hour)
	}

	if _, err := a.promotionService.UpsertAuction(
		r.Context(),
		id,
		startAt.Format(time.RFC3339),
		endAt.Format(time.RFC3339),
		*promo.MinPrice,
		*promo.BidStep,
	); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := a.promotionService.ResetAuctionState(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, struct{}{})
}

func (a *App) handleAdminUpdateSegment(w http.ResponseWriter, r *http.Request, promotionIDRaw, segmentIDRaw string) {
	promotionID, ok := parseInt64PathParam(w, promotionIDRaw)
	if !ok {
		return
	}
	segmentID, ok := parseInt64PathParam(w, segmentIDRaw)
	if !ok {
		return
	}

	// Frontend sends camelCase fields for PATCH /admin/promotions/{id}/segments/{segmentId}.
	var req struct {
		Name         *string `json:"name"`
		CategoryName *string `json:"categoryName"`
		OrderIndex   *int32  `json:"orderIndex"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := a.promotionService.UpdateSegment(r.Context(), promotionID, segmentID, req.Name, req.CategoryName, req.OrderIndex); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "segment not found")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, struct{}{})
}

func extractPromotionIDFromAuctionPath(path string) string {
	parts := splitPath(path)
	// admin/promotions/{id}/auction-params
	if len(parts) >= 3 {
		return parts[2]
	}
	return ""
}

func (a *App) handleSellerSegmentsAlias(w http.ResponseWriter, r *http.Request, actionIDRaw string) {
	actionID, ok := parseInt64PathParam(w, actionIDRaw)
	if !ok {
		return
	}
	items, err := a.sellerService.GetActionSegments(r.Context(), actionID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	type segment struct {
		ID          int64  `json:"id"`
		Name        string `json:"name"`
		Category    string `json:"category"`
		Population  int64  `json:"population"`
		BookedSlots int64  `json:"bookedSlots"`
		TotalSlots  int64  `json:"totalSlots"`
	}
	resp := struct {
		ActionSegments []segment `json:"actionSegments"`
	}{ActionSegments: make([]segment, 0, len(items))}
	for _, item := range items {
		resp.ActionSegments = append(resp.ActionSegments, segment{
			ID:          item.ID,
			Name:        item.Name,
			Category:    item.Category,
			Population:  item.Population,
			BookedSlots: item.BookedSlots,
			TotalSlots:  item.TotalSlots,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (a *App) handleSellerSegmentSlots(w http.ResponseWriter, r *http.Request, actionIDRaw, segmentIDRaw string) {
	actionID, ok := parseInt64PathParam(w, actionIDRaw)
	if !ok {
		return
	}
	segmentID, ok := parseInt64PathParam(w, segmentIDRaw)
	if !ok {
		return
	}
	market, err := a.sellerService.GetSegmentSlotsMarket(r.Context(), actionID, segmentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusNotFound, "segment not found for action")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	type auctionItem struct {
		SlotID        int64  `json:"slotId"`
		Position      int    `json:"position"`
		CurrentBid    int64  `json:"currentBid"`
		MinBid        int64  `json:"minBid"`
		BidStep       int64  `json:"bidStep"`
		TimeLeft      string `json:"timeLeft"`
		TopBidderName string `json:"topBidderName,omitempty"`
	}
	type fixedItem struct {
		SlotID   int64  `json:"slotId"`
		Position int    `json:"position"`
		Price    int64  `json:"price"`
		Status   string `json:"status"`
	}
	resp := struct {
		Auction []auctionItem `json:"auction"`
		Fixed   []fixedItem   `json:"fixed"`
	}{
		Auction: make([]auctionItem, 0, len(market.Auction)),
		Fixed:   make([]fixedItem, 0, len(market.Fixed)),
	}
	for _, item := range market.Auction {
		resp.Auction = append(resp.Auction, auctionItem{
			SlotID:        item.SlotID,
			Position:      item.Position,
			CurrentBid:    item.CurrentBid,
			MinBid:        item.MinBid,
			BidStep:       item.BidStep,
			TimeLeft:      item.TimeLeft,
			TopBidderName: item.TopBidderName,
		})
	}
	for _, item := range market.Fixed {
		status := item.Status
		if status != "available" {
			status = "occupied"
		}
		resp.Fixed = append(resp.Fixed, fixedItem{
			SlotID:   item.SlotID,
			Position: item.Position,
			Price:    item.Price,
			Status:   status,
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func parseInt64PathParam(w http.ResponseWriter, raw string) (int64, bool) {
	v, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid path id")
		return 0, false
	}
	return v, true
}

func parseFlexibleTime(value string) (time.Time, error) {
	layouts := []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02 15:04:05.999999999Z07:00",
		"2006-01-02 15:04:05Z07:00",
		"2006-01-02 15:04:05.999999999-07",
		"2006-01-02 15:04:05-07",
		"2006-01-02 15:04:05+00",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, nil
		}
	}
	return time.Time{}, errors.New("unsupported time format")
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	type errResp struct {
		Code    int    `json:"code,omitempty"`
		Message string `json:"message"`
	}
	writeJSON(w, status, errResp{Code: status, Message: message})
}

func mapPromotionStatusToDashboardStatus(status entity.PromotionStatus) string {
	switch status {
	case entity.PromotionStatusRunning:
		return "active"
	case entity.PromotionStatusReadyToStart, entity.PromotionStatusPaused:
		return "upcoming"
	case entity.PromotionStatusCompleted:
		return "completed"
	default:
		return "draft"
	}
}
