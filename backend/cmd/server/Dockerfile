FROM golang:1.24.12-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server ./cmd/server

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/server .
COPY --from=builder /app/config.yaml .

RUN chmod +x server

EXPOSE 7001 7002 8080

ENTRYPOINT ["./server"]
