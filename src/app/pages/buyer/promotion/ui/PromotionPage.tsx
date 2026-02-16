import { usePromotionPage } from "../lib/usePromotionPage";
import { HoroscopeHero } from "./components/HoroscopeHero";
import { FilterBar } from "./components/FilterBar";
import { ProductGrid } from "./components/ProductGrid";
import { CompletionBanner } from "./components/CompletionBanner";
import { QuickViewModal } from "./components/QuickViewModal";

export function PromotionPage() {
    const {
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
    } = usePromotionPage();

    const handleAddToCart = (product: any) => {
        // Здесь будет логика добавления в корзину
        console.log("Add to cart:", product);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <HoroscopeHero horoscope={horoscope} />

            <section className="container mx-auto px-4 py-8">
                <FilterBar filters={filters} onFilterChange={updateFilters} />

                <CompletionBanner isVisible={isCompleted} />

                <ProductGrid
                    products={filteredProducts}
                    favorites={favorites}
                    gridKey={gridKey}
                    onFavoriteToggle={toggleFavorite}
                    onProductClick={openQuickView}
                    onAddToCart={handleAddToCart}
                />
            </section>

            <QuickViewModal product={quickViewProduct} onClose={closeQuickView} onAddToCart={handleAddToCart} />
        </div>
    );
}
