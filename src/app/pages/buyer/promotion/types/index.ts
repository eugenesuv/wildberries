export interface Product {
    id: number;
    name: string;
    price: number;
    oldPrice?: number;
    discount?: number;
    image: string;
    badge?: string;
    category: string;
}

export interface HoroscopeData {
    title: string;
    prediction: string;
    recommendedCategory: string;
    luckyColor: string;
    gradient: string;
}

export interface FilterState {
    category: string;
    onlyDiscounts: boolean;
}

export type FavoriteSet = Set<number>;
