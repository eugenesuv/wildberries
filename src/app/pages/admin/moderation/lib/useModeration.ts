import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Application, ModerationTab } from "../types";
import { MOCK_APPLICATIONS } from "../constants";
import { calculateModerationStatistics } from "./helpers";

export const useModeration = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [detectedStopFactors, setDetectedStopFactors] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ModerationTab>("all");

    const statistics = calculateModerationStatistics(applications);

    const handleApprove = (appId: number) => {
        setApplications(applications.map((app) => (app.id === appId ? { ...app, status: "approved" } : app)));
        if (selectedApp?.id === appId) {
            setSelectedApp({ ...selectedApp, status: "approved" });
        }
    };

    const handleReject = (appId: number) => {
        setApplications(applications.map((app) => (app.id === appId ? { ...app, status: "rejected" } : app)));
        if (selectedApp?.id === appId) {
            setSelectedApp({ ...selectedApp, status: "rejected" });
        }
    };

    const handleBulkApprove = () => {
        setApplications(
            applications.map((app) =>
                app.status === "pending" && app.stopFactors.length === 0 ? { ...app, status: "approved" } : app,
            ),
        );
    };

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
        setDetectedStopFactors(app.stopFactors);
        setShowDetailsDialog(true);
    };

    const handleUpdateStopFactors = (factor: string, checked: boolean) => {
        setDetectedStopFactors((prev) => (checked ? [...prev, factor] : prev.filter((f) => f !== factor)));
    };

    const handleCloseDialog = () => {
        setShowDetailsDialog(false);
        setSelectedApp(null);
        setDetectedStopFactors([]);
    };

    const handleGoBack = () => {
        navigate("/admin/dashboard");
    };

    const filteredApplications = applications.filter((app) => activeTab === "all" || app.status === activeTab);

    return {
        actionId,
        applications,
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
    };
};
