import { CommonSegment } from "./common.types";

// ==================== Promotion Admin ====================
export interface AdminCreatePromotionRequest {
    name: string;
    description: string;
    theme: string;
    dateFrom: string; // RFC3339
    dateTo: string;
    identificationMode: "questions" | "user_profile";
    pricingModel: "auction" | "fixed";
    slotCount: number; // int32
    minDiscount: number; // int32
    maxDiscount: number; // int32
    stopFactors: string[];
}

export interface AdminCreatePromotionResponse {
    id: string; // int64
    status: "NOT_READY";
}

export interface AdminGetPromotionResponse {
    id: string; // int64
    name: string;
    description: string;
    theme: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    identificationMode: string;
    pricingModel: string;
    slotCount: number; // int32
    minDiscount: number; // int32
    maxDiscount: number; // int32
    stopFactors: string[];
    segments: AdminSegmentWithOrder[];
    fixedPrices: Record<string, string>; // position -> price (int64)
    poll: AdminPromotionPoll;
}

export interface AdminUpdatePromotionResponse {
    // empty object
}

export interface AdminDeletePromotionResponse {
    // empty object
}

export interface AdminChangeStatusResponse {
    // empty object
}

export interface AdminChangeStatusRequest {
    status: "NOT_READY" | "READY_TO_START" | "RUNNING" | "PAUSED" | "COMPLETED";
}

// ==================== Fixed Prices ====================
export interface AdminFixedPriceEntry {
    position: number; // int32
    price: string; // int64
}

export interface AdminSetFixedPricesRequest {
    prices: AdminFixedPriceEntry[];
}

export interface AdminSetFixedPricesResponse {
    // empty object
}

// ==================== Segments ====================
export interface AdminSegmentWithOrder {
    id: string; // int64
    name: string;
    categoryName: string;
    orderIndex: number; // int32
}

export interface AdminCreateSegmentRequest {
    name: string;
    categoryName: string;
    orderIndex: number; // int32
}

export interface AdminCreateSegmentResponse {
    id: string; // int64
    name: string;
    categoryName: string;
}

export interface AdminUpdateSegmentRequest {
    name?: string;
    categoryName?: string;
    orderIndex?: number; // int32
}

export interface AdminUpdateSegmentResponse {
    // empty object
}

export interface AdminDeleteSegmentResponse {
    // empty object
}

export interface AdminGenerateSegmentsRequest {
    useTheme?: boolean;
    limit?: number; // int32
}

export interface AdminGenerateSegmentsResponse {
    segments: CommonSegment[];
}

export interface AdminShuffleSegmentCategoriesResponse {
    // empty object
}

// ==================== Poll Admin ====================
export interface AdminPollOptionAdmin {
    id: string; // int64
    text: string;
    value: string;
}

export interface AdminPollQuestionAdmin {
    id: string; // int64
    text: string;
    options: AdminPollOptionAdmin[];
}

export interface AdminAnswerTreeNode {
    nodeId: string; // UUID
    parentNodeId: string;
    label: string;
    value: string;
}

export interface AdminPromotionPoll {
    questions: AdminPollQuestionAdmin[];
    answerTree: AdminAnswerTreeNode[];
}

export interface AdminSetOptionInput {
    text: string;
    value: string;
}

export interface AdminSetQuestionInput {
    text: string;
    options: AdminSetOptionInput[];
}

export interface AdminSetPollQuestionsRequest {
    questions: AdminSetQuestionInput[];
}

export interface AdminSetPollQuestionsResponse {
    // empty object
}

export interface AdminSetAnswerTreeRequest {
    nodes: AdminAnswerTreeNode[];
}

export interface AdminSetAnswerTreeResponse {
    // empty object
}

export interface AdminGeneratePollRequest {
    type: "questions" | "answer_tree";
}

export interface AdminGeneratePollResponse {
    questions?: AdminPollQuestionAdmin[];
    answerTree?: AdminAnswerTreeNode[];
}

// ==================== Moderation ====================
export interface AdminModerationApplication {
    id: string; // int64
    sellerId: string; // int64
    segmentId: string; // int64
    slotId: string; // int64
    productName: string;
    price: string; // int64
    discount: number; // int32
    stopFactors: string[];
    status: string;
}

export interface AdminGetModerationApplicationsResponse {
    applications: AdminModerationApplication[];
}

export interface AdminGetModerationApplicationsParams {
    promotionId: string; // int64
    status?: "pending" | "approved" | "rejected";
}

export interface AdminApproveModerationResponse {
    // empty object
}

export interface AdminRejectModerationRequest {
    reason: string;
}

export interface AdminRejectModerationResponse {
    // empty object
}

// ==================== Products ====================
export interface AdminSetSlotProductRequest {
    segmentId: string; // int64
    slotId?: string; // int64 (optional, если не указан — выбрать свободный)
    productId: string; // int64
}

export interface AdminSetSlotProductResponse {
    // empty object
}
