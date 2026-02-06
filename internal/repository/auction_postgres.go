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

func (r *AuctionPostgres) GetBySlotID(ctx context.Context, slotID int64) (auctionID int64, minPrice, bidStep int64, err error) {
	return 0, 0, 0, nil
}

func (r *AuctionPostgres) Create(ctx context.Context, slotID int64, dateFrom, dateTo string, minPrice, bidStep int64) (int64, error) {
	_, _, _, _, _ = slotID, dateFrom, dateTo, minPrice, bidStep
	return 0, nil
}

var _ AuctionRepository = (*AuctionPostgres)(nil)
