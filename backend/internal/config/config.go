package config

import (
	"os"
	"strconv"
)

type Config struct {
	HTTPPort         int
	GRPCPort         int
	DSN              string
	AIProvider       string
	GeminiAPIKey     string
	GeminiModel      string
	GeminiAPIBaseURL string
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
	aiProvider := os.Getenv("AI_PROVIDER")
	if aiProvider == "" {
		aiProvider = "stub"
	}
	geminiModel := os.Getenv("GEMINI_MODEL")
	if geminiModel == "" {
		geminiModel = "gemini-2.5-flash"
	}
	geminiAPIBaseURL := os.Getenv("GEMINI_API_BASE_URL")
	if geminiAPIBaseURL == "" {
		geminiAPIBaseURL = "https://generativelanguage.googleapis.com"
	}
	return &Config{
		HTTPPort:         httpPort,
		GRPCPort:         grpcPort,
		DSN:              dsn,
		AIProvider:       aiProvider,
		GeminiAPIKey:     os.Getenv("GEMINI_API_KEY"),
		GeminiModel:      geminiModel,
		GeminiAPIBaseURL: geminiAPIBaseURL,
	}
}
