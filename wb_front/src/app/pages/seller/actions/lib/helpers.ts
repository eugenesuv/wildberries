import { SellerAction } from "../types";

export const filterActionsByCategory = (actions: SellerAction[], categoryFilter: string): SellerAction[] => {
    if (categoryFilter === "all") return actions;
    return actions.filter((action) => action.category === categoryFilter);
};

export const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate).toLocaleDateString("ru-RU");
    const end = new Date(endDate).toLocaleDateString("ru-RU");
    return `${start} - ${end}`;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString("ru-RU");
};
