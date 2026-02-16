import { ApiClient } from "../base.client";
import type {
    SellerGetSellerActionsResponse,
    SellerListProductsByResponse,
    SellerMakeBetRequest,
    SellerMakeBetResponse,
    SellerRemoveBetRequest,
    SellerRemoveBetResponse,
    SellerGetSellerBetsListResponse,
} from "../types/seller.types";

class SellerClient extends ApiClient {
    constructor() {
        super("http://localhost:7004", "Seller");
    }

    async getSellerActions(sellerId?: number): Promise<SellerGetSellerActionsResponse> {
        return this.get("/seller/actions", { params: { sellerId } });
    }

    async listProductsBy(params?: {
        categoryId?: string;
        sellerId?: number;
        page?: number;
        perPage?: number;
    }): Promise<SellerListProductsByResponse> {
        return this.get("/products/list-by", { params });
    }

    async makeBet(data: SellerMakeBetRequest): Promise<SellerMakeBetResponse> {
        return this.post("/seller/bets/make", data);
    }

    async removeBet(data: SellerRemoveBetRequest): Promise<SellerRemoveBetResponse> {
        return this.post("/seller/bets/remove", data);
    }

    async getBetsList(params?: {
        promotionId?: number;
        status?: string;
        sellerId?: number;
    }): Promise<SellerGetSellerBetsListResponse> {
        return this.get("/seller/bets/list", { params });
    }
}

export const sellerClient = new SellerClient();
