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

func (r *AuctionPostgres) GetByPromotionID(ctx context.Context, promotionID int64) (id int64, minPrice, bidStep int64, dateFrom, dateTo string, err error) {
	err = r.pool.QueryRow(ctx, `SELECT id, min_price, bid_step, date_from::text, date_to::text
		FROM public.auction WHERE promotion_id = $1 AND deleted_at IS NULL`,
		promotionID).Scan(&id, &minPrice, &bidStep, &dateFrom, &dateTo)
	return id, minPrice, bidStep, dateFrom, dateTo, err
}

func (r *AuctionPostgres) Create(ctx context.Context, promotionID int64, dateFrom, dateTo string, minPrice, bidStep int64) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.auction (promotion_id, date_from, date_to, min_price, bid_step)
			VALUES ($1,$2::timestamptz,$3::timestamptz,$4,$5) RETURNING id`,
		promotionID, dateFrom, dateTo, minPrice, bidStep).Scan(&id)
	return id, err
}

func (r *AuctionPostgres) UpsertByPromotion(ctx context.Context, promotionID int64, dateFrom, dateTo string, minPrice, bidStep int64) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `
		INSERT INTO public.auction (promotion_id, date_from, date_to, min_price, bid_step)
		VALUES ($1,$2::timestamptz,$3::timestamptz,$4,$5)
		ON CONFLICT (promotion_id) DO UPDATE
		SET date_from = EXCLUDED.date_from,
			date_to = EXCLUDED.date_to,
			min_price = EXCLUDED.min_price,
			bid_step = EXCLUDED.bid_step,
			updated_at = now(),
			deleted_at = NULL
		RETURNING id`,
		promotionID, dateFrom, dateTo, minPrice, bidStep).Scan(&id)
	return id, err
}

func (r *AuctionPostgres) Update(ctx context.Context, promotionID int64, minPrice, bidStep int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.auction SET min_price=$2, bid_step=$3, updated_at=now() WHERE promotion_id=$1`,
		promotionID, minPrice, bidStep)
	return err
}

var _ AuctionRepository = (*AuctionPostgres)(nil)
