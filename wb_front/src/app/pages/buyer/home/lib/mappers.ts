import type {
    BuyerGetCurrentPromotionResponse,
    BuyerPoll,
    BuyerPollQuestion,
} from "@/app/shared/api/types/buyer.types";
import type { Promotion, TestQuestion } from "../types";

const PROMO_GRADIENTS = [
    "from-yellow-500 via-orange-500 to-red-500",
    "from-green-500 via-emerald-500 to-teal-500",
    "from-pink-500 via-purple-500 to-indigo-500",
    "from-sky-500 via-blue-500 to-cyan-500",
];

const buildSubtitleVariants = (segmentName: string, categoryName: string, theme: string): string[] => [
    categoryName ? `Подборка по категории: ${categoryName}` : `Персональная подборка для сегмента ${segmentName}`,
    theme ? `Тема акции: ${theme}` : "Актуальные предложения для вашего сегмента",
    `Откройте товары для сегмента «${segmentName}»`,
];

const mapQuestion = (question: BuyerPollQuestion, index: number): TestQuestion => ({
    id: Number(question.id || index + 1),
    question: question.text,
    options: (question.options || []).map((option, optionIndex) => ({
        value: option.id || String(optionIndex + 1),
        label: option.text || option.value || `Вариант ${optionIndex + 1}`,
    })),
});

export const mapCurrentPromotionToCarousel = (promotion?: BuyerGetCurrentPromotionResponse | null): Promotion[] => {
    if (!promotion?.id) {
        return [];
    }

    return (promotion.segments || []).map((segment, index) => ({
        id: Number(segment.id || index + 1),
        segment: `${promotion.id}/${segment.id}`,
        title: segment.text?.trim() || segment.name || `Сегмент ${index + 1}`,
        subtitleVariants: buildSubtitleVariants(segment.name, segment.categoryName, promotion.theme),
        gradient: PROMO_GRADIENTS[index % PROMO_GRADIENTS.length],
    }));
};

export const mapPollToTestQuestions = (poll?: BuyerPoll): TestQuestion[] => {
    return (poll?.questions || []).map(mapQuestion).filter((question) => question.options.length > 0);
};

export const buildSegmentPath = (promotionId: string | number, segmentId: string | number) => `${promotionId}/${segmentId}`;
