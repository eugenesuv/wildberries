import { Product } from "../../types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
    products: Product[];
    favorites: Set<number>;
    gridKey: number;
    onFavoriteToggle: (id: number) => void;
    onProductClick: (product: Product) => void;
    onAddToCart: (product: Product) => void;
}

export function ProductGrid({
    products,
    favorites,
    gridKey,
    onFavoriteToggle,
    onProductClick,
    onAddToCart,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Нет товаров, соответствующих выбранным фильтрам</p>
            </div>
        );
    }

    return (
        <div
            key={gridKey}
            className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            {products.map((product, index) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    index={index}
                    onFavoriteToggle={onFavoriteToggle}
                    onClick={onProductClick}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    );
}
