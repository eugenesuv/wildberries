# Smoke Report: Admin Status Flow (B1 + C1)

Date: 2026-02-22

## Scope

- Backend `B1`: promotion status state machine + readiness validation (`ChangeStatus`)
- Frontend `C1`: admin settings status actions integration (build/start checks only)
- Runtime smoke focus: admin status flow via live backend HTTP API

## Environment

- Branch baseline before runtime fix: `codex/monorepo-dev`
- Local frontend build: `npm run build` (`wb_front`) - PASS
- Local frontend dev start-check (`vite`) - PASS
- Backend checks:
  - `go test ./internal/service/... ./internal/api/... ./internal/repository/...` - PASS
  - `go test ./internal/app ./cmd/server` - PASS
- Live smoke infra:
  - Temporary local Postgres (Homebrew `postgresql@18`) on `localhost:55432`
  - Backend on `localhost:18080` / `grpc:17002`

## Runtime blocker found and fixed

During the first live smoke attempt, backend returned `500` before reaching `B1` validations:

- `pgx` binary scan error for `timestamptz` -> `*string` in repository row models
- This affected `promotion` first, then `segment` (same pattern), and potentially other repositories

Fix approach:

- Cast timestamp columns to `::text` in repository `SELECT` queries for row models with string timestamp fields
- No business logic changes; transport/service behavior unchanged

## API Smoke Cases (live)

Promotion setup:

- Created promotion (`auction`, `questions`, `slotCount=2`)
- Created one segment
- Set auction params (`minPrice=1000`, `bidStep=100`)
- Set poll question with 2 options

Validated cases:

1. `NOT_READY -> READY_TO_START` without segments -> `400` (`at least one segment is required`) - PASS
2. `NOT_READY -> READY_TO_START` without auction params -> `400` (`auction min_price must be set and > 0`) - PASS
3. `NOT_READY -> READY_TO_START` without poll questions -> `400` (`questions identification requires at least one question`) - PASS
4. `NOT_READY -> READY_TO_START` with complete config -> `200` - PASS
5. Materialization on `READY_TO_START`:
   - `auction` rows for promotion = `1`
   - `slot` rows for promotion = `2` (1 segment x 2 slots)
   - PASS
6. Repeated `READY_TO_START` -> `200` (idempotent) and auction count stays `1` - PASS
7. Invalid transition `READY_TO_START -> COMPLETED` -> `409` (`invalid status transition`) - PASS
8. Valid transitions:
   - `READY_TO_START -> RUNNING` -> `200`
   - `RUNNING -> PAUSED` -> `200`
   - `PAUSED -> RUNNING` -> `200`
   - `RUNNING -> COMPLETED` -> `200`
   - PASS
9. Invalid transition `COMPLETED -> RUNNING` -> `409` (`invalid status transition`) - PASS
10. Final status fetch returns `COMPLETED` - PASS

## Result

- `B1` runtime status/state-machine/readiness flow: PASS (after repository timestamp scan fix)
- `C1` frontend integration compile/start checks: PASS
- `C1` manual browser click-smoke: not executed in this environment (no interactive browser automation used)

## Notes

- Runbook in `codex/monorepo-dev` remains outdated (A1 branch not yet merged), so smoke used manual corrected local commands/ports.
