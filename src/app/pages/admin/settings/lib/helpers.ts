import { TestAnswerNode, TestQuestion, Theme } from "../types";

export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const generateThemes = (): Theme[] => {
    const variants: Theme[] = [
        { value: "elements", label: "Стихии" },
        { value: "myth-creatures", label: "Мифические существа" },
        { value: "space", label: "Космос" },
        { value: "norse", label: "Скандинавские боги" },
        { value: "hp-houses", label: "Факультеты Хогвартса" },
    ];
    return shuffleArray(variants).slice(0, 3);
};

export const generateSegments = (theme: string): string[] => {
    const pools: Record<string, string[]> = {
        "harry-potter": ["Гриффиндор", "Слизерин", "Когтевран", "Пуффендуй"],
        seasons: ["Весна", "Лето", "Осень", "Зима"],
        colors: ["Индиго", "Аметист", "Сапфир", "Изумруд"],
        elements: ["Огонь", "Вода", "Земля", "Воздух"],
        zodiac: [],
    };
    return (pools[theme] ?? ["Сегмент A", "Сегмент B"]).slice(0, 4);
};

export const generateQuestions = (theme: string): TestQuestion[] => {
    return [
        { question: "Что вам ближе по духу?", options: ["Смелость", "Мудрость", "Трудолюбие"] },
        { question: "Выберите цвет", options: ["Красный", "Синий", "Зелёный"] },
    ];
};

export const generateAnswerTree = (): TestAnswerNode[] => {
    return [
        {
            label: "Корень",
            value: "root",
            next: [
                {
                    label: "Вариант 1",
                    value: "v1",
                    next: [
                        { label: "A", value: "a" },
                        { label: "B", value: "b" },
                    ],
                },
                {
                    label: "Вариант 2",
                    value: "v2",
                    next: [
                        { label: "C", value: "c" },
                        { label: "D", value: "d" },
                    ],
                },
            ],
        },
    ];
};
