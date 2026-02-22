FROM golang:1.24.12-alpine AS builder

WORKDIR /app

COPY ../../go.mod ../../go.sum ./

RUN go mod download

COPY ../../. .

WORKDIR /app/cmd/server

RUN go build -o server

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/cmd/server/server .
COPY config.yaml .

RUN chmod +x server

ENTRYPOINT ["./server"]