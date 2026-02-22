# Wildberries Monorepo

Локальный запуск backend + frontend для разработки.

## Структура

- `backend` — Go backend (gRPC + HTTP gateway, Postgres, Swagger UI)
- `wb_front` — Vite/React frontend

## Требования

- Docker + Docker Compose
- Go (для `goose`, если миграции запускаются локально)
- `psql` (PostgreSQL client)
- Node.js + npm

## Быстрый старт (рекомендуется)

Этот вариант запускает backend, DB и Swagger в Docker, а frontend локально.

1. Поднять backend-инфраструктуру и сервер:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose up -d --build
```

2. Применить миграции:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" up
```

3. Загрузить dev seed-данные (товары для seller flow):

```bash
psql "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" \
  -f /Users/eugenesuvorov/Study/wildberris/wildberries/backend/docs/dev_seed_products.sql
```

4. Если backend-контейнер стартовал до миграций и завершился с ошибкой, перезапустить:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose restart server
```

5. Запустить frontend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/wb_front
npm ci
VITE_API_BASE_URL=/api VITE_SELLER_ID=1 npm run dev
```

## Куда заходить

- Frontend: `http://localhost:5173`
- Backend HTTP API: `http://localhost:8080`
- Swagger UI: `http://localhost:7003`

## Альтернатива: backend локально через Go

Если нужно запускать backend не в контейнере:

1. Поднять только БД и Swagger:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose up -d db swagger-ui
```

2. Запустить backend локально:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
DATABASE_DSN=postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable \
HTTP_PORT=8080 GRPC_PORT=7002 go run ./cmd/server
```

Важно: не запускать одновременно Docker-контейнер `server` и локальный `go run` (конфликт портов `8080` и `7002`).

## Пауза / возобновление (локально)

### Если backend/db/swagger запущены через Docker

Поставить на паузу (контейнеры остановятся, данные в volume сохранятся):

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose stop
```

Возобновить:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose start
```

### Если backend запущен через `go run`, frontend через `npm run dev`, а БД локально (fallback)

- В терминале с backend (`go run ./cmd/server`) нажать `Ctrl+C`
- В терминале с frontend (`npm run dev`) нажать `Ctrl+C`
- Если поднимали локальный Postgres через `pg_ctl`, остановить:

```bash
/opt/homebrew/opt/postgresql@18/bin/pg_ctl -D /tmp/wb-e1-pg stop
```

Повторный запуск:

- backend: снова выполнить команду `go run` из раздела выше
- frontend: снова выполнить `npm run dev`
- local Postgres (если использовался): `pg_ctl ... start` с тем же каталогом данных

## Полная остановка (Docker)

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose down
```

## Полезные заметки

- Vite proxy уже настроен: `/api` -> `http://localhost:8080`
- Для локального `go run` backend обязательно задавать `DATABASE_DSN`, иначе backend попробует подключиться к `db:5432`
- Подробный runbook: `backend/docs/runbook_локальный_запуск_генерация_акций.md`
