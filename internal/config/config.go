package config

import (
	"os"
	"strconv"
)

type Config struct {
	HTTPPort int
	GRPCPort int
	DSN      string
}

func Load() *Config {
	httpPort := 8080
	if p := os.Getenv("HTTP_PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			httpPort = v
		}
	}
	grpcPort := 7002
	if p := os.Getenv("GRPC_PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			grpcPort = v
		}
	}
	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" { // TODO
		dsn = "postgres://postgres:postgres@db:5432/seller_promotions?sslmode=disable"
	}
	return &Config{
		HTTPPort: httpPort,
		GRPCPort: grpcPort,
		DSN:      dsn,
	}
}
