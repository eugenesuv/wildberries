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

// Mock данные заявок
export const MOCK_APPLICATIONS: Application[] = [
    {
        id: 1,
        sellerId: "S-123",
        sellerName: "Продавец #123",
        segment: "Лев",
        position: 1,
        productName: "Фитнес-браслет SmartFit Pro",
        price: 3990,
        discount: 33,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400",
        status: "pending",
        stopFactors: [],
        submittedAt: "2026-01-20T10:30:00",
    },
    {
        id: 2,
        sellerId: "S-456",
        sellerName: "Продавец #456",
        segment: "Лев",
        position: 2,
        productName: "Йога-мат премиум класса",
        price: 2490,
        discount: 29,
        image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
        status: "pending",
        stopFactors: [],
        submittedAt: "2026-01-20T11:15:00",
    },
    {
        id: 3,
        sellerId: "S-789",
        sellerName: "Продавец #789",
        segment: "Лев",
        position: 3,
        productName: "Сигареты Lucky Strike",
        price: 150,
        discount: 0,
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400",
        status: "pending",
        stopFactors: ["Табачная продукция"],
        submittedAt: "2026-01-20T12:00:00",
    },
    {
        id: 4,
        sellerId: "S-321",
        sellerName: "Продавец #321",
        segment: "Дева",
        position: 1,
        productName: "Органайзер для дома",
        price: 1890,
        discount: 25,
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400",
        status: "approved",
        stopFactors: [],
        submittedAt: "2026-01-20T09:00:00",
    },
];
