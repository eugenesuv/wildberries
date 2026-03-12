package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BetPostgres struct {
	pool *pgxpool.Pool
}

func NewBetPostgres(pool *pgxpool.Pool) *BetPostgres {
	return &BetPostgres{pool: pool}
}

func (r *BetPostgres) Create(ctx context.Context, auctionID, slotID, sellerID, productID int64, bet int64) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.bet (auction_id, slot_id, seller_id, product_id, bet)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`, auctionID, slotID, sellerID, productID, bet).Scan(&id)
	return id, err
}

func (r *BetPostgres) TopBySlot(ctx context.Context, slotID int64) (sellerID, productID int64, bet int64, err error) {
	err = r.pool.QueryRow(ctx, `SELECT seller_id, product_id, bet FROM public.bet
			WHERE slot_id = $1 AND deleted_at IS NULL ORDER BY bet DESC LIMIT 1`, slotID).Scan(&sellerID, &productID, &bet)
	return sellerID, productID, bet, err
}

func (r *BetPostgres) TopBySegment(ctx context.Context, promotionID, segmentID int64) (sellerID, productID int64, bet int64, err error) {
	err = r.pool.QueryRow(ctx, `SELECT b.seller_id, b.product_id, b.bet
		FROM public.bet b
		JOIN public.slot s ON s.id = b.slot_id
		WHERE s.promotion_id = $1 AND s.segment_id = $2 AND b.deleted_at IS NULL
		ORDER BY b.bet DESC, b.created_at ASC
		LIMIT 1`, promotionID, segmentID).Scan(&sellerID, &productID, &bet)
	return sellerID, productID, bet, err
}

func (r *BetPostgres) ListBySegment(ctx context.Context, promotionID, segmentID int64, limit int) ([]*BetRow, error) {
	query := `SELECT b.id, b.auction_id, b.slot_id, b.seller_id, b.product_id, b.bet, b.created_at::text
		FROM public.bet b
		JOIN public.slot s ON s.id = b.slot_id
		WHERE s.promotion_id = $1 AND s.segment_id = $2 AND b.deleted_at IS NULL
		ORDER BY b.bet DESC, b.created_at ASC`

	args := []any{promotionID, segmentID}
	if limit > 0 {
		query += ` LIMIT $3`
		args = append(args, limit)
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]*BetRow, 0)
	for rows.Next() {
		var row BetRow
		if err := rows.Scan(&row.ID, &row.AuctionID, &row.SlotID, &row.SellerID, &row.ProductID, &row.Bet, &row.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, &row)
	}
	return result, rows.Err()
}

func (r *BetPostgres) ListBestBySeller(ctx context.Context, sellerID, promotionID int64) ([]*BetRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT DISTINCT ON (b.slot_id)
			b.id, b.auction_id, b.slot_id, b.seller_id, b.product_id, b.bet, b.created_at::text
		FROM public.bet b
		JOIN public.slot s ON s.id = b.slot_id
		WHERE b.seller_id = $1 AND s.promotion_id = $2 AND b.deleted_at IS NULL
		ORDER BY b.slot_id, b.bet DESC, b.created_at DESC`, sellerID, promotionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]*BetRow, 0)
	for rows.Next() {
		var row BetRow
		if err := rows.Scan(&row.ID, &row.AuctionID, &row.SlotID, &row.SellerID, &row.ProductID, &row.Bet, &row.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, &row)
	}
	return result, rows.Err()
}

func (r *BetPostgres) DeleteBySlotAndSeller(ctx context.Context, slotID, sellerID int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.bet SET deleted_at=now() WHERE slot_id=$1 AND seller_id=$2`, slotID, sellerID)
	return err
}

func (r *BetPostgres) DeleteByPromotion(ctx context.Context, promotionID int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.bet AS b
		SET deleted_at = now()
		FROM public.slot AS s
		WHERE b.slot_id = s.id
			AND s.promotion_id = $1
			AND b.deleted_at IS NULL`, promotionID)
	return err
}

var _ BetRepository = (*BetPostgres)(nil)
