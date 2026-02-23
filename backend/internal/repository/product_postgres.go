package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductPostgres struct {
	pool *pgxpool.Pool
}

func NewProductPostgres(pool *pgxpool.Pool) *ProductPostgres {
	return &ProductPostgres{pool: pool}
}

func (r *ProductPostgres) GetByID(ctx context.Context, id int64) (*ProductRow, error) {
	var row ProductRow
	err := r.pool.QueryRow(ctx, `SELECT id, seller_id, nm_id, category_id, category_name, name, image, price, discount, created_at::text, updated_at::text, deleted_at::text
		FROM public.product WHERE id = $1 AND deleted_at IS NULL`, id).
		Scan(&row.ID, &row.SellerID, &row.NmID, &row.CategoryID, &row.CategoryName, &row.Name, &row.Image, &row.Price, &row.Discount, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *ProductPostgres) GetByIDs(ctx context.Context, ids []int64, filters ProductFilters) ([]*ProductRow, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	// Simple implementation: query by ids
	rows, err := r.pool.Query(ctx, `SELECT id, seller_id, nm_id, category_id, category_name, name, image, price, discount, created_at::text, updated_at::text, deleted_at::text
		FROM public.product WHERE id = ANY($1) AND deleted_at IS NULL`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*ProductRow
	for rows.Next() {
		var row ProductRow
		err = rows.Scan(&row.ID, &row.SellerID, &row.NmID, &row.CategoryID, &row.CategoryName, &row.Name, &row.Image, &row.Price, &row.Discount, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *ProductPostgres) ListBySeller(ctx context.Context, sellerID int64, categoryID string, page, perPage int) ([]*ProductRow, int, error) {
	if perPage <= 0 {
		perPage = 10
	}
	offset := (page - 1) * perPage
	if offset < 0 {
		offset = 0
	}
	q := `SELECT id, seller_id, nm_id, category_id, category_name, name, image, price, discount, created_at::text, updated_at::text, deleted_at::text
		FROM public.product WHERE seller_id = $1 AND deleted_at IS NULL`
	countQ := `SELECT count(*) FROM public.product WHERE seller_id = $1 AND deleted_at IS NULL`
	args := []interface{}{sellerID}
	if categoryID != "" {
		q += ` AND category_id::text = $2`
		countQ += ` AND category_id::text = $2`
		args = append(args, categoryID)
	}
	var total int
	err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	args = append(args, perPage, offset)
	q += fmt.Sprintf(` ORDER BY id LIMIT $%d OFFSET $%d`, len(args)-1, len(args))
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*ProductRow
	for rows.Next() {
		var row ProductRow
		err = rows.Scan(&row.ID, &row.SellerID, &row.NmID, &row.CategoryID, &row.CategoryName, &row.Name, &row.Image, &row.Price, &row.Discount, &row.CreatedAt, &row.UpdatedAt, &row.DeletedAt)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, &row)
	}
	return out, total, rows.Err()
}

var _ ProductRepository = (*ProductPostgres)(nil)
