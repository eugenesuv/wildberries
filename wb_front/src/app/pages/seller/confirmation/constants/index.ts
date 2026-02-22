import { ApplicationStatus, ConfirmationData } from "../types";

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; className: string }> = {
    pending: {
        label: "На модерации",
        className: "bg-yellow-50 text-yellow-700 border-yellow-300",
    },
    approved: {
        label: "Одобрено",
        className: "bg-green-50 text-green-700 border-green-300",
    },
    rejected: {
        label: "Отклонено",
        className: "bg-red-50 text-red-700 border-red-300",
    },
};

// Mock данные для демонстрации
export const MOCK_CONFIRMATION: ConfirmationData = {
    applicationNumber: "АК-2026-00142",
    status: "pending",
    promotionName: "Гороскопные Скидки",
    segment: "Лев",
    position: 1,
    price: 5500,
};

export const NEXT_STEPS = [
    "Ваша заявка будет рассмотрена модератором в течение 24 часов",
    "При одобрении вы получите уведомление на email",
    "После оплаты ваш товар появится в акции",
    "Вы сможете отслеживать статистику в личном кабинете",
] as const;
