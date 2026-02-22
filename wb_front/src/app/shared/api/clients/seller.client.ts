import { ApiClient } from "../base.client";
import { API_BASE_URL } from "../config";
import type {
    SellerGetActionSegmentsResponse,
    SellerGetSellerActionsResponse,
    SellerGetSegmentSlotsResponse,
    SellerListProductsByResponse,
    SellerMakeBetRequest,
    SellerMakeBetResponse,
    SellerRemoveBetRequest,
    SellerRemoveBetResponse,
    SellerGetSellerBetsListResponse,
} from "../types/seller.types";

class SellerClient extends ApiClient {
    constructor() {
        super(API_BASE_URL, "Seller");
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
        return this.get("/products/list-by", {
            params: params
                ? {
                      category_id: params.categoryId,
                      seller_id: params.sellerId,
                      page: params.page,
                      per_page: params.perPage,
                  }
                : undefined,
        });
    }

    async getActionSegments(actionId: number): Promise<SellerGetActionSegmentsResponse> {
        return this.get(`/seller/actions/${actionId}/segments`);
    }

    async getSegmentSlots(actionId: number, segmentId: number): Promise<SellerGetSegmentSlotsResponse> {
        return this.get(`/seller/actions/${actionId}/segments/${segmentId}/slots`);
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
