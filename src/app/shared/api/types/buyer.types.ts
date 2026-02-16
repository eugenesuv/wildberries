// ==================== Common Models ====================
export interface CommonSegment {
    id: string; // int64
    name: string;
    categoryName: string;
    orderIndex: number; // int32
    text?: string; // optional, для AI-текста
}

export interface CommonProductItem {
    id: string; // int64
    name: string;
    image: string;
    price: string; // int64
    oldPrice: string; // int64
    discount: number; // int32
    badge: string;
}

// ==================== Promotions ====================
export interface BuyerGetCurrentPromotionResponse {
    id: string; // int64
    name: string;
    description: string;
    theme: string;
    status: "RUNNING";
    dateFrom: string; // RFC3339
    dateTo: string;
    segments: CommonSegment[];
}

// ==================== Identification ====================
export interface BuyerPollOption {
    id: string; // int64
    text: string;
    value: string;
}

export interface BuyerPollQuestion {
    id: string; // int64
    text: string;
    options: BuyerPollOption[];
}

export interface BuyerPoll {
    questions: BuyerPollQuestion[];
}

export interface BuyerStartIdentificationRequest {
    promotionId: string; // int64
}

export interface BuyerStartIdentificationResponse {
    method: "questions" | "user_profile";
    poll?: BuyerPoll; // для method=questions
    resultSegmentId?: string; // int64, для method=user_profile (заглушка — случайный)
}

export interface BuyerAnswerRequest {
    promotionId: string; // int64
    questionId: string; // int64
    optionId: string; // int64
}

export interface BuyerAnswerResponse {
    nextQuestionId: string; // int64 (0 если нет следующего)
    resultSegmentId: string; // int64 (0 если ещё не финал)
}

// ==================== Products ====================
export interface BuyerGetSegmentProductsParams {
    promotionId: string; // int64
    segmentId: string; // int64
    category?: string; // filter
    onlyDiscounts?: boolean; // filter
    sort?: string; // e.g. price_asc, discount_desc
    page?: number; // int32
    perPage?: number; // int32
}

export interface BuyerGetSegmentProductsResponse {
    items: CommonProductItem[];
    total: number; // int32
    page: number; // int32
    perPage: number; // int32
    completed: boolean; // акция завершена
}
