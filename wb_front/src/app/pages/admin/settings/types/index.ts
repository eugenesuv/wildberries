export type PricingModel = "auction" | "fixed";
export type IdentificationMode = "questions" | "user_profile";
export type PromotionStatus = "NOT_READY" | "READY_TO_START" | "RUNNING" | "PAUSED" | "COMPLETED";

export type TestAnswerTargetType = "question" | "segment";

export interface TestAnswerNode {
    id: string;
    questionIndex: number;
    optionIndex: number;
    targetType: TestAnswerTargetType;
    targetValue: string;
}

export interface TestQuestion {
    question: string;
    options: string[];
}

export interface AuctionSettings {
    minPrice: number;
    bidStep: number;
}

export interface FixedPriceSettings {
    priceByPosition: Record<number, number>;
}

export interface ActionSettings {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    theme: string;
    categories: Record<string, string>; // сегмент -> категория
    segments: string[];
    pricingModel: PricingModel;
    auctionSettings?: AuctionSettings;
    fixedPriceSettings?: FixedPriceSettings;
    slotCount: number;
    minDiscount: number;
    maxDiscount: number;
    stopFactors: string[];
    testQuestions: TestQuestion[];
    testAnswerTree: TestAnswerNode[];
    testStartQuestionIndex: number;
    identificationMode: IdentificationMode;
}

export interface Theme {
    value: string;
    label: string;
}
