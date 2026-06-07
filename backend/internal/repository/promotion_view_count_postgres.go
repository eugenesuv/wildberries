package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PromotionViewCountPostgres struct {
	pool *pgxpool.Pool
}

func NewPromotionViewCountPostgres(pool *pgxpool.Pool) *PromotionViewCountPostgres {
	return &PromotionViewCountPostgres{pool: pool}
}

func (r *PromotionViewCountPostgres) GetOrCreate(ctx context.Context, promotionID int64) (*PromotionViewCountRow, error) {
	var row PromotionViewCountRow
	err := r.pool.QueryRow(ctx, `INSERT INTO public.promotion_view_count (promotion_id, view_count)
		VALUES ($1, 0)
		ON CONFLICT (promotion_id) DO UPDATE SET view_count = promotion_view_count.view_count
		RETURNING id, promotion_id, view_count, updated_at::text`,
		promotionID).Scan(&row.ID, &row.PromotionID, &row.ViewCount, &row.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *PromotionViewCountPostgres) Increment(ctx context.Context, promotionID int64) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO public.promotion_view_count (promotion_id, view_count)
		VALUES ($1, 1)
		ON CONFLICT (promotion_id) DO UPDATE SET view_count = promotion_view_count.view_count + 1, updated_at = now()`,
		promotionID)
	return err
}

func (r *PromotionViewCountPostgres) GetTotalViews(ctx context.Context) (int64, error) {
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(view_count), 0) FROM public.promotion_view_count`).Scan(&total)
	return total, err
}
