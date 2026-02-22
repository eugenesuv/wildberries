package app

import (
	"context"
	"fmt"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"wildberries/pkg/admin"
	"wildberries/pkg/ai"
	"wildberries/pkg/buyer"
	"wildberries/pkg/seller"
)

// StartGRPCServer starts the gRPC server with all services
func (a *App) StartGRPCServer(ctx context.Context) error {
	// Create gRPC server
	grpcServer := grpc.NewServer()
	
	// Register services
	admin.RegisterPromotionAdminServiceServer(grpcServer, a.adminAPI)
	admin.RegisterSegmentAdminServiceServer(grpcServer, a.adminAPI)
	admin.RegisterPollAdminServiceServer(grpcServer, a.adminAPI)
	admin.RegisterModerationServiceServer(grpcServer, a.adminAPI)
	
	buyer.RegisterBuyerPromotionServiceServer(grpcServer, a.buyerAPI)
	buyer.RegisterIdentificationServiceServer(grpcServer, a.buyerAPI)
	
	seller.RegisterSellerProductServiceServer(grpcServer, a.sellerAPI)
	seller.RegisterSellerActionsServiceServer(grpcServer, a.sellerAPI)
	seller.RegisterSellerBetsServiceServer(grpcServer, a.sellerAPI)
	
	ai.RegisterAIServiceServer(grpcServer, a.aiAPI)
	
	// Enable reflection for debugging
	reflection.Register(grpcServer)
	
	// Listen on port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", a.cfg.GRPCPort))
	if err != nil {
		return fmt.Errorf("failed to listen: %v", err)
	}
	
	// Start serving
	return grpcServer.Serve(lis)
}