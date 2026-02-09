package entity

// Promotion represents a promotion entity
type Promotion struct {
	ID                 int64
	Name               string
	Description        string
	Theme              string
	DateFrom           string
	DateTo             string
	Status             PromotionStatus
	IdentificationMode IdentificationMode
	PricingModel       PricingModel
	SlotCount          int
	Discount           int // WB discount (admin setting) for WB-curated slots
	MinPrice           *int64
	BidStep            *int64
	StopFactors        StopFactors
	FixedPrices        map[int32]int64
}
