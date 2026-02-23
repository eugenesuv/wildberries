# Smoke Report: Full Buyer/Seller/Admin E2E (E1)

Date: 2026-02-23 (local, MSK)

## Status

- `E1` full live API smoke: `PASS`
- `B2` runtime correctness checks (targeted) inside the same run: `PASS`

## Scope

- Full cross-role API smoke (`admin`, `seller`, `buyer`)
- Fixed-flow path: admin setup -> seller apply -> admin approve -> buyer identification/products
- Targeted `B2` checks:
  - buyer `completed` flag after `COMPLETED`
  - seller auction market `minBid` after first bid
  - seller auction `MakeBet` validation against `topBid + bidStep`

## Environment

- Branch: `codex/b2-backend-buyer-seller-runtime-correctness`
- Backend: local `go run ./cmd/server` on `http://127.0.0.1:18080` (`gRPC:17002`)
- Postgres: temporary local PostgreSQL 18 on `127.0.0.1:55432` (`seller_promotions`)
- DB setup:
  - migration `20251108161617_init.sql` applied via `psql` (manual `goose Up` extraction)
  - seed loaded: `backend/docs/dev_seed_products.sql`
- Smoke runner (local): `/tmp/wb-e1-smoke.sh`

## Checks

- `backend`: `go test ./internal/service/... ./internal/api/... ./internal/repository/... ./internal/app ./cmd/server` - PASS
- `wb_front`: `npm run build` - PASS

## Core E1 Flow (PASS)

1. `Admin` creates fixed-price promotion (`questions`, `slotCount=2`)
2. `Admin` creates segment, sets fixed prices/poll questions, transitions to `READY_TO_START` and `RUNNING`
3. `Seller` sees promotion/segment/slots and sends fixed-slot application (`pending_moderation`)
4. `Admin` sees pending moderation application and approves it
5. `Buyer` gets current promotion, passes identification, and receives approved product in segment products

## B2 Checks (PASS)

- Buyer mismatch `promotionId/segmentId` ownership check: mismatch request rejected or empty
- Seller product ownership check: чужой product rejected (`not yours`)
- Buyer `completed` flag after `COMPLETED`: returns `completed=true`
- Seller auction market `minBid`: updates to `topBid + bidStep` (`1100` after first bid `1000` with step `100`)
- Seller auction `MakeBet`: rejects bid below next valid minimum after first bid

## Notes

- This is API-level live smoke (no browser click automation).
- Earlier blocked `E1` run (before `B2` fixes) exists in task branch history and was used to derive the `B2` fix list.
