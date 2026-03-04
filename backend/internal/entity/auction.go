package entity

type Auction struct {
	ID          int64
	PromotionID int64
	DateFrom    string
	DateTo      string
	MinPrice    int64
	BidStep     int64
}
