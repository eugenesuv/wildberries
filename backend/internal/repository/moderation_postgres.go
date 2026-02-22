package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ModerationPostgres struct {
	pool *pgxpool.Pool
}

func NewModerationPostgres(pool *pgxpool.Pool) *ModerationPostgres {
	return &ModerationPostgres{pool: pool}
}

func (r *ModerationPostgres) ListByPromotion(ctx context.Context, promotionID int64, status string) ([]*ModerationRow, error) {
	q := `SELECT id, promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status, created_at::text, updated_at::text, moderated_at::text, moderator_id
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
	err := r.pool.QueryRow(ctx, `SELECT id, promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status, created_at::text, updated_at::text, moderated_at::text, moderator_id
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

func (r *ModerationPostgres) ResolveApplication(ctx context.Context, id int64, status string, moderatorID *int64) error {
	if status != "approved" && status != "rejected" {
		return fmt.Errorf("unsupported moderation status %q", status)
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var app ModerationRow
	err = tx.QueryRow(ctx, `SELECT id, promotion_id, segment_id, slot_id, seller_id, product_id, discount, stop_factors, status, created_at::text, updated_at::text, moderated_at::text, moderator_id
		FROM public.moderation
		WHERE id = $1
		FOR UPDATE`, id).
		Scan(&app.ID, &app.PromotionID, &app.SegmentID, &app.SlotID, &app.SellerID, &app.ProductID, &app.Discount, &app.StopFactors, &app.Status, &app.CreatedAt, &app.UpdatedAt, &app.ModeratedAt, &app.ModeratorID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("moderation application not found: %w", ErrNotFound)
		}
		return err
	}
	if app.Status != "pending" {
		return fmt.Errorf("moderation application already processed (status=%s): %w", app.Status, ErrConflict)
	}

	var slotStatus string
	err = tx.QueryRow(ctx, `SELECT status FROM public.slot WHERE id = $1 FOR UPDATE`, app.SlotID).Scan(&slotStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("slot not found for moderation application %d: %w", app.ID, ErrNotFound)
		}
		return err
	}
	if slotStatus != "moderation" {
		return fmt.Errorf("slot %d is in status %s, expected moderation: %w", app.SlotID, slotStatus, ErrConflict)
	}

	if _, err := tx.Exec(ctx, `UPDATE public.moderation
		SET status=$2, moderated_at=now(), moderator_id=$3, updated_at=now()
		WHERE id=$1`, id, status, moderatorID); err != nil {
		return err
	}

	switch status {
	case "approved":
		if _, err := tx.Exec(ctx, `UPDATE public.slot
			SET seller_id=$2, product_id=$3, status='occupied', updated_at=now()
			WHERE id=$1`, app.SlotID, app.SellerID, app.ProductID); err != nil {
			return err
		}
	case "rejected":
		if _, err := tx.Exec(ctx, `UPDATE public.slot
			SET seller_id=NULL, product_id=NULL, status='available', updated_at=now()
			WHERE id=$1`, app.SlotID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

var _ ModerationRepository = (*ModerationPostgres)(nil)
