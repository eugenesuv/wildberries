export type ActionStatus = "active" | "upcoming" | "completed";

export interface SellerAction {
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: ActionStatus;
    category: string;
    participants: number;
    views: number;
}

export type CategoryFilter = string;

export interface CategoryOption {
    value: string;
    label: string;
}
