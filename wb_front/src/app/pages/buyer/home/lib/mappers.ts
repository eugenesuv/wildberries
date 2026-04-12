import type {
    BuyerGetCurrentPromotionResponse,
    BuyerPoll,
    BuyerPollQuestion,
} from "@/app/shared/api/types/buyer.types";
import type { Promotion, TestQuestion } from "../types";
import { PromotionStatus } from "../../../../shared/api/types/common.types";

const PROMO_GRADIENTS = [
    "from-yellow-500 via-orange-500 to-red-500",
    "from-green-500 via-emerald-500 to-teal-500",
    "from-pink-500 via-purple-500 to-indigo-500",
    "from-sky-500 via-blue-500 to-cyan-500",
];

const mapQuestion = (question: BuyerPollQuestion, index: number): TestQuestion => ({
    id: Number(question.id || index + 1),
    question: question.text,
    options: (question.options || []).map((option, optionIndex) => ({
        value: option.id || String(optionIndex + 1),
        label: option.text || option.value || `Вариант ${optionIndex + 1}`,
    })),
});

export const mapCurrentPromotionToCarousel = (promotions?: BuyerGetCurrentPromotionResponse[] | null): Promotion[] => {
    if (!promotions?.length) {
        return [];
    }

    return promotions
        .filter(
            (promotion) =>
                promotion?.id && promotion.segments?.[0]?.id && promotion?.status === PromotionStatus.RUNNING,
        )
        .map((promotion) => {
            const firstSegment = promotion.segments![0];

            return {
                id: Number(promotion.id),
                segment: `${promotion.id}/${firstSegment.id}`,
                title: promotion.name?.trim() || "Текущая акция",
                subtitleVariants: [
                    promotion.description?.trim() || "Пройдите идентификацию и получите персональную подборку",
                    `Тема акции: ${promotion.theme || "без темы"}`,
                    "Откройте акцию и пройдите тест сегментации",
                ],
                gradient: PROMO_GRADIENTS[0],
            };
        });
};

export const mapPollToTestQuestions = (poll?: BuyerPoll): TestQuestion[] => {
    return (poll?.questions || []).map(mapQuestion).filter((question) => question.options.length > 0);
};

export const buildSegmentPath = (promotionId: string | number, segmentId: string | number) =>
    `${promotionId}/${segmentId}`;
