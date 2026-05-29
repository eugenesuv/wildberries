import { AdminAction, Statistics } from "../types";

export const calculateStatistics = (actions: AdminAction[]): Statistics => {
    const activeCount = actions.filter((a) => a.status === "active").length;
    const totalSlots = actions.reduce((sum, a) => sum + (a.slotCount || 0), 0);
    const totalSegments = actions.reduce((sum, a) => sum + (a.segments?.length || 0), 0);
    const totalBooked = actions.reduce((sum, a) => sum + (a.bookedSlotsPrice || 0), 0);
    const totalAuction = actions.reduce((sum, a) => sum + (a.auctionSlotsPrice || 0), 0);

    return {
        activeActions: activeCount,
        totalActions: actions.length,
        totalBookedSlotsPrice: totalBooked,
        totalAuctionSlotsPrice: totalAuction,
        totalSlots,
        totalSegments,
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
