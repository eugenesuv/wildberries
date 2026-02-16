import { AdminAction, Statistics } from "../types";

export const calculateStatistics = (actions: AdminAction[]): Statistics => {
    return {
        activeActions: actions.filter((a) => a.status === "active").length,
        totalActions: actions.length,
        totalParticipants: actions.reduce((sum, action) => sum + action.participants, 0),
        totalRevenue: actions.reduce((sum, action) => sum + action.revenue, 0),
        totalViews: actions.reduce((sum, action) => sum + action.views, 0),
    };
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("ru-RU");
};

export const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString("ru-RU")} ₽`;
};

export const formatCompactNumber = (num: number): string => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
};
