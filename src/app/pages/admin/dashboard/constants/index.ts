import { ActionStatus, AdminAction } from "../types";

export const STATUS_COLORS: Record<ActionStatus, string> = {
    active: "bg-green-500",
    upcoming: "bg-blue-500",
    completed: "bg-gray-400",
    draft: "bg-yellow-500",
};

export const STATUS_LABELS: Record<ActionStatus, string> = {
    active: "Активна",
    upcoming: "Скоро",
    completed: "Завершена",
    draft: "Черновик",
};

export const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "Все статусы" },
    { value: "active", label: "Активные" },
    { value: "upcoming", label: "Предстоящие" },
    { value: "completed", label: "Завершённые" },
    { value: "draft", label: "Черновики" },
] as const;

// Mock данные для акций
export const MOCK_ADMIN_ACTIONS: AdminAction[] = [
    {
        id: 1,
        name: "Гороскопные Скидки - Январь 2026",
        theme: "Зодиак",
        status: "active",
        startDate: "2026-01-20",
        endDate: "2026-01-27",
        participants: 48,
        revenue: 245000,
        views: 12500,
    },
    {
        id: 2,
        name: "Волшебство Гарри Поттера",
        theme: "Гарри Поттер",
        status: "upcoming",
        startDate: "2026-02-01",
        endDate: "2026-02-14",
        participants: 0,
        revenue: 0,
        views: 0,
    },
    {
        id: 3,
        name: "Технологии Будущего",
        theme: "Зодиак",
        status: "completed",
        startDate: "2026-01-15",
        endDate: "2026-01-22",
        participants: 67,
        revenue: 412000,
        views: 18900,
    },
];
