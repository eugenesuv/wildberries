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
