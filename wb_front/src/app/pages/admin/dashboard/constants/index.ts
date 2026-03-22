import { ActionStatus } from "../types";

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
