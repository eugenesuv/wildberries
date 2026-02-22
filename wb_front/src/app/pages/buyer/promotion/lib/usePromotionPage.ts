import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { buyerClient } from "@/app/shared/api/clients/buyer.client";
import { Product, FilterState, FavoriteSet } from "../types";
import { HOROSCOPE_DATA } from "../constants";
import { filterProducts } from "./helpers";
import { buildHoroscopeData, mapProductItem, resolveSegmentByRoute } from "./mappers";

export const usePromotionPage = () => {
    const navigate = useNavigate();
    const { promotionId, segmentId, segment } = useParams<{
        promotionId?: string;
        segmentId?: string;
        segment?: string;
    }>();

    const [filters, setFilters] = useState<FilterState>({
        category: "all",
        onlyDiscounts: false,
    });
    const [favorites, setFavorites] = useState<FavoriteSet>(new Set());
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [gridKey, setGridKey] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [horoscope, setHoroscope] = useState(HOROSCOPE_DATA.leo);

    const filteredProducts = filterProducts(allProducts, filters);

    const toggleFavorite = (productId: number) => {
        setFavorites((prev) => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(productId)) {
                newFavorites.delete(productId);
            } else {
                newFavorites.add(productId);
            }
            return newFavorites;
        });
    };

    const updateFilters = (newFilters: Partial<FilterState>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setGridKey((prev) => prev + 1);
    };

    const openQuickView = (product: Product) => {
        setQuickViewProduct(product);
    };

    const closeQuickView = () => {
        setQuickViewProduct(null);
    };

    useEffect(() => {
        let mounted = true;

        const loadPromotionPage = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const currentPromotion = await buyerClient.getCurrentPromotion();

                if (!mounted) {
                    return;
                }

                if (!currentPromotion?.id) {
                    setAllProducts([]);
                    setIsCompleted(false);
                    setHasError("Сейчас нет активной акции");
                    return;
                }

                const targetPromotionId = promotionId || currentPromotion.id;
                const targetSegment =
                    resolveSegmentByRoute(currentPromotion, { segmentId, legacySegment: segment }) ||
                    currentPromotion.segments?.[0];

                if (!targetSegment) {
                    setAllProducts([]);
                    setIsCompleted(false);
                    setHasError("Для текущей акции не настроены сегменты");
                    return;
                }

                setHoroscope(buildHoroscopeData(currentPromotion, targetSegment, segment));

                if ((!promotionId || !segmentId) && currentPromotion.id && targetSegment.id) {
                    navigate(`/promotion/${currentPromotion.id}/${targetSegment.id}`, { replace: true });
                }

                const productsResponse = await buyerClient.getSegmentProducts(Number(targetPromotionId), Number(targetSegment.id));

                if (!mounted) {
                    return;
                }

                setAllProducts((productsResponse.items || []).map(mapProductItem));
                setIsCompleted(Boolean(productsResponse.completed));
            } catch (error) {
                if (!mounted) {
                    return;
                }

                setAllProducts([]);
                setIsCompleted(false);
                setHasError("Не удалось загрузить товары акции");
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadPromotionPage();

        return () => {
            mounted = false;
        };
    }, [navigate, promotionId, segmentId, segment]);

    return {
        segment: segment || segmentId,
        horoscope,
        filters,
        filteredProducts,
        favorites,
        quickViewProduct,
        gridKey,
        isCompleted,
        isLoading,
        hasError,
        updateFilters,
        toggleFavorite,
        openQuickView,
        closeQuickView,
    };
};
