-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS "public";

-- promotion: расширенная модель генератора акций
CREATE TABLE "public"."promotion" (
    "id" bigserial PRIMARY KEY,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "theme" text NOT NULL,
    "date_from" timestamptz NOT NULL,
    "date_to" timestamptz NOT NULL,
    "status" text NOT NULL CHECK ("status" IN ('NOT_READY', 'READY_TO_START', 'RUNNING', 'PAUSED', 'COMPLETED')),
    "identification_mode" text NOT NULL CHECK ("identification_mode" IN ('questions', 'user_profile')),
    "pricing_model" text NOT NULL CHECK ("pricing_model" IN ('auction', 'fixed')),
    "slot_count" int NOT NULL DEFAULT 10,
    "min_discount" int,
    "max_discount" int,
    "min_price" bigint,
    "bid_step" bigint,
    "stop_factors" jsonb,
    "fixed_prices" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX idx_promotion_status ON "public"."promotion" ("status");
CREATE INDEX idx_promotion_dates ON "public"."promotion" ("date_from", "date_to");

-- справочник знаков зодиака (тема zodiac)
CREATE TABLE "public"."zodiac" (
    "id" bigserial PRIMARY KEY,
    "name" text NOT NULL
);

-- product: каталог товаров, seller_id — внешний ID из другой системы
CREATE TABLE "public"."product" (
    "id" bigserial PRIMARY KEY,
    "seller_id" bigint NOT NULL,
    "nm_id" bigint NOT NULL,
    "category_id" bigint NOT NULL,
    "category_name" text NOT NULL,
    "name" text NOT NULL,
    "image" text,
    "price" bigint NOT NULL CONSTRAINT price_check CHECK ("price" > 0),
    "discount" int NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX idx_product_seller ON "public"."product" ("seller_id");

-- horoscope: для темы zodiac (совместимость)
CREATE TABLE "public"."horoscope" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "zodiac_id" bigint NOT NULL REFERENCES "public"."zodiac" ("id"),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "text" text NOT NULL,
    "category_id" bigint NOT NULL
);

CREATE TABLE "public"."horoscope_product" (
    "horoscope_id" bigint NOT NULL REFERENCES "public"."horoscope" ("id"),
    "product_id" bigint NOT NULL REFERENCES "public"."product" ("id"),
    PRIMARY KEY ("horoscope_id", "product_id")
);

-- segment: сегменты акции (знак зодиака, факультет и т.д.)
CREATE TABLE "public"."segment" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "name" text NOT NULL,
    "category_id" bigint,
    "category_name" text,
    "color" text,
    "order_index" int NOT NULL DEFAULT 0,
    "text" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_segment_promotion ON "public"."segment" ("promotion_id");

-- poll_question: вопросы опроса идентификации
CREATE TABLE "public"."poll_question" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "text" text NOT NULL,
    "order_index" int NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_question_promotion ON "public"."poll_question" ("promotion_id");

-- poll_option: варианты ответов
CREATE TABLE "public"."poll_option" (
    "id" bigserial PRIMARY KEY,
    "question_id" bigint NOT NULL REFERENCES "public"."poll_question" ("id"),
    "text" text NOT NULL,
    "value" text NOT NULL,
    "order_index" int NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_option_question ON "public"."poll_option" ("question_id");

-- poll_answer_tree: дерево маршрутизации ответов → сегмент
CREATE TABLE "public"."poll_answer_tree" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "node_id" uuid NOT NULL,
    "parent_node_id" uuid,
    "label" text NOT NULL,
    "value" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_answer_tree_promotion ON "public"."poll_answer_tree" ("promotion_id");

-- slot: слоты под товары (по сегментам); auction_id FK добавляется после создания auction
CREATE TABLE "public"."slot" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "segment_id" bigint NOT NULL REFERENCES "public"."segment" ("id"),
    "position" int NOT NULL,
    "pricing_type" text NOT NULL CHECK ("pricing_type" IN ('auction', 'fixed')),
    "price" bigint,
    "auction_id" bigint,
    "status" text NOT NULL CHECK ("status" IN ('available', 'occupied', 'pending', 'moderation', 'rejected')),
    "seller_id" bigint,
    "product_id" bigint REFERENCES "public"."product" ("id"),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_slot_segment ON "public"."slot" ("segment_id");
CREATE INDEX idx_slot_status ON "public"."slot" ("status");
CREATE INDEX idx_slot_seller ON "public"."slot" ("seller_id");

-- auction: создаётся при переходе в READY_TO_START для каждого аукционного слота
CREATE TABLE "public"."auction" (
    "id" bigserial PRIMARY KEY,
    "slot_id" bigint NOT NULL REFERENCES "public"."slot" ("id"),
    "date_from" timestamptz NOT NULL,
    "date_to" timestamptz NOT NULL,
    "min_price" bigint NOT NULL,
    "bid_step" bigint NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE UNIQUE INDEX idx_auction_slot ON "public"."auction" ("slot_id");

ALTER TABLE "public"."slot" ADD CONSTRAINT fk_slot_auction FOREIGN KEY ("auction_id") REFERENCES "public"."auction" ("id") ON DELETE SET NULL;

-- bet: ставки по аукциону
CREATE TABLE "public"."bet" (
    "id" bigserial PRIMARY KEY,
    "auction_id" bigint NOT NULL REFERENCES "public"."auction" ("id"),
    "product_id" bigint NOT NULL REFERENCES "public"."product" ("id"),
    "bet" bigint NOT NULL CONSTRAINT bet_check CHECK ("bet" > 0),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz
);

CREATE INDEX idx_bet_auction ON "public"."bet" ("auction_id");

-- moderation: заявки селлеров на фиксированные слоты
CREATE TABLE "public"."moderation" (
    "id" bigserial PRIMARY KEY,
    "promotion_id" bigint NOT NULL REFERENCES "public"."promotion" ("id"),
    "segment_id" bigint NOT NULL REFERENCES "public"."segment" ("id"),
    "slot_id" bigint NOT NULL REFERENCES "public"."slot" ("id"),
    "seller_id" bigint NOT NULL,
    "product_id" bigint NOT NULL REFERENCES "public"."product" ("id"),
    "discount" int NOT NULL,
    "stop_factors" jsonb,
    "status" text NOT NULL CHECK ("status" IN ('pending', 'approved', 'rejected')),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "moderated_at" timestamptz,
    "moderator_id" bigint
);

CREATE INDEX idx_moderation_promotion ON "public"."moderation" ("promotion_id");
CREATE INDEX idx_moderation_status ON "public"."moderation" ("status");

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS "public"."moderation";
DROP TABLE IF EXISTS "public"."bet";
ALTER TABLE "public"."slot" DROP CONSTRAINT IF EXISTS fk_slot_auction;
DROP TABLE IF EXISTS "public"."auction";
DROP TABLE IF EXISTS "public"."slot";
DROP TABLE IF EXISTS "public"."poll_answer_tree";
DROP TABLE IF EXISTS "public"."poll_option";
DROP TABLE IF EXISTS "public"."poll_question";
DROP TABLE IF EXISTS "public"."segment";
DROP TABLE IF EXISTS "public"."horoscope_product";
DROP TABLE IF EXISTS "public"."horoscope";
DROP TABLE IF EXISTS "public"."product";
DROP TABLE IF EXISTS "public"."zodiac";
DROP TABLE IF EXISTS "public"."promotion";
DROP SCHEMA IF EXISTS "public";
-- +goose StatementEnd
