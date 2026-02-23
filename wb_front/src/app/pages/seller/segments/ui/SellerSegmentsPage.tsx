import { motion } from "motion/react";
import { useSellerSegments } from "../lib/useSellerSegments";
import { SegmentsHeader } from "./components/SegmentsHeader";
import { PageTitle } from "./components/PageTitle";
import { SegmentsGrid } from "./components/SegmentsGrid";

export function SellerSegmentsPage() {
    const { actionName, segments, handleSegmentClick, handleGoBack, isLoading, hasError } = useSellerSegments();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <SegmentsHeader actionName={actionName} onGoBack={handleGoBack} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <PageTitle title="Знаки Зодиака" subtitle="Выберите знак зодиака для размещения товаров" />
                    {hasError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {hasError}
                        </div>
                    )}
                    {isLoading && <div className="mb-4 text-sm text-muted-foreground">Загрузка сегментов...</div>}

                    <SegmentsGrid segments={segments} onSegmentClick={handleSegmentClick} />
                </motion.div>
            </div>
        </div>
    );
}
