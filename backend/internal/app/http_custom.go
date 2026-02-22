package app

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"wildberries/internal/entity"
)

func (a *App) serveCustomHTTP(w http.ResponseWriter, r *http.Request) bool {
	path := r.URL.Path

	if r.Method == http.MethodGet && path == "/admin/promotions" {
		a.handleAdminListPromotions(w, r)
		return true
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
		ID        int64  `json:"id"`
		Name      string `json:"name"`
		Theme     string `json:"theme"`
		Status    string `json:"status"`
		DateFrom  string `json:"dateFrom"`
		DateTo    string `json:"dateTo"`
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
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
	}
	resp := struct {
		MinPrice *int64 `json:"minPrice,omitempty"`
		BidStep  *int64 `json:"bidStep,omitempty"`
	}{MinPrice: promo.MinPrice, BidStep: promo.BidStep}
	writeJSON(w, http.StatusOK, resp)
}

func (a *App) handleAdminSetAuctionParams(w http.ResponseWriter, r *http.Request) {
	id, ok := parseInt64PathParam(w, extractPromotionIDFromAuctionPath(r.URL.Path))
	if !ok {
		return
	}
	var req struct {
		MinPrice *int64 `json:"minPrice"`
		BidStep  *int64 `json:"bidStep"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json")
		return
	}
	promo, err := a.promotionService.GetPromotion(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if promo == nil {
		writeJSONError(w, http.StatusNotFound, "promotion not found")
		return
	}
	promo.MinPrice = req.MinPrice
	promo.BidStep = req.BidStep
	if err := a.promotionService.UpdatePromotion(r.Context(), promo); err != nil {
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
		ID         int64  `json:"id"`
		Name       string `json:"name"`
		Category   string `json:"category"`
		Population int64  `json:"population"`
		BookedSlots int64 `json:"bookedSlots"`
		TotalSlots int64  `json:"totalSlots"`
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
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	type auctionItem struct {
		SlotID       int64  `json:"slotId"`
		Position     int    `json:"position"`
		CurrentBid   int64  `json:"currentBid"`
		MinBid       int64  `json:"minBid"`
		BidStep      int64  `json:"bidStep"`
		TimeLeft     string `json:"timeLeft"`
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
