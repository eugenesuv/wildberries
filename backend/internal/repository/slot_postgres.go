package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SlotPostgres struct {
	pool *pgxpool.Pool
}

func NewSlotPostgres(pool *pgxpool.Pool) *SlotPostgres {
	return &SlotPostgres{pool: pool}
}

func (r *SlotPostgres) BySegmentID(ctx context.Context, segmentID int64, onlyOccupied bool) ([]*SlotRow, error) {
	q := `SELECT id, promotion_id, segment_id, position, pricing_type, price, auction_id, status, seller_id, product_id, created_at::text, updated_at::text
		FROM public.slot WHERE segment_id = $1`
	if onlyOccupied {
		q += ` AND status = 'occupied'`
	}
	q += ` ORDER BY position`
	rows, err := r.pool.Query(ctx, q, segmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*SlotRow
	for rows.Next() {
		var s SlotRow
		err = rows.Scan(&s.ID, &s.PromotionID, &s.SegmentID, &s.Position, &s.PricingType, &s.Price, &s.AuctionID, &s.Status, &s.SellerID, &s.ProductID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SlotPostgres) ByPromotionID(ctx context.Context, promotionID int64) ([]*SlotRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, promotion_id, segment_id, position, pricing_type, price, auction_id, status, seller_id, product_id, created_at::text, updated_at::text
		FROM public.slot WHERE promotion_id = $1 ORDER BY segment_id, position`, promotionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*SlotRow
	for rows.Next() {
		var s SlotRow
		err = rows.Scan(&s.ID, &s.PromotionID, &s.SegmentID, &s.Position, &s.PricingType, &s.Price, &s.AuctionID, &s.Status, &s.SellerID, &s.ProductID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SlotPostgres) BySellerID(ctx context.Context, sellerID int64, promotionID *int64) ([]*SlotRow, error) {
	q := `SELECT id, promotion_id, segment_id, position, pricing_type, price, auction_id, status, seller_id, product_id, created_at::text, updated_at::text
		FROM public.slot WHERE seller_id = $1`
	args := []interface{}{sellerID}
	if promotionID != nil {
		q += ` AND promotion_id = $2`
		args = append(args, *promotionID)
	}
	q += ` ORDER BY promotion_id, segment_id, position`
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*SlotRow
	for rows.Next() {
		var s SlotRow
		err = rows.Scan(&s.ID, &s.PromotionID, &s.SegmentID, &s.Position, &s.PricingType, &s.Price, &s.AuctionID, &s.Status, &s.SellerID, &s.ProductID, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SlotPostgres) GetByID(ctx context.Context, id int64) (*SlotRow, error) {
	var s SlotRow
	err := r.pool.QueryRow(ctx, `SELECT id, promotion_id, segment_id, position, pricing_type, price, auction_id, status, seller_id, product_id, created_at::text, updated_at::text
		FROM public.slot WHERE id = $1`, id).Scan(&s.ID, &s.PromotionID, &s.SegmentID, &s.Position, &s.PricingType, &s.Price, &s.AuctionID, &s.Status, &s.SellerID, &s.ProductID, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SlotPostgres) Create(ctx context.Context, row *SlotRow) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.slot (promotion_id, segment_id, position, pricing_type, price, auction_id, status, seller_id, product_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		row.PromotionID, row.SegmentID, row.Position, row.PricingType, row.Price, row.AuctionID, row.Status, row.SellerID, row.ProductID).Scan(&id)
	return id, err
}

func (r *SlotPostgres) Update(ctx context.Context, row *SlotRow) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.slot SET pricing_type=$2, price=$3, auction_id=$4, status=$5, seller_id=$6, product_id=$7, updated_at=now() WHERE id=$1`,
		row.ID, row.PricingType, row.Price, row.AuctionID, row.Status, row.SellerID, row.ProductID)
	return err
}

func (r *SlotPostgres) SetProduct(ctx context.Context, slotID int64, sellerID *int64, productID int64, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.slot SET seller_id=$2, product_id=$3, status=$4, updated_at=now() WHERE id=$1`,
		slotID, sellerID, productID, status)
	return err
}

var _ SlotRepository = (*SlotPostgres)(nil)
