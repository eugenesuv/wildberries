package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ModerationPostgres struct {
	pool *pgxpool.Pool
}

func NewModerationPostgres(pool *pgxpool.Pool) *ModerationPostgres {
	return &ModerationPostgres{pool: pool}
}

func (r *ModerationPostgres) ListByPromotion(ctx context.Context, promotionID int64, status string) ([]*ModerationRow, error) {
	q := `SELECT id, promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status, created_at, updated_at, moderated_at, moderator_id
		FROM public.moderation WHERE promotion_id = $1`
	args := []interface{}{promotionID}
	if status != "" {
		q += ` AND status = $2`
		args = append(args, status)
	}
	q += ` ORDER BY id`
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*ModerationRow
	for rows.Next() {
		var row ModerationRow
		err = rows.Scan(&row.ID, &row.PromotionID, &row.SegmentID, &row.SlotID, &row.SellerID, &row.ProductID, &row.Discount, &row.StopFactors, &row.Status, &row.CreatedAt, &row.UpdatedAt, &row.ModeratedAt, &row.ModeratorID)
		if err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *ModerationPostgres) GetByID(ctx context.Context, id int64) (*ModerationRow, error) {
	var row ModerationRow
	err := r.pool.QueryRow(ctx, `SELECT id, promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status, created_at, updated_at, moderated_at, moderator_id
		FROM public.moderation WHERE id = $1`, id).
		Scan(&row.ID, &row.PromotionID, &row.SegmentID, &row.SlotID, &row.SellerID, &row.ProductID, &row.Discount, &row.StopFactors, &row.Status, &row.CreatedAt, &row.UpdatedAt, &row.ModeratedAt, &row.ModeratorID)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *ModerationPostgres) Create(ctx context.Context, row *ModerationRow) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.moderation (promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
		row.PromotionID, row.SegmentID, row.SlotID, row.SellerID, row.ProductID, row.Discount, row.StopFactors, row.Status).Scan(&id)
	return id, err
}

func (r *ModerationPostgres) SetStatus(ctx context.Context, id int64, status string, moderatorID *int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.moderation SET status=$2, moderated_at=now(), moderator_id=$3, updated_at=now() WHERE id=$1`, id, status, moderatorID)
	return err
}

var _ ModerationRepository = (*ModerationPostgres)(nil)
