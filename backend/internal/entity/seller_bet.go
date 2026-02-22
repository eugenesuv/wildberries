package entity

// SellerBet represents a seller bet
type SellerBet struct {
	ID           int64  `json:"id"`
	PromotionID  int64  `json:"promotion_id"`
	SegmentID    int64  `json:"segment_id"`
	SlotID       int64  `json:"slot_id"`
	Bet          int64  `json:"bet"`
	Price        int64  `json:"price"`
	Status       string `json:"status"`
	ProductName  string `json:"product_name"`
}