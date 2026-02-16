import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Product, FilterState, FavoriteSet } from "../types";
import { HOROSCOPE_DATA, MOCK_PRODUCTS } from "../constants";
import { filterProducts } from "./helpers";

export const usePromotionPage = () => {
    const { segment } = useParams<{ segment: string }>();
    const [filters, setFilters] = useState<FilterState>({
        category: "all",
        onlyDiscounts: false,
    });
    const [favorites, setFavorites] = useState<FavoriteSet>(new Set());
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [gridKey, setGridKey] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const horoscope = HOROSCOPE_DATA[segment || "leo"] || HOROSCOPE_DATA.leo;

    const filteredProducts = filterProducts(MOCK_PRODUCTS, filters);

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
        setGridKey((prev) => prev + 1); // Trigger grid re-render animation
    };

    const openQuickView = (product: Product) => {
        setQuickViewProduct(product);
    };

    const closeQuickView = () => {
        setQuickViewProduct(null);
    };

    useEffect(() => {
        // Имитация завершения акции для кейса
        if (segment === "libra") {
            setIsCompleted(true);
        }
    }, [segment]);

    return {
        segment,
        horoscope,
        filters,
        filteredProducts,
        favorites,
        quickViewProduct,
        gridKey,
        isCompleted,
        updateFilters,
        toggleFavorite,
        openQuickView,
        closeQuickView,
    };
};
