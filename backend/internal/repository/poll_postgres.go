package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PollPostgres struct {
	pool *pgxpool.Pool
}

func NewPollPostgres(pool *pgxpool.Pool) *PollPostgres {
	return &PollPostgres{pool: pool}
}

func (r *PollPostgres) QuestionsByPromotion(ctx context.Context, promotionID int64) ([]*PollQuestionRow, error) {
	_ = promotionID
	return nil, nil
}

func (r *PollPostgres) OptionsByQuestionIDs(ctx context.Context, questionIDs []int64) ([]*PollOptionRow, error) {
	_ = questionIDs
	return nil, nil
}

func (r *PollPostgres) AnswerTreeByPromotion(ctx context.Context, promotionID int64) ([]*PollAnswerTreeRow, error) {
	_ = promotionID
	return nil, nil
}

func (r *PollPostgres) SaveQuestions(ctx context.Context, promotionID int64, questions []PollQuestionInput) error {
	_, _ = promotionID, questions
	return nil
}

func (r *PollPostgres) SaveAnswerTree(ctx context.Context, promotionID int64, nodes []PollAnswerTreeInput) error {
	_, _ = promotionID, nodes
	return nil
}

var _ PollRepository = (*PollPostgres)(nil)
