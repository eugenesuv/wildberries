package app

import (
	"context"
	"fmt"
	"google.golang.org/grpc/credentials/insecure"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"

	admin_api "wildberries/internal/api/admin"
	ai_api "wildberries/internal/api/ai"
	buyer_api "wildberries/internal/api/buyer"
	seller_api "wildberries/internal/api/seller"
	"wildberries/internal/config"
	"wildberries/internal/repository"
	"wildberries/internal/service/ai"
	"wildberries/internal/service/buyer"
	"wildberries/internal/service/promotion"
	"wildberries/internal/service/seller"
	adminpb "wildberries/pkg/admin"
	aipb "wildberries/pkg/ai"
	buyerpb "wildberries/pkg/buyer"
	sellerpb "wildberries/pkg/seller"
)

type App struct {
	cfg  *config.Config
	pool *pgxpool.Pool

	promotionService *promotion.Service
	sellerService    *seller.Service

	// API services
	adminAPI  *admin_api.Service
	buyerAPI  *buyer_api.Service
	sellerAPI *seller_api.Service
	aiAPI     *ai_api.Service

	// gRPC gateway mux
	gwmux *runtime.ServeMux
}

func New(ctx context.Context, cfg *config.Config) (*App, error) {
	// Create database connection pool
	pool, err := pgxpool.New(ctx, cfg.DSN)
	if err != nil {
		return nil, err
	}

	// Create repositories
	promotionRepo := repository.NewPromotionPostgres(pool)
	segmentRepo := repository.NewSegmentPostgres(pool)
	slotRepo := repository.NewSlotPostgres(pool)
	productRepo := repository.NewProductPostgres(pool)
	moderationRepo := repository.NewModerationPostgres(pool)
	betRepo := repository.NewBetPostgres(pool)
	auctionRepo := repository.NewAuctionPostgres(pool)
	pollRepo := repository.NewPollPostgres(pool)

	// Create services
	promotionService := promotion.New(
		promotionRepo,
		segmentRepo,
		slotRepo,
		productRepo,
		moderationRepo,
		auctionRepo,
		pollRepo,
	)

	buyerService := buyer.New(productRepo, promotionRepo, slotRepo, segmentRepo, pollRepo)
	sellerService := seller.New(productRepo, betRepo, auctionRepo, slotRepo, segmentRepo, promotionRepo, moderationRepo)
	aiService := ai.New()

	// Create API services
	adminAPIService := admin_api.New(promotionService)
	buyerAPIService := buyer_api.New(buyerService)
	sellerAPIService := seller_api.New(sellerService)
	aiAPIService := ai_api.New(aiService)

	// Create gRPC gateway mux
	gwmux := runtime.NewServeMux()

	app := &App{
		cfg:              cfg,
		pool:             pool,
		promotionService: promotionService,
		sellerService:    sellerService,
		adminAPI:         adminAPIService,
		buyerAPI:         buyerAPIService,
		sellerAPI:        sellerAPIService,
		aiAPI:            aiAPIService,
		gwmux:            gwmux,
	}

	return app, nil
}

func (a *App) SetupGatewayHandlers(ctx context.Context) error {
	// Connect to gRPC server
	grpcConn, err := grpc.DialContext(ctx,
		fmt.Sprintf("localhost:%d", a.cfg.GRPCPort),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.FailOnNonTempDialError(true),
	)
	if err != nil {
		return err
	}

	// Register gRPC gateway handlers
	err = adminpb.RegisterPromotionAdminServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = adminpb.RegisterSegmentAdminServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = adminpb.RegisterPollAdminServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = adminpb.RegisterModerationServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}

	err = buyerpb.RegisterBuyerPromotionServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = buyerpb.RegisterIdentificationServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}

	err = sellerpb.RegisterSellerProductServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = sellerpb.RegisterSellerActionsServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}
	err = sellerpb.RegisterSellerBetsServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}

	err = aipb.RegisterAIServiceHandler(ctx, a.gwmux, grpcConn)
	if err != nil {
		return err
	}

	return nil
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	//if a.serveCustomHTTP(w, r) {
	//	return
	//}
	// Delegate to gRPC gateway
	a.gwmux.ServeHTTP(w, r)
}

func (a *App) Shutdown(ctx context.Context) {
	a.pool.Close()
}
