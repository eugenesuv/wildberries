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
