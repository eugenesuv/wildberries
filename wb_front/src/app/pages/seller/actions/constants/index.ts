import { SellerAction, CategoryOption } from "../types";

export const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-500",
    upcoming: "bg-blue-500",
    completed: "bg-gray-400",
};

export const STATUS_LABELS: Record<string, string> = {
    active: "Активна",
    upcoming: "Скоро",
    completed: "Завершена",
};

export const CATEGORY_FILTERS: CategoryOption[] = [
    { value: "all", label: "Все категории" },
    { value: "Спорт и отдых", label: "Спорт и отдых" },
    { value: "Электроника", label: "Электроника" },
    { value: "Книги и развлечения", label: "Книги и развлечения" },
];
