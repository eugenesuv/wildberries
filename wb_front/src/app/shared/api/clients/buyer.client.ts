import { ApiClient } from "../base.client";
import { API_BASE_URL } from "../config";
import type {
    BuyerGetCurrentPromotionResponse,
    BuyerStartIdentificationRequest,
    BuyerStartIdentificationResponse,
    BuyerAnswerRequest,
    BuyerAnswerResponse,
    BuyerGetSegmentProductsResponse,
} from "../types/buyer.types";

class BuyerClient extends ApiClient {
    constructor() {
        super(API_BASE_URL, "Buyer");
    }

    async getCurrentPromotion(): Promise<BuyerGetCurrentPromotionResponse> {
        return this.get("/promotions/current");
    }

    async startIdentification(data: BuyerStartIdentificationRequest): Promise<BuyerStartIdentificationResponse> {
        return this.post("/identification/start", data);
    }

    async answer(data: BuyerAnswerRequest): Promise<BuyerAnswerResponse> {
        return this.post("/identification/answer", data);
    }

    async getSegmentProducts(
        promotionId: number,
        segmentId: number,
        params?: {
            category?: string;
            onlyDiscounts?: boolean;
            sort?: string;
            page?: number;
            perPage?: number;
        },
    ): Promise<BuyerGetSegmentProductsResponse> {
        const query = params
            ? {
                  category: params.category,
                  only_discounts: params.onlyDiscounts,
                  sort: params.sort,
                  page: params.page,
                  per_page: params.perPage,
              }
            : undefined;
        return this.get(`/promotions/${promotionId}/segments/${segmentId}/products`, { params: query });
    }
}

export const buyerClient = new BuyerClient();
