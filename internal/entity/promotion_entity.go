package entity

import desc "wildberries/pkg/admin"

// Promotion represents a promotion entity
type Promotion struct {
	ID                 int64
	Name               string
	Description        string
	Theme              string
	DateFrom           string
	DateTo             string
	Status             PromotionStatus
	IdentificationMode desc.IdentificationMode
	PricingModel       desc.PricingModel
	SlotCount          int
	MinDiscount        *int64
	MaxDiscount        *int64
	MinPrice           *int64
	BidStep            *int64
	StopFactors        StopFactors
	FixedPrices        map[int32]int64
}
