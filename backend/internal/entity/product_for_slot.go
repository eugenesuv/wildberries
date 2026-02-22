package entity

// ProductForSlot is used when attaching a seller's product to a slot (fixed price or auction bid).
// Only product_id is required; name, price, image, discount come from the product catalog.
type ProductForSlot struct {
	ProductID int64 `json:"product_id"`
}
