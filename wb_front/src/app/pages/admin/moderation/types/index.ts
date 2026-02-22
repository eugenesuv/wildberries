export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
    id: number;
    sellerId: string;
    sellerName: string;
    segment: string;
    position: number;
    productName: string;
    price: number;
    discount: number;
    image: string;
    status: ApplicationStatus;
    stopFactors: string[];
    submittedAt: string;
}

export interface ModerationStatistics {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
}

export type ModerationTab = "all" | ApplicationStatus;
