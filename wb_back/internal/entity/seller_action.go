package entity

// SellerAction represents a seller action
type SellerAction struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Status       string `json:"status"`
	DateFrom     string `json:"date_from"`
	DateTo       string `json:"date_to"`
	CategoryHint string `json:"category_hint"`
	Theme        string `json:"theme"`
}