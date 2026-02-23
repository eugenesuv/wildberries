import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { useAdminDashboard } from "../lib/useAdminDashboard";
import { PageHeader } from "./components/PageHeader";
import { StatisticsCards } from "./components/StatisticsCards";
import { StatusFilter } from "./components/StatusFilter";
import { ActionsTable } from "./components/ActionsTable";

export function AdminDashboardPage() {
    const {
        filteredActions,
        statistics,
        statusFilter,
        setStatusFilter,
        isLoading,
        hasError,
        handleCreateAction,
        handleEditAction,
        handleViewAction,
        handleNavigateHome,
    } = useAdminDashboard();

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader onCreateAction={handleCreateAction} onNavigateHome={handleNavigateHome} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <StatisticsCards statistics={statistics} />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Список акций</CardTitle>
                                <StatusFilter value={statusFilter} onChange={setStatusFilter} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {hasError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {hasError}
                                </div>
                            )}
                            {isLoading && <div className="mb-4 text-sm text-muted-foreground">Загрузка акций...</div>}
                            <ActionsTable
                                actions={filteredActions}
                                onEdit={handleEditAction}
                                onView={handleViewAction}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
