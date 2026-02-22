# wildberries

## gRPC Gateway and Swagger Support

This project now includes support for gRPC Gateway and Swagger/OpenAPI documentation for all protobuf services.

### Changes Made:

1. **Added gRPC Gateway and Swagger imports** to all proto files:
   - Added `import "google/api/annotations.proto";`
   - Added `import "grpc/gateway/runtime/metadata.proto";`

2. **Added HTTP annotations** to all service methods to enable REST endpoints:
   - All services now have proper HTTP mapping annotations
   - Methods mapped to appropriate REST endpoints

3. **Updated dependencies** in go.mod:
   - Added `google.golang.org/genproto/googleapis/api` 
   - Added `google.golang.org/grpc`
   - Added `github.com/grpc-ecosystem/grpc-gateway/v2`

4. **Generated files**:
   - Protocol buffer Go files (`*.pb.go`)
   - gRPC service files (`*_grpc.pb.go`)
   - gRPC Gateway files (`*_gateway.pb.go`)
   - Swagger/OpenAPI specification files (`*.swagger.json`)

### How to Generate Protobuf Files:

To generate the protobuf files, run:

```bash
# Install required protoc plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@v2.19.0

# The Makefile shows the commands that would be executed:
# make proto-gen
# make proto-gen-admin
# make proto-gen-ai
# make proto-gen-buyer
# make proto-gen-seller

# For manual execution, use the protoc command directly with proper include paths:
# protoc -I. -I/opt/homebrew/Cellar/protobuf/32.0_1/include --go_out=. --go-grpc_out=. --grpc-gateway_out=. --swagger_out=. api/proto/*.proto
```

**Note**: The Makefile is designed to show the commands needed for protobuf generation. Due to system-specific include paths, you may need to adjust the include paths based on your installation. Common paths to check:
1. `/opt/homebrew/Cellar/protobuf/32.0_1/include` (macOS Homebrew)
2. `/usr/local/include` (macOS default)
3. `/usr/include` (Linux systems)

If you encounter issues with the Makefile commands, please run the protoc commands directly with the appropriate include paths for your system.

The generated files will be placed in the respective proto directories under `api/proto/`.

### Available Endpoints:

All gRPC services are now accessible via REST endpoints:
- Admin services: `/admin/...`
- AI services: `/ai/...`
- Buyer services: `/promotions/...`, `/identification/...`
- Seller services: `/products/...`, `/seller/...`, `/seller/bets/...`

Swagger UI will be available at `/swagger/` endpoint when the server is running.
