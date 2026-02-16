import { motion } from "motion/react";
import { Card, CardContent } from "@/app/entities/ui/card";
import { TabsContent } from "@/app/entities/ui/tabs";
import { useModeration } from "../lib/useModeration";
import { ModerationHeader } from "./components/ModerationHeader";
import { ModerationStats } from "./components/ModerationStats";
import { ModerationTabs } from "./components/ModerationTabs";
import { ApplicationsTable } from "./components/ApplicationsTable";
import { ApplicationDetailsDialog } from "./components/ApplicationDetailsDialog";

export function AdminModerationPage() {
    const {
        actionId,
        filteredApplications,
        selectedApp,
        statistics,
        activeTab,
        setActiveTab,
        showDetailsDialog,
        detectedStopFactors,
        handleApprove,
        handleReject,
        handleBulkApprove,
        handleViewDetails,
        handleUpdateStopFactors,
        handleCloseDialog,
        handleGoBack,
    } = useModeration();

    const tabCounts = {
        all: statistics.totalCount,
        pending: statistics.pendingCount,
        approved: statistics.approvedCount,
        rejected: statistics.rejectedCount,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ModerationHeader
                actionId={actionId}
                onGoBack={handleGoBack}
                onBulkApprove={handleBulkApprove}
                pendingCount={statistics.pendingCount}
            />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ModerationStats statistics={statistics} />

                    <ModerationTabs activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />

                    <Card>
                        <CardContent className="p-6">
                            <ApplicationsTable
                                applications={filteredApplications}
                                onViewDetails={handleViewDetails}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <ApplicationDetailsDialog
                open={showDetailsDialog}
                onOpenChange={handleCloseDialog}
                application={selectedApp}
                detectedStopFactors={detectedStopFactors}
                onUpdateStopFactors={handleUpdateStopFactors}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
}
