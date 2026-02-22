import { Application, ModerationStatistics } from "../types";

export const calculateModerationStatistics = (applications: Application[]): ModerationStatistics => {
    return {
        pendingCount: applications.filter((a) => a.status === "pending").length,
        approvedCount: applications.filter((a) => a.status === "approved").length,
        rejectedCount: applications.filter((a) => a.status === "rejected").length,
        totalCount: applications.length,
    };
};

export const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString("ru-RU")} ₽`;
};

export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
