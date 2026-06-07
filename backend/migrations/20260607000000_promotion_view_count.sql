-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS "public"."promotion_view_count" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "view_count" bigint NOT NULL DEFAULT 0,
    "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_view_count_promotion ON "public"."promotion_view_count" ("promotion_id");
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS "public"."promotion_view_count";
-- +goose StatementEnd