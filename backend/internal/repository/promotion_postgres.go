package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PromotionPostgres struct {
	pool *pgxpool.Pool
}

func NewPromotionPostgres(pool *pgxpool.Pool) *PromotionPostgres {
	return &PromotionPostgres{pool: pool}
}

func (r *PromotionPostgres) GetByID(ctx context.Context, id int64) (*PromotionRow, error) {
	var row PromotionRow
	err := r.pool.QueryRow(ctx, `SELECT id, name, description, theme, date_from, date_to, status,
		identification_mode, pricing_model, slot_count, discount, min_price, bid_step, stop_factors, fixed_prices,
		created_at, updated_at, deleted_at FROM public.promotion WHERE id = $1 AND deleted_at IS NULL`,
		id).Scan(&row.ID, &row.Name, &row.Description, &row.Theme, &row.DateFrom, &row.DateTo, &row.Status,
		&row.IdentificationMode, &row.PricingModel, &row.SlotCount, &row.Discount, &row.MinPrice, &row.BidStep,
		&row.StopFactors, &row.FixedPrices, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *PromotionPostgres) GetActive(ctx context.Context) (*PromotionRow, error) {
	var row PromotionRow
	err := r.pool.QueryRow(ctx, `SELECT id, name, description, theme, date_from, date_to, status,
		identification_mode, pricing_model, slot_count, discount, min_price, bid_step, stop_factors, fixed_prices,
		created_at, updated_at, deleted_at FROM public.promotion
		WHERE status = 'RUNNING' AND date_from <= now() AND date_to >= now() AND deleted_at IS NULL LIMIT 1`).
		Scan(&row.ID, &row.Name, &row.Description, &row.Theme, &row.DateFrom, &row.DateTo, &row.Status,
			&row.IdentificationMode, &row.PricingModel, &row.SlotCount, &row.Discount, &row.MinPrice, &row.BidStep,
			&row.StopFactors, &row.FixedPrices, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *PromotionPostgres) Create(ctx context.Context, row *PromotionRow) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.promotion (name, description, theme, date_from, date_to, status,
		identification_mode, pricing_model, slot_count, discount, min_price, bid_step, stop_factors, fixed_prices)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
		row.Name, row.Description, row.Theme, row.DateFrom, row.DateTo, row.Status,
		row.IdentificationMode, row.PricingModel, row.SlotCount, row.Discount, row.MinPrice, row.BidStep,
		row.StopFactors, row.FixedPrices).Scan(&id)
	return id, err
}

func (r *PromotionPostgres) Update(ctx context.Context, row *PromotionRow) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.promotion SET name=$2, description=$3, theme=$4, date_from=$5, date_to=$6,
		status=$7, identification_mode=$8, pricing_model=$9, slot_count=$10, discount=$11, min_price=$12, bid_step=$13,
		stop_factors=$14, fixed_prices=$15, updated_at=now() WHERE id=$1`,
		row.ID, row.Name, row.Description, row.Theme, row.DateFrom, row.DateTo, row.Status,
		row.IdentificationMode, row.PricingModel, row.SlotCount, row.Discount, row.MinPrice, row.BidStep,
		row.StopFactors, row.FixedPrices)
	return err
}

func (r *PromotionPostgres) SoftDelete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.promotion SET deleted_at=now() WHERE id=$1`, id)
	return err
}

func (r *PromotionPostgres) SetFixedPrices(ctx context.Context, id int64, prices []byte) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.promotion SET fixed_prices=$2, updated_at=now() WHERE id=$1`, id, prices)
	return err
}

func (r *PromotionPostgres) SetStatus(ctx context.Context, id int64, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.promotion SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	return err
}

var _ PromotionRepository = (*PromotionPostgres)(nil)

func mustJSON(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}
