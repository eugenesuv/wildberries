import { TestAnswerNode, TestQuestion, Theme } from "../types";

export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i -= 1) {
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

export const generateQuestions = (_theme: string): TestQuestion[] => {
    return [
        { question: "Что вам ближе по духу?", options: ["Смелость", "Мудрость", "Трудолюбие"] },
        { question: "Выберите цвет", options: ["Красный", "Синий", "Зеленый"] },
    ];
};

export const generateAnswerTree = (): TestAnswerNode[] => {
    return [
        {
            id: "seed-q0-o0",
            questionIndex: 0,
            optionIndex: 0,
            targetType: "question",
            targetValue: "1",
        },
        {
            id: "seed-q0-o1",
            questionIndex: 0,
            optionIndex: 1,
            targetType: "question",
            targetValue: "1",
        },
        {
            id: "seed-q0-o2",
            questionIndex: 0,
            optionIndex: 2,
            targetType: "question",
            targetValue: "1",
        },
        {
            id: "seed-q1-o0",
            questionIndex: 1,
            optionIndex: 0,
            targetType: "segment",
            targetValue: "segment-1",
        },
        {
            id: "seed-q1-o1",
            questionIndex: 1,
            optionIndex: 1,
            targetType: "segment",
            targetValue: "segment-2",
        },
        {
            id: "seed-q1-o2",
            questionIndex: 1,
            optionIndex: 2,
            targetType: "segment",
            targetValue: "segment-3",
        },
    ];
};

