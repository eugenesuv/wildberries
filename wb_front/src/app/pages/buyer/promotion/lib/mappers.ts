import type {
    BuyerGetCurrentPromotionResponse,
    CommonProductItem,
    CommonSegment,
} from "@/app/shared/api/types/buyer.types";
import { HOROSCOPE_DATA } from "../constants";
import type { HoroscopeData, Product } from "../types";

const FALLBACK_GRADIENTS = [
    "from-yellow-500 via-orange-500 to-red-500",
    "from-green-500 via-emerald-500 to-teal-500",
    "from-pink-500 via-purple-500 to-indigo-500",
    "from-sky-500 via-blue-500 to-cyan-500",
];

const toNumber = (value?: string): number => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeSlug = (value?: string) =>
    (value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9а-яё-]/gi, "");

export const resolveSegmentByRoute = (
    promotion: BuyerGetCurrentPromotionResponse,
    params: { segmentId?: string; legacySegment?: string },
): CommonSegment | undefined => {
    if (params.segmentId) {
        return (promotion.segments || []).find((segment) => String(segment.id) === String(params.segmentId));
    }

    const legacy = normalizeSlug(params.legacySegment);

    return (promotion.segments || []).find((segment) => {
        return normalizeSlug(segment.name) === legacy || normalizeSlug(segment.categoryName) === legacy;
    });
};

export const mapProductItem = (item: CommonProductItem): Product => {
    const originalPrice = toNumber(item.price);
    const discount = item.discount || 0;
    const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

    return {
        id: toNumber(item.id),
        name: item.name,
        price: discountedPrice,
        oldPrice: discount > 0 ? originalPrice : undefined,
        discount: discount || undefined,
        image: item.image,
        badge: item.badge,
        category: item.badge || "Товары акции",
    };
};

export const buildHoroscopeData = (
    promotion: BuyerGetCurrentPromotionResponse,
    segment?: CommonSegment,
    legacySegment?: string,
): HoroscopeData => {
    const slug = normalizeSlug(segment?.name || legacySegment);
    const preset = HOROSCOPE_DATA[slug as keyof typeof HOROSCOPE_DATA];

    if (preset) {
        return {
            ...preset,
            title: segment?.text?.trim() || preset.title,
            prediction: promotion.description || preset.prediction,
            recommendedCategory: segment?.categoryName || preset.recommendedCategory,
        };
    }

    const index = Math.abs((segment?.name || promotion.theme || "promo").length) % FALLBACK_GRADIENTS.length;

    return {
        title: segment?.text?.trim() || `${segment?.name || promotion.name || "Акция"} уже открыта`,
        prediction:
            promotion.description ||
            `Подборка товаров по сегменту «${segment?.name || "персональный"}». Выберите подходящую категорию и товары.`,
        recommendedCategory: segment?.categoryName || "Все категории",
        luckyColor: "Золотой",
        gradient: FALLBACK_GRADIENTS[index],
    };
};
