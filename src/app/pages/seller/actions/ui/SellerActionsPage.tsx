import { motion } from "motion/react";
import { useSellerActions } from "../lib/useSellerActions";
import { SellerHeader } from "./components/SellerHeader";
import { ActionsHeader } from "./components/ActionsHeader";
import { ActionsGrid } from "./components/ActionsGrid";

export function SellerActionsPage() {
    const { filteredActions, categoryFilter, setCategoryFilter, handleSelectAction, handleNavigateHome } =
        useSellerActions();

    return (
        <div className="min-h-screen bg-gray-50">
            <SellerHeader onNavigateHome={handleNavigateHome} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ActionsHeader categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} />

                    <ActionsGrid actions={filteredActions} onSelectAction={handleSelectAction} />
                </motion.div>
            </div>
        </div>
    );
}
