export type PricingModel = "auction" | "fixed";
export type IdentificationMode = "questions" | "user_profile";
export type PromotionStatus = "NOT_READY" | "READY_TO_START" | "RUNNING" | "PAUSED" | "COMPLETED";

export interface TestAnswerNode {
    label: string;
    value: string;
    next?: TestAnswerNode[];
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
    identificationMode: IdentificationMode;
}

export interface Theme {
    value: string;
    label: string;
}
