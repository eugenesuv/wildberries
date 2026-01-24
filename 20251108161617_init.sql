-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."horoscope" (
    "id" bigint NOT NULL,
    "promotion_id" bigint NOT NULL,
    "zodiac_id" bigint NOT NULL,
    "created_at" timestamp NOT NULL,
    "text" text NOT NULL,
    "category_id" bigint NOT NULL,
    CONSTRAINT "pk_horoscope_id" PRIMARY KEY ("id")
);

CREATE TABLE "public"."promotion" (
    "id" bigint NOT NULL,
    "status" text NOT NULL,
    "start_time" timestamp NOT NULL,
    "end_time" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_promotion_id" PRIMARY KEY ("id")
);

CREATE TABLE "public"."auction" (
    "id" bigint NOT NULL,
    "status" text NOT NULL,
    "start_time" timestamp NOT NULL,
    "end_time" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    "deleted_at" timestamp,
    "horoscope_id" bigint NOT NULL,
    CONSTRAINT "pk_auction_id" PRIMARY KEY ("id")
);

CREATE TABLE "public"."horoscope_product" (
    "product_id" bigint NOT NULL,
    "horoscope_id" bigint NOT NULL
);

CREATE TABLE "public"."product" (
    "id" bigint NOT NULL,
    "seller_id" bigint NOT NULL,
    "nm_id" bigint NOT NULL,
    "category_id" bigint NOT NULL,
    "category_name" text NOT NULL,
    "name" text NOT NULL,
    "image" text,
    "price" bigint NOT NULL,
    "discount" integer NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    "deleted_at" timestamp,
    CONSTRAINT "pk_product_id" PRIMARY KEY ("id")
);

CREATE TABLE "public"."bet" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "auction_id" bigint NOT NULL,
    "bet" bigint NOT NULL,
    "created_at" timestamp NOT NULL,
    "deleted_at" timestamp,
    CONSTRAINT "pk_bet_id" PRIMARY KEY ("id")
);

CREATE TABLE "public"."zodiac" (
    "id" bigint NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "pk_zodiac_id" PRIMARY KEY ("id")
);

ALTER TABLE "public"."auction" ADD CONSTRAINT "fk_auction_horoscope_id_horoscope_id" FOREIGN KEY("horoscope_id") REFERENCES "public"."horoscope"("id");
ALTER TABLE "public"."bet" ADD CONSTRAINT "fk_bet_auction_id_auction_id" FOREIGN KEY("auction_id") REFERENCES "public"."auction"("id");
ALTER TABLE "public"."bet" ADD CONSTRAINT "fk_bet_product_id_product_id" FOREIGN KEY("product_id") REFERENCES "public"."product"("id");
ALTER TABLE "public"."horoscope_product" ADD CONSTRAINT "fk_horoscope_product_horoscope_id_horoscope_id" FOREIGN KEY("horoscope_id") REFERENCES "public"."horoscope"("id");
ALTER TABLE "public"."horoscope_product" ADD CONSTRAINT "fk_horoscope_product_product_id_product_id" FOREIGN KEY("product_id") REFERENCES "public"."product"("id");
ALTER TABLE "public"."horoscope" ADD CONSTRAINT "fk_horoscope_promotion_id_promotion_id" FOREIGN KEY("promotion_id") REFERENCES "public"."promotion"("id");
ALTER TABLE "public"."horoscope" ADD CONSTRAINT "fk_horoscope_zodiac_id_zodiac_id" FOREIGN KEY("zodiac_id") REFERENCES "public"."zodiac"("id");

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE "public"."bet" DROP CONSTRAINT "fk_bet_product_id_product_id";
ALTER TABLE "public"."bet" DROP CONSTRAINT "fk_bet_auction_id_auction_id";
ALTER TABLE "public"."auction" DROP CONSTRAINT "fk_auction_horoscope_id_horoscope_id";
ALTER TABLE "public"."horoscope_product" DROP CONSTRAINT "fk_horoscope_product_product_id_product_id";
ALTER TABLE "public"."horoscope_product" DROP CONSTRAINT "fk_horoscope_product_horoscope_id_horoscope_id";
ALTER TABLE "public"."horoscope" DROP CONSTRAINT "fk_horoscope_zodiac_id_zodiac_id";
ALTER TABLE "public"."horoscope" DROP CONSTRAINT "fk_horoscope_promotion_id_promotion_id";

DROP TABLE IF EXISTS "public"."bet";
DROP TABLE IF EXISTS "public"."auction";
DROP TABLE IF EXISTS "public"."product";
DROP TABLE IF EXISTS "public"."horoscope_product";
DROP TABLE IF EXISTS "public"."horoscope";
DROP TABLE IF EXISTS "public"."promotion";
DROP TABLE IF EXISTS "public"."zodiac";

DROP SCHEMA IF EXISTS "public";
-- +goose StatementEnd
