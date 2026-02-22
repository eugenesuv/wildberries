import { AuctionSettings, FixedPriceSettings, TestQuestion, Theme } from "../types";

export const THEMES: Theme[] = [
    { value: "zodiac", label: "Знаки Зодиака" },
    { value: "harry-potter", label: "Гарри Поттер" },
    { value: "seasons", label: "Времена года" },
    { value: "colors", label: "Цветовая палитра" },
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
    "Спорт и отдых",
    "Электроника",
    "Дом и интерьер",
    "Мода и стиль",
    "Красота и здоровье",
    "Детские товары",
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
};

export const DEFAULT_FIXED_PRICE_SETTINGS: FixedPriceSettings = {
    priceByPosition: {},
};

export const DEFAULT_TEST_QUESTION: TestQuestion = {
    question: "",
    options: ["", "", ""],
};
