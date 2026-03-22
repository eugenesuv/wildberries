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



export const CATEGORIES = ["Все категории", "Спорт и отдых", "Электроника", "Дом и интерьер", "Мода и стиль"] as const;

export const CATEGORY_FILTERS = [
    { value: "all", label: "Все категории" },
    { value: "Спорт и отдых", label: "Спорт и отдых" },
    { value: "Электроника", label: "Электроника" },
    { value: "Дом и интерьер", label: "Дом и интерьер" },
    { value: "Мода и стиль", label: "Мода и стиль" },
];
