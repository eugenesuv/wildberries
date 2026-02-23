import { Product, FilterState } from "../types";

export const filterProducts = (products: Product[], filters: FilterState): Product[] => {
    return products.filter((product) => {
        if (filters.category !== "all" && product.category !== filters.category) {
            return false;
        }
        if (filters.onlyDiscounts && !product.discount) {
            return false;
        }
        return true;
    });
};

export const formatPrice = (price: number): string => {
    return `${price.toLocaleString("ru-RU")} ₽`;
};

export const generateStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.15,
    }));
};
