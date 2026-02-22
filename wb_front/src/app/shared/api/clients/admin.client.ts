import { ApiClient } from "../base.client";
import { API_BASE_URL } from "../config";
import type {
    AdminCreatePromotionRequest,
    AdminCreatePromotionResponse,
    AdminGetPromotionResponse,
    AdminUpdatePromotionResponse,
    AdminDeletePromotionResponse,
    AdminChangeStatusResponse,
    AdminSetFixedPricesResponse,
    AdminFixedPriceEntry,
    AdminGetModerationApplicationsResponse,
    AdminApproveModerationResponse,
    AdminRejectModerationResponse,
    AdminCreateSegmentResponse,
    AdminUpdateSegmentResponse,
    AdminDeleteSegmentResponse,
    AdminGenerateSegmentsResponse,
    AdminShuffleSegmentCategoriesResponse,
    AdminSetPollQuestionsResponse,
    AdminSetAnswerTreeResponse,
    AdminGeneratePollResponse,
    AdminSetSlotProductRequest,
    AdminSetSlotProductResponse,
} from "../types/admin.types";

class AdminClient extends ApiClient {
    constructor() {
        super(API_BASE_URL, "Admin");
    }

    // Promotions
    async createPromotion(data: AdminCreatePromotionRequest): Promise<AdminCreatePromotionResponse> {
        return this.post("/admin/promotions", data);
    }

    async listPromotions(): Promise<{ promotions: Array<{ id: number; name: string; theme: string; status: string; dateFrom: string; dateTo: string }> }> {
        return this.get("/admin/promotions");
    }

    async getPromotion(id: number): Promise<AdminGetPromotionResponse> {
        return this.get(`/admin/promotions/${id}`);
    }

    async getAuctionParams(promotionId: number): Promise<{ minPrice?: number; bidStep?: number }> {
        return this.get(`/admin/promotions/${promotionId}/auction-params`);
    }

    async setAuctionParams(
        promotionId: number,
        data: { minPrice?: number; bidStep?: number },
    ): Promise<Record<string, never>> {
        return this.put(`/admin/promotions/${promotionId}/auction-params`, data);
    }

    async updatePromotion(
        id: number,
        data: Partial<AdminCreatePromotionRequest>,
    ): Promise<AdminUpdatePromotionResponse> {
        return this.patch(`/admin/promotions/${id}`, data);
    }

    async deletePromotion(id: number): Promise<AdminDeletePromotionResponse> {
        return this.delete(`/admin/promotions/${id}`);
    }

    async changeStatus(promotionId: number, status: string): Promise<AdminChangeStatusResponse> {
        return this.put(`/admin/promotions/${promotionId}/status`, { status });
    }

    async setFixedPrices(promotionId: number, prices: AdminFixedPriceEntry[]): Promise<AdminSetFixedPricesResponse> {
        return this.put(`/admin/promotions/${promotionId}/fixed-prices`, { prices });
    }

    // Segments
    async createSegment(
        promotionId: number,
        data: { name: string; categoryName: string; orderIndex: number },
    ): Promise<AdminCreateSegmentResponse> {
        return this.post(`/admin/promotions/${promotionId}/segments`, data);
    }

    async updateSegment(
        promotionId: number,
        segmentId: number,
        data: Partial<{ name: string; categoryName: string; orderIndex: number }>,
    ): Promise<AdminUpdateSegmentResponse> {
        return this.patch(`/admin/promotions/${promotionId}/segments/${segmentId}`, data);
    }

    async deleteSegment(promotionId: number, segmentId: number): Promise<AdminDeleteSegmentResponse> {
        return this.delete(`/admin/promotions/${promotionId}/segments/${segmentId}`);
    }

    async generateSegments(
        promotionId: number,
        useTheme?: boolean,
        limit?: number,
    ): Promise<AdminGenerateSegmentsResponse> {
        return this.post(`/admin/promotions/${promotionId}/segments/generate`, { useTheme, limit });
    }

    async shuffleCategories(promotionId: number): Promise<AdminShuffleSegmentCategoriesResponse> {
        return this.post(`/admin/promotions/${promotionId}/segments/shuffle-categories`, {});
    }

    // Poll
    async setPollQuestions(promotionId: number, questions: any[]): Promise<AdminSetPollQuestionsResponse> {
        return this.post(`/admin/promotions/${promotionId}/poll/questions`, { questions });
    }

    async setAnswerTree(promotionId: number, nodes: any[]): Promise<AdminSetAnswerTreeResponse> {
        return this.post(`/admin/promotions/${promotionId}/poll/answer-tree`, { nodes });
    }

    async generatePoll(promotionId: number, type: "questions" | "answer_tree"): Promise<AdminGeneratePollResponse> {
        return this.post(`/admin/promotions/${promotionId}/poll/generate`, { type });
    }

    // Moderation
    async getModerationApplications(
        promotionId: number,
        status?: string,
    ): Promise<AdminGetModerationApplicationsResponse> {
        return this.get(`/admin/promotions/${promotionId}/moderation/applications`, {
            params: { status },
        });
    }

    async approveApplication(applicationId: number): Promise<AdminApproveModerationResponse> {
        return this.post(`/admin/moderation/${applicationId}/approve`, {});
    }

    async rejectApplication(applicationId: number, reason: string): Promise<AdminRejectModerationResponse> {
        return this.post(`/admin/moderation/${applicationId}/reject`, { reason });
    }

    // Products
    async setSlotProduct(data: AdminSetSlotProductRequest): Promise<AdminSetSlotProductResponse> {
        return this.post("/horoscope/products", data);
    }
}

export const adminClient = new AdminClient();
