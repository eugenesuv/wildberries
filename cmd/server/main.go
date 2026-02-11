package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/rs/cors"
	"wildberries/internal/app"
	"wildberries/internal/config"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	application, err := app.New(ctx, cfg)
	if err != nil {
		log.Fatalf("app.New: %v", err)
	}
	defer application.Shutdown(context.Background())

	// Setup gRPC gateway handlers
	if err := application.SetupGatewayHandlers(ctx); err != nil {
		log.Fatalf("Failed to setup gateway handlers: %v", err)
	}

	// Start gRPC server
	go func() {
		log.Printf("gRPC server listening on port %d", cfg.GRPCPort)
		if err := application.StartGRPCServer(ctx); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Start HTTP server with gRPC gateway
	go func() {
		corsHandler := cors.AllowAll().Handler(application)
		log.Printf("HTTP server listening on port %d", cfg.HTTPPort)
		server := &http.Server{
			Addr:         ":" + strconv.Itoa(cfg.HTTPPort),
			Handler:      corsHandler,
			ReadTimeout:  5 * time.Second,
			WriteTimeout: 10 * time.Second,
		}
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")
}
