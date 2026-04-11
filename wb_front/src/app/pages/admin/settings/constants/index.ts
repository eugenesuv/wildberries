import { AuctionSettings, FixedPriceSettings, TestQuestion, Theme } from "../types";

export const THEMES: Theme[] = [
    { value: "zodiac", label: "Знаки Зодиака" },
    { value: "buyer-archetype", label: "Какой ты архетип покупателя?" },
    { value: "startup-role", label: "Кто ты в мире стартапов?" },
    { value: "digital-universe", label: "Твоя цифровая вселенная" },
    { value: "city-of-the-world", label: "Какой ты город мира?" },
    { value: "energy-of-the-week", label: "Твоя энергия недели" },
    { value: "myth-hero", label: "Какой ты герой мифа?" },
    { value: "perfect-day", label: "Твой идеальный день" },
    { value: "travel-style", label: "Какой ты тип отдыха?" },
    { value: "hidden-superpower", label: "Твоя скрытая суперсила" },
    { value: "future-style", label: "Какой ты стиль будущего?" },
    { value: "shopping-zodiac", label: "Какой ты знак зодиака в шопинге?" },
];

export const ZODIAC_SIGNS = [
    "Овен",
    "Телец",
    "Близнецы",
    "Рак",
    "Лев",
    "Дева",
    "Весы",
    "Скорпион",
    "Стрелец",
    "Козерог",
    "Водолей",
    "Рыбы",
];

export const CATEGORIES = [
    "Женщинам",
    "Обувь",
    "Детям",
    "Мужчинам",
    "Дом",
    "Красота",
    "Аксессуары",
    "Электроника",
    "Игрушки",
    "Мебель",
    "Продукты",
    "Цветы",
    "Бытовая техника",
    "Зоотовары",
    "Спорт",
    "Автотовары",
    "Транспортные средства",
    "Книги",
    "Ювелирные изделия",
    "Для ремонта",
    "Сад и дача",
    "Здоровье",
    "Адаптивные товары",
    "Лекарственные препараты",
    "Канцтовары",
];

export const STOP_FACTORS = [
    "Табачная продукция",
    "Алкоголь",
    "Оружие",
    "Лекарства без рецепта",
    "Контрафакт",
] as const;

export const DEFAULT_AUCTION_SETTINGS: AuctionSettings = {
    minPrice: 1000,
    bidStep: 500,
    durationHours: 24,
    durationMinutes: 0,
};

export const DEFAULT_FIXED_PRICE_SETTINGS: FixedPriceSettings = {
    priceByPosition: {},
};

export const DEFAULT_TEST_QUESTION: TestQuestion = {
    question: "",
    options: ["", "", ""],
};
