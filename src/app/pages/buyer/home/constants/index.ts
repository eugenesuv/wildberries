import { Promotion, TestQuestion } from "../types";

export const PROMOTIONS: Promotion[] = [
    {
        id: 1,
        segment: "leo",
        title: "Лев сияет на этой неделе!",
        subtitleVariants: ["Звёзды на твоей стороне", "Неделя силы и удачи", "Ярко прояви себя сегодня"],
        gradient: "from-yellow-500 via-orange-500 to-red-500",
    },
    {
        id: 2,
        segment: "virgo",
        title: "Дева обретает гармонию",
        subtitleVariants: ["Успех в мелочах", "Порядок приносит удачу", "Собери пазл идеального дня"],
        gradient: "from-green-500 via-emerald-500 to-teal-500",
    },
    {
        id: 3,
        segment: "libra",
        title: "Весы находят баланс",
        subtitleVariants: ["Удача в партнёрстве", "Слушай сердце и разум", "Красота в равновесии"],
        gradient: "from-pink-500 via-purple-500 to-indigo-500",
    },
];

export const TEST_QUESTIONS: TestQuestion[] = [
    {
        id: 1,
        question: "Какой цвет вам ближе всего?",
        options: [
            { value: "red", label: "Красный - страсть и энергия" },
            { value: "blue", label: "Синий - спокойствие и мудрость" },
            { value: "green", label: "Зелёный - гармония и рост" },
        ],
    },
    {
        id: 2,
        question: "Что для вас важнее?",
        options: [
            { value: "career", label: "Карьера и достижения" },
            { value: "family", label: "Семья и отношения" },
            { value: "freedom", label: "Свобода и путешествия" },
        ],
    },
    {
        id: 3,
        question: "Ваш идеальный выходной?",
        options: [
            { value: "active", label: "Активный отдых на природе" },
            { value: "cultural", label: "Музеи и культурные мероприятия" },
            { value: "home", label: "Дом, книги и уют" },
        ],
    },
];

export const STORAGE_KEYS = {
    USER_SEGMENT: "userSegment",
} as const;
