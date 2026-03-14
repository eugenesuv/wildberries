# =====================
# OS detection
# =====================
ifeq ($(OS),Windows_NT)

define MKDIR
powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '$(1)' | Out-Null"
endef

define RM
powershell -NoProfile -Command "if (Test-Path '$(1)') { Remove-Item -Recurse -Force '$(1)' }"
endef

EXE := .exe

else

define MKDIR
mkdir -p $(1)
endef

define RM
rm -rf $(1)
endef

EXE :=

endif


# =====================
# Paths
# =====================
ROOT := $(CURDIR)
BACKEND_PATH := $(ROOT)/backend
OUT_PATH := $(BACKEND_PATH)/pkg
LOCAL_BIN := $(BACKEND_PATH)/bin
VENDOR := $(BACKEND_PATH)/vendor.protogen

PROTOC := protoc
PROTOC_GEN_GO := $(LOCAL_BIN)/protoc-gen-go$(EXE)
PROTOC_GEN_GRPC := $(LOCAL_BIN)/protoc-gen-go-grpc$(EXE)
PROTOC_GEN_GATEWAY := $(LOCAL_BIN)/protoc-gen-grpc-gateway$(EXE)
PROTOC_GEN_OPENAPI := $(LOCAL_BIN)/protoc-gen-openapiv2$(EXE)

# all
all: bin-deps-small docker-up migrations-up

# =====================
# Docker
# =====================
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f

# =====================
# Backend services
# =====================
backend-run:
	cd $(BACKEND_PATH) && go run cmd/server/main.go

backend-build:
	cd $(BACKEND_PATH) && go build -o bin/server cmd/server/main.go

# =====================
# Frontend services
# =====================
frontend-install:
	cd $(ROOT)/wb_front && npm install

frontend-run:
	cd $(ROOT)/wb_front && npm run dev

frontend-build:
	cd $(ROOT)/wb_front && npm run build

# =====================
# Migrations
# =====================
migrations-up:
	cd $(BACKEND_PATH) && goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" up

migrations-down:
	cd $(BACKEND_PATH) && goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5442/seller_promotions?sslmode=disable" down

migrations-new:
	cd $(BACKEND_PATH) && goose create -dir ./migrations rename sql

# =====================
# Binary deps (idempotent)
# =====================
bin-deps:
	@$(call MKDIR,$(LOCAL_BIN))
ifeq ($(OS),Windows_NT)
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install google.golang.org/protobuf/cmd/protoc-gen-go@latest"
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest"
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest"
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install github.com/envoyproxy/protoc-gen-validate@latest"
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install github.com/pressly/goose/v3/cmd/goose@latest"
else
	GOBIN=$(LOCAL_BIN) go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	GOBIN=$(LOCAL_BIN) go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	GOBIN=$(LOCAL_BIN) go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
	GOBIN=$(LOCAL_BIN) go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
	GOBIN=$(LOCAL_BIN) go install github.com/envoyproxy/protoc-gen-validate@latest
	GOBIN=$(LOCAL_BIN) go install github.com/pressly/goose/v3/cmd/goose@latest
endif

bin-deps-small:
	@$(call MKDIR,$(LOCAL_BIN))
ifeq ($(OS),Windows_NT)
	powershell -NoProfile -Command "$$env:GOBIN='$(LOCAL_BIN)'; go install github.com/pressly/goose/v3/cmd/goose@latest"
else
	GOBIN=$(LOCAL_BIN) go install github.com/pressly/goose/v3/cmd/goose@latest
endif


# =====================
# Generate
# =====================
generate: bin-deps vendor-proto
	@$(call RM,$(OUT_PATH))
	@$(call MKDIR,$(OUT_PATH))
	@$(call MKDIR,$(OUT_PATH)/admin)
	@$(call MKDIR,$(OUT_PATH)/buyer)
	@$(call MKDIR,$(OUT_PATH)/seller)
	@$(call MKDIR,$(OUT_PATH)/ai)
	@$(call MKDIR,$(OUT_PATH)/common)

	$(call gen,admin)
	$(call gen,buyer)
	$(call gen,seller)
	$(call gen,ai)
	$(call gen,common)

