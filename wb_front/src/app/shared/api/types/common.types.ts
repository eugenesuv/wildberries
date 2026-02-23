// ==================== Общие типы для всех сервисов ====================

export interface ProtobufAny {
    "@type"?: string;
    [key: string]: any;
}

export interface RpcStatus {
    code?: number; // int32
    message?: string;
    details?: ProtobufAny[];
}

// Общие модели, которые используются в нескольких сервисах
export interface CommonSegment {
    id: string; // int64
    name: string;
    categoryName: string;
    orderIndex: number; // int32
    text?: string; // опционально, для AI-текста
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

// Enums для статусов
export enum PromotionStatus {
    NOT_READY = "NOT_READY",
    READY_TO_START = "READY_TO_START",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
}

export enum IdentificationMode {
    QUESTIONS = "questions",
    USER_PROFILE = "user_profile",
}

export enum PricingModel {
    AUCTION = "auction",
    FIXED = "fixed",
}

export enum ModerationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export enum BetStatus {
    AVAILABLE = "available",
    PENDING = "pending",
    MODERATION = "moderation",
    OCCUPIED = "occupied",
    REJECTED = "rejected",
}
