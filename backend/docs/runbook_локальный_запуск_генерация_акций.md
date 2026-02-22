# Runbook: локальный запуск "Генерация акций"

## Что уже важно знать

- Backend HTTP API (gRPC-Gateway) работает через один порт: `8080`
- Backend gRPC порт: `7002`
- `7003` в текущем `docker-compose` используется для Swagger UI, это не AI API
- Фронт должен ходить в backend через `VITE_API_BASE_URL=/api` (Vite proxy -> `http://localhost:8080`)
- Для локального запуска backend через `go run` нужно явно задать `DATABASE_DSN` на `localhost:5442` (иначе backend попытается подключаться к контейнерному host `db:5432`)

## Порядок запуска (локально)

1. Поднять инфраструктуру backend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
docker compose up -d
```

2. Применить миграции БД (отдельным шагом):

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" up
```

3. Загрузить dev-товары для seller flow:

```bash
psql "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" \
  -f /Users/eugenesuvorov/Study/wildberris/wildberries/backend/docs/dev_seed_products.sql
```

4. Установить frontend-зависимости:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/wb_front
npm ci
```

Если `npm ci` не проходит из-за локального окружения/lockfile, допустим fallback:

```bash
npm install
```

5. Проверки перед smoke (рекомендуется, соответствует workflow монорепы)

Backend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
GOCACHE=/tmp/wb-go-build-cache go test ./internal/service/... ./internal/api/... ./internal/repository/...
GOCACHE=/tmp/wb-go-build-cache go test ./internal/app ./cmd/server
```

Frontend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/wb_front
npm run build
```

6. Запустить backend (если запускается не контейнером приложения):

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/backend
DATABASE_DSN=postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable \
HTTP_PORT=8080 GRPC_PORT=7002 go run ./cmd/server
```

7. Запустить frontend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wildberries/wb_front
VITE_API_BASE_URL=/api VITE_SELLER_ID=1 npm run dev
```

## Проверка smoke после запуска

Smoke имеет смысл выполнять только после шагов с миграциями и seed (пункты 2-3 выше).

1. `Buyer`:
- Открыть `/`
- Проверить загрузку текущей акции
- Перейти в `/promotion/:promotionId/:segmentId`

2. `Seller`:
- Открыть `/seller/actions`
- Выбрать акцию -> сегмент -> слот
- Выбрать товар из каталога (seed нужен для `seller_id=1`)

3. `Admin`:
- Открыть `/admin/dashboard`
- Создать/отредактировать акцию в `/admin/actions/new/settings`
- Проверить moderation `/admin/actions/:id/moderation`

## Troubleshooting (типичные проблемы)

- `goose` / `psql` -> `connection refused`: проверьте `docker compose up -d` и что используете порт `5442`, а не `5432`
- `vite: command not found`: не установлены frontend-зависимости, выполните `npm ci` (или `npm install` как fallback)
- Backend пытается подключиться к `db:5432` при `go run`: не задан `DATABASE_DSN` для локального запуска
- Ошибка доступа к `~/Library/Caches/go-build` в sandbox/CI: используйте `GOCACHE=/tmp/wb-go-build-cache` в командах `go test`

## Известные ограничения launch-MVP

- AI endpoints могут возвращать пустые ответы; фронт использует fallback-генераторы
- `user_profile` identification пока deterministic fallback
- UI хранит `minDiscount/maxDiscount`, backend сохраняет один `discount` (compatibility mode)
- Нет real-time обновления аукциона (WS/Kafka вне scope)
