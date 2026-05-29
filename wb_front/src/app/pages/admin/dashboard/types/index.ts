export type ActionStatus = "active" | "upcoming" | "completed" | "draft";

interface Segment {
    id: number;
    name: string;
    categoryName: string;
    orderIndex: number;
}

export interface AdminAction {
    id: number;
    name: string;
    theme: string;
    status: ActionStatus;
    startDate: string;
    endDate: string;
    bookedSlotsPrice: number;
    auctionSlotsPrice: number;
    slotCount: number;
    segments: Segment[];
    minDiscount: number;
    maxDiscount: number;
}

export interface Statistics {
    activeActions: number;
    totalActions: number;
    totalBookedSlotsPrice: number;
    totalAuctionSlotsPrice: number;
    totalSlots: number;
    totalSegments: number;
}

export type AdminStatusFilter = ActionStatus | "all";
