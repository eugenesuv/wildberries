package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuctionPostgres struct {
	pool *pgxpool.Pool
}

func NewAuctionPostgres(pool *pgxpool.Pool) *AuctionPostgres {
	return &AuctionPostgres{pool: pool}
}

func (r *AuctionPostgres) GetByPromotionID(ctx context.Context, promotionID int64) (*AuctionRow, error) {
	var row AuctionRow
	err := r.pool.QueryRow(ctx, `SELECT id, min_price, bid_step, date_from::text, date_to::text
		FROM public.auction WHERE promotion_id = $1 AND deleted_at IS NULL`,
		promotionID).Scan(
		&row.ID,
		&row.MinPrice,
		&row.BidStep,
		&row.DateFrom,
		&row.DateTo,
	)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *AuctionPostgres) Create(ctx context.Context, promotionID int64, dateFrom, dateTo string, minPrice, bidStep int64) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.auction (promotion_id, date_from, date_to, min_price, bid_step)
		VALUES ($1,$2::timestamptz,$3::timestamptz,$4,$5) RETURNING id`,
		promotionID, dateFrom, dateTo, minPrice, bidStep).Scan(&id)
	return id, err
}

var _ AuctionRepository = (*AuctionPostgres)(nil)
