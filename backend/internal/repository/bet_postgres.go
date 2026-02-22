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

func (r *BetPostgres) DeleteBySlotAndSeller(ctx context.Context, slotID, sellerID int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.bet SET deleted_at=now() WHERE slot_id=$1 AND seller_id=$2`, slotID, sellerID)
	return err
}

var _ BetRepository = (*BetPostgres)(nil)
