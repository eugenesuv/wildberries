package entity

// ProductItem represents a product item in responses
type ProductItem struct {
	ID           int64  `json:"id"`
	NmID         int64  `json:"nm_id"`
	Name         string `json:"name"`
	Image        string `json:"image"`
	Price        int64  `json:"price"`
	OldPrice     int64  `json:"old_price"`
	Discount     int32  `json:"discount"`
	Badge        string `json:"badge"`
	CategoryName string `json:"category_name"`
}
