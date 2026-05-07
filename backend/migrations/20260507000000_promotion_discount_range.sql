-- +goose Up
-- +goose StatementBegin
ALTER TABLE public.promotion
    RENAME COLUMN discount TO max_discount;
ALTER TABLE public.promotion
    ADD COLUMN min_discount int NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE public.promotion
    DROP COLUMN min_discount;
ALTER TABLE public.promotion
    RENAME COLUMN max_discount TO discount;
-- +goose StatementEnd
