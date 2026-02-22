# Runbook: локальный запуск "Генерация акций"

## Что уже важно знать

- Backend HTTP API (gRPC-Gateway) работает через один порт: `8080`
- Backend gRPC порт: `7002`
- `7003` в текущем `docker-compose` используется для Swagger UI, это не AI API
- Фронт должен ходить в backend через `VITE_API_BASE_URL=/api` (Vite proxy -> `http://localhost:8080`)

## Порядок запуска (локально)

1. Поднять инфраструктуру backend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wb_back
docker compose up -d
```

2. Применить миграции БД (отдельным шагом):

```bash
cd /Users/eugenesuvorov/Study/wildberris/wb_back
goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" up
```

3. Загрузить dev-товары для seller flow:

```bash
psql "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" \
  -f /Users/eugenesuvorov/Study/wildberris/wb_back/docs/dev_seed_products.sql
```

4. Запустить backend (если запускается не контейнером приложения):

```bash
cd /Users/eugenesuvorov/Study/wildberris/wb_back
HTTP_PORT=8080 GRPC_PORT=7002 go run ./cmd/server
```

5. Запустить frontend:

```bash
cd /Users/eugenesuvorov/Study/wildberris/wb_front
VITE_API_BASE_URL=/api VITE_SELLER_ID=1 npm run dev
```

## Проверка smoke после запуска

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

## Известные ограничения launch-MVP

- AI endpoints могут возвращать пустые ответы; фронт использует fallback-генераторы
- `user_profile` identification пока deterministic fallback
- UI хранит `minDiscount/maxDiscount`, backend сохраняет один `discount` (compatibility mode)
- Нет real-time обновления аукциона (WS/Kafka вне scope)
