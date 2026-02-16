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

// Mock данные акций
export const MOCK_ACTIONS: SellerAction[] = [
    {
        id: 1,
        name: "Гороскопные Скидки - Январь 2026",
        description: "Акция с персонализацией по знакам зодиака",
        startDate: "2026-01-20",
        endDate: "2026-01-27",
        status: "active",
        category: "Спорт и отдых",
        participants: 48,
        views: 12500,
    },
    {
        id: 2,
        name: "Волшебство Гарри Поттера",
        description: "Тематическая акция по факультетам Хогвартса",
        startDate: "2026-02-01",
        endDate: "2026-02-14",
        status: "upcoming",
        category: "Книги и развлечения",
        participants: 0,
        views: 0,
    },
    {
        id: 3,
        name: "Технологии Будущего",
        description: "Акция для любителей инноваций",
        startDate: "2026-01-15",
        endDate: "2026-01-22",
        status: "completed",
        category: "Электроника",
        participants: 67,
        views: 18900,
    },
];
