export type ActionStatus = "active" | "upcoming" | "completed" | "draft";

export interface AdminAction {
    id: number;
    name: string;
    theme: string;
    status: ActionStatus;
    startDate: string;
    endDate: string;
    participants: number;
    revenue: number;
    views: number;
}

export interface Statistics {
    activeActions: number;
    totalActions: number;
    totalParticipants: number;
    totalRevenue: number;
    totalViews: number;
}

export type StatusFilter = ActionStatus | "all";
