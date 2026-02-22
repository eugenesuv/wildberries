import { motion } from "motion/react";
import { useSellerActions } from "../lib/useSellerActions";
import { SellerHeader } from "./components/SellerHeader";
import { ActionsHeader } from "./components/ActionsHeader";
import { ActionsGrid } from "./components/ActionsGrid";

export function SellerActionsPage() {
    const {
        filteredActions,
        categoryFilter,
        setCategoryFilter,
        handleSelectAction,
        handleNavigateHome,
        isLoading,
        hasError,
    } =
        useSellerActions();

    return (
        <div className="min-h-screen bg-gray-50">
            <SellerHeader onNavigateHome={handleNavigateHome} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ActionsHeader categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} />
                    {hasError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {hasError}
                        </div>
                    )}
                    {isLoading && <div className="mb-4 text-sm text-muted-foreground">Загрузка акций...</div>}

                    <ActionsGrid actions={filteredActions} onSelectAction={handleSelectAction} />
                </motion.div>
            </div>
        </div>
    );
}
