package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SegmentPostgres struct {
	pool *pgxpool.Pool
}

func NewSegmentPostgres(pool *pgxpool.Pool) *SegmentPostgres {
	return &SegmentPostgres{pool: pool}
}

func (r *SegmentPostgres) ByPromotionID(ctx context.Context, promotionID int64) ([]*SegmentRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, promotion_id, name, category_id, category_name, color, order_index, text, created_at, updated_at
		FROM public.segment WHERE promotion_id = $1 ORDER BY order_index, id`, promotionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*SegmentRow
	for rows.Next() {
		var row SegmentRow
		err = rows.Scan(&row.ID, &row.PromotionID, &row.Name, &row.CategoryID, &row.CategoryName, &row.Color, &row.OrderIndex, &row.Text, &row.CreatedAt, &row.UpdatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *SegmentPostgres) GetByID(ctx context.Context, id int64) (*SegmentRow, error) {
	var row SegmentRow
	err := r.pool.QueryRow(ctx, `SELECT id, promotion_id, name, category_id, category_name, color, order_index, text, created_at, updated_at
		FROM public.segment WHERE id = $1`, id).
		Scan(&row.ID, &row.PromotionID, &row.Name, &row.CategoryID, &row.CategoryName, &row.Color, &row.OrderIndex, &row.Text, &row.CreatedAt, &row.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *SegmentPostgres) GetByPromoAndSegment(ctx context.Context, promotionID, segmentID int64) (*SegmentRow, error) {
	var row SegmentRow
	err := r.pool.QueryRow(ctx, `SELECT id, promotion_id, name, category_id, category_name, color, order_index, text, created_at, updated_at
		FROM public.segment WHERE promotion_id = $1 AND id = $2`, promotionID, segmentID).
		Scan(&row.ID, &row.PromotionID, &row.Name, &row.CategoryID, &row.CategoryName, &row.Color, &row.OrderIndex, &row.Text, &row.CreatedAt, &row.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *SegmentPostgres) Create(ctx context.Context, row *SegmentRow) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `INSERT INTO public.segment (promotion_id, name, category_id, category_name, color, order_index, text)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		row.PromotionID, row.Name, row.CategoryID, row.CategoryName, row.Color, row.OrderIndex, row.Text).Scan(&id)
	return id, err
}

func (r *SegmentPostgres) Update(ctx context.Context, row *SegmentRow) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.segment SET name=$2, category_id=$3, category_name=$4, color=$5, order_index=$6, text=$7, updated_at=now() WHERE id=$1`,
		row.ID, row.Name, row.CategoryID, row.CategoryName, row.Color, row.OrderIndex, row.Text)
	return err
}

func (r *SegmentPostgres) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM public.segment WHERE id = $1`, id)
	return err
}

func (r *SegmentPostgres) ShuffleCategories(ctx context.Context, promotionID int64) error {
	// Placeholder: would shuffle category_name across segments
	_, err := r.pool.Exec(ctx, `UPDATE public.segment SET updated_at=now() WHERE promotion_id=$1`, promotionID)
	return err
}

func (r *SegmentPostgres) UpdateText(ctx context.Context, segmentID int64, text string) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.segment SET text=$2, updated_at=now() WHERE id=$1`, segmentID, text)
	return err
}

var _ SegmentRepository = (*SegmentPostgres)(nil)