define gen
	cd $(BACKEND_PATH) && $(PROTOC) \
		--proto_path=api/proto \
		--proto_path=$(VENDOR) \
		--plugin=protoc-gen-go=$(PROTOC_GEN_GO) \
		--go_out=$(OUT_PATH)/$1 --go_opt=paths=source_relative \
		--plugin=protoc-gen-go-grpc=$(PROTOC_GEN_GRPC) \
		--go-grpc_out=$(OUT_PATH)/$1 --go-grpc_opt=paths=source_relative \
		--plugin=protoc-gen-grpc-gateway=$(PROTOC_GEN_GATEWAY) \
		--grpc-gateway_out=$(OUT_PATH)/$1 --grpc-gateway_opt=paths=source_relative \
		--plugin=protoc-gen-openapiv2=$(PROTOC_GEN_OPENAPI) \
		--openapiv2_out=$(OUT_PATH)/$1 \
		api/proto/$1.proto
endef

# =====================
# Vendor proto (idempotent)
# =====================
vendor-proto:
ifeq ($(OS),Windows_NT)
	@if not exist "$(VENDOR)\google\protobuf" ( \
		git clone --depth=1 https://github.com/protocolbuffers/protobuf tmp-protobuf && \
		powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '$(VENDOR)\google' | Out-Null" && \
		move tmp-protobuf\src\google\protobuf $(VENDOR)\google\ && \
		rmdir /S /Q tmp-protobuf \
	)

	@if not exist "$(VENDOR)\google\api" ( \
		git clone --depth=1 https://github.com/googleapis/googleapis tmp-googleapis && \
		powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '$(VENDOR)\google' | Out-Null" && \
		move tmp-googleapis\google\api $(VENDOR)\google\ && \
		rmdir /S /Q tmp-googleapis \
	)

	@if not exist "$(VENDOR)\protoc-gen-openapiv2" ( \
		git clone --depth=1 https://github.com/grpc-ecosystem/grpc-gateway tmp-gw && \
		powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '$(VENDOR)\protoc-gen-openapiv2' | Out-Null" && \
		move tmp-gw\protoc-gen-openapiv2\options $(VENDOR)\protoc-gen-openapiv2\ && \
		rmdir /S /Q tmp-gw \
	)

	@if not exist "$(VENDOR)\validate" ( \
		git clone --depth=1 https://github.com/bufbuild/protoc-gen-validate tmp-validate && \
		move tmp-validate\validate $(VENDOR)\ && \
		rmdir /S /Q tmp-validate \
	)
else
	@if [ ! -d "$(VENDOR)/google/protobuf" ]; then \
		git clone --depth=1 https://github.com/protocolbuffers/protobuf tmp-protobuf && \
		mkdir -p $(VENDOR)/google && \
		mv tmp-protobuf/src/google/protobuf $(VENDOR)/google/ && \
		rm -rf tmp-protobuf ; \
	fi

	@if [ ! -d "$(VENDOR)/google/api" ]; then \
		git clone --depth=1 https://github.com/googleapis/googleapis tmp-googleapis && \
		mkdir -p $(VENDOR)/google && \
		mv tmp-googleapis/google/api $(VENDOR)/google/ && \
		rm -rf tmp-googleapis ; \
	fi

	@if [ ! -d "$(VENDOR)/protoc-gen-openapiv2" ]; then \
		git clone --depth=1 https://github.com/grpc-ecosystem/grpc-gateway tmp-gw && \
		mkdir -p $(VENDOR)/protoc-gen-openapiv2 && \
		mv tmp-gw/protoc-gen-openapiv2/options $(VENDOR)/protoc-gen-openapiv2/ && \
		rm -rf tmp-gw ; \
	fi

	@if [ ! -d "$(VENDOR)/validate" ]; then \
		git clone --depth=1 https://github.com/bufbuild/protoc-gen-validate tmp-validate && \
		mv tmp-validate/validate $(VENDOR)/ && \
		rm -rf tmp-validate ; \
	fi
endif

# =====================
# Help
# =====================
help:
	@echo "Available commands:"
	@echo "  docker-up        - Start all containers"
	@echo "  docker-down      - Stop all containers"
	@echo "  docker-build     - Build all containers"
	@echo "  docker-logs      - Follow logs"
	@echo "  backend-run      - Run backend locally"
	@echo "  backend-build    - Build backend binary"
	@echo "  frontend-install - Install frontend dependencies"
	@echo "  frontend-run     - Run frontend locally"
	@echo "  frontend-build   - Build frontend"
	@echo "  migrations-up    - Run migrations"
	@echo "  migrations-down  - Rollback migrations"
	@echo "  migrations-new   - Create new migration"
	@echo "  generate         - Generate protobuf files"
	@echo "  bin-deps         - Install binary dependencies"
	@echo "  vendor-proto     - Vendor proto files"

.PHONY: docker-up docker-down docker-build docker-logs backend-run backend-build frontend-install frontend-run frontend-build migrations-up migrations-down migrations-new generate bin-deps vendor-proto help
