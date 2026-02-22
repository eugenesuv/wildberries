import { ApiClient } from "../base.client";
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
        super("http://localhost:7001", "Buyer");
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
        return this.get(`/promotions/${promotionId}/segments/${segmentId}/products`, { params });
    }
}

export const buyerClient = new BuyerClient();
