// ==================== Products ====================
export interface SellerProductListItem {
    id: string; // int64
    nmId: string; // int64
    categoryName: string;
    name: string;
    image: string;
    price: string; // int64
    discount: number; // int32
}

export interface SellerListProductsByParams {
    categoryId?: string;
    sellerId?: number; // int64
    page?: number; // int32
    perPage?: number; // int32
}

export interface SellerListProductsByResponse {
    items: SellerProductListItem[];
    total: number; // int32
    page: number; // int32
    perPage: number; // int32
}

// ==================== Actions ====================
export interface SellerSellerActionSummary {
    id: string; // int64
    name: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    categoryHint: string;
    theme: string;
}

export interface SellerGetSellerActionsParams {
    sellerId?: number; // int64
}

export interface SellerGetSellerActionsResponse {
    actions: SellerSellerActionSummary[];
}

// ==================== Bets ====================
export interface SellerProductForSlot {
    name: string;
    price: string; // int64
    discount: number; // int32
    image: string;
}

export interface SellerMakeBetRequest {
    sellerId: string; // int64
    slotId: string; // int64
    amount?: string; // int64, для аукциона — сумма ставки
    product?: SellerProductForSlot; // для фиксированной цены
}

export interface SellerMakeBetResponse {
    success: boolean;
    message: string;
}

export interface SellerRemoveBetRequest {
    slotId: string; // int64
    sellerId: string; // int64
}

export interface SellerRemoveBetResponse {
    success: boolean;
}

export interface SellerSellerBetItem {
    id: string; // int64 (slot/bet/application id)
    promotionId: string; // int64
    segmentId: string; // int64
    slotId: string; // int64
    bet?: string; // int64, для аукциона
    price?: string; // int64, для фиксированного
    status: "available" | "pending" | "moderation" | "occupied" | "rejected";
    productName: string;
}

export interface SellerGetSellerBetsListParams {
    promotionId?: number; // int64, optional filter
    status?: string; // optional
    sellerId?: number; // int64
}

export interface SellerGetSellerBetsListResponse {
    items: SellerSellerBetItem[];
}
