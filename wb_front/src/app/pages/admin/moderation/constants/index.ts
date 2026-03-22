import { Application, ApplicationStatus, ModerationTab } from "../types";

export const STOP_FACTORS = [
    "Табачная продукция",
    "Алкоголь",
    "Оружие",
    "Лекарства без рецепта",
    "Контрафакт",
] as const;

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    pending: "На модерации",
    approved: "Одобрено",
    rejected: "Отклонено",
};

export const MODERATION_TABS: { value: ModerationTab; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "pending", label: "На модерации" },
    { value: "approved", label: "Одобренные" },
    { value: "rejected", label: "Отклонённые" },
];
