package entity

// Segment represents a segment in a promotion
type Segment struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	CategoryName string `json:"category_name"`
	OrderIndex   int32  `json:"order_index"`
	Text         string `json:"text"`
}
