package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PollPostgres struct {
	pool *pgxpool.Pool
}

func NewPollPostgres(pool *pgxpool.Pool) *PollPostgres {
	return &PollPostgres{pool: pool}
}

func (r *PollPostgres) QuestionsByPromotion(ctx context.Context, promotionID int64) ([]*PollQuestionRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, promotion_id, text, order_index
		FROM public.poll_question
		WHERE promotion_id = $1
		ORDER BY order_index, id`, promotionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*PollQuestionRow
	for rows.Next() {
		var row PollQuestionRow
		if err := rows.Scan(&row.ID, &row.PromotionID, &row.Text, &row.OrderIndex); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *PollPostgres) OptionsByQuestionIDs(ctx context.Context, questionIDs []int64) ([]*PollOptionRow, error) {
	if len(questionIDs) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx, `SELECT id, question_id, text, value, order_index
		FROM public.poll_option
		WHERE question_id = ANY($1)
		ORDER BY question_id, order_index, id`, questionIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*PollOptionRow
	for rows.Next() {
		var row PollOptionRow
		if err := rows.Scan(&row.ID, &row.QuestionID, &row.Text, &row.Value, &row.OrderIndex); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *PollPostgres) AnswerTreeByPromotion(ctx context.Context, promotionID int64) ([]*PollAnswerTreeRow, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, promotion_id, node_id::text, parent_node_id::text, label, value
		FROM public.poll_answer_tree
		WHERE promotion_id = $1
		ORDER BY id`, promotionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*PollAnswerTreeRow
	for rows.Next() {
		var row PollAnswerTreeRow
		if err := rows.Scan(&row.ID, &row.PromotionID, &row.NodeID, &row.ParentNodeID, &row.Label, &row.Value); err != nil {
			return nil, err
		}
		out = append(out, &row)
	}
	return out, rows.Err()
}

func (r *PollPostgres) SaveQuestions(ctx context.Context, promotionID int64, questions []PollQuestionInput) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM public.poll_option
		WHERE question_id IN (SELECT id FROM public.poll_question WHERE promotion_id = $1)`, promotionID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM public.poll_question WHERE promotion_id = $1`, promotionID); err != nil {
		return err
	}

	for qi, q := range questions {
		var qID int64
		err = tx.QueryRow(ctx, `INSERT INTO public.poll_question (promotion_id, text, order_index)
			VALUES ($1,$2,$3) RETURNING id`, promotionID, q.Text, qi).Scan(&qID)
		if err != nil {
			return err
		}
		for oi, opt := range q.Options {
			if _, err := tx.Exec(ctx, `INSERT INTO public.poll_option (question_id, text, value, order_index)
				VALUES ($1,$2,$3,$4)`, qID, opt.Text, opt.Value, oi); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *PollPostgres) SaveAnswerTree(ctx context.Context, promotionID int64, nodes []PollAnswerTreeInput) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM public.poll_answer_tree WHERE promotion_id = $1`, promotionID); err != nil {
		return err
	}

	for _, n := range nodes {
		var parent any
		if n.ParentNodeID != "" {
			parent = n.ParentNodeID
		}
		if _, err := tx.Exec(ctx, `INSERT INTO public.poll_answer_tree (promotion_id, node_id, parent_node_id, label, value)
			VALUES ($1,$2::uuid,$3::uuid,$4,$5)`,
			promotionID, n.NodeID, parent, n.Label, n.Value); err != nil {
			return fmt.Errorf("insert poll_answer_tree node %s: %w", n.NodeID, err)
		}
	}

	return tx.Commit(ctx)
}

var _ PollRepository = (*PollPostgres)(nil)
