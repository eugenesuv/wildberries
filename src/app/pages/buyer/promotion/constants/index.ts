import { HoroscopeData, Product } from "../types";

export const HOROSCOPE_DATA: Record<string, HoroscopeData> = {
    leo: {
        title: "Лев сияет на этой неделе",
        prediction:
            "Удача в спорте и активных занятиях! Звёзды советуют инвестировать в спортивные товары и аксессуары для здоровья.",
        recommendedCategory: "Спорт и отдых",
        luckyColor: "Золотой",
        gradient: "from-yellow-500 via-orange-500 to-red-500",
    },
    virgo: {
        title: "Дева обретает гармонию",
        prediction:
            "Время для организации пространства. Товары для дома и организации помогут достичь внутреннего баланса.",
        recommendedCategory: "Дом и интерьер",
        luckyColor: "Зелёный",
        gradient: "from-green-500 via-emerald-500 to-teal-500",
    },
    libra: {
        title: "Весы находят баланс",
        prediction: "Гармония в отношениях. Украшения и аксессуары помогут подчеркнуть вашу уникальность.",
        recommendedCategory: "Мода и стиль",
        luckyColor: "Розовый",
        gradient: "from-pink-500 via-purple-500 to-indigo-500",
    },
};

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 1,
        name: "Фитнес-браслет SmartFit Pro",
        price: 3990,
        oldPrice: 5990,
        discount: 33,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400",
        badge: "Гороскоп советует",
        category: "Спорт и отдых",
    },
    {
        id: 2,
        name: "Йога-мат премиум класса",
        price: 2490,
        oldPrice: 3490,
        discount: 29,
        image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
        badge: "Гороскоп советует",
        category: "Спорт и отдых",
    },
    {
        id: 3,
        name: "Спортивная бутылка с умным чипом",
        price: 1290,
        oldPrice: 1990,
        discount: 35,
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400",
        badge: "Гороскоп советует",
        category: "Спорт и отдых",
    },
    {
        id: 4,
        name: "Беспроводные наушники AirPods",
        price: 8990,
        oldPrice: 12990,
        discount: 31,
        image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400",
        category: "Электроника",
    },
    {
        id: 5,
        name: "Умные часы Galaxy Watch",
        price: 15990,
        oldPrice: 21990,
        discount: 27,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        category: "Электроника",
    },
    {
        id: 6,
        name: "Набор гантелей разборных",
        price: 4990,
        oldPrice: 6990,
        discount: 29,
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
        badge: "Гороскоп советует",
        category: "Спорт и отдых",
    },
];

export const CATEGORIES = ["Все категории", "Спорт и отдых", "Электроника", "Дом и интерьер", "Мода и стиль"] as const;

export const CATEGORY_FILTERS = [
    { value: "all", label: "Все категории" },
    { value: "Спорт и отдых", label: "Спорт и отдых" },
    { value: "Электроника", label: "Электроника" },
    { value: "Дом и интерьер", label: "Дом и интерьер" },
    { value: "Мода и стиль", label: "Мода и стиль" },
];
