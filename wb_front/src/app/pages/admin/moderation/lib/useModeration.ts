import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { adminClient } from "@/app/shared/api/clients/admin.client";
import { Application, ModerationTab } from "../types";
import { MOCK_APPLICATIONS } from "../constants";
import { calculateModerationStatistics } from "./helpers";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";

const mapApplication = (
    app: {
        id: string;
        sellerId: string;
        segmentId: string;
        slotId: string;
        productName: string;
        price: string;
        discount: number;
        stopFactors: string[];
        status: string;
    },
    segmentNames: Record<string, string>,
): Application => ({
    id: Number(app.id),
    sellerId: app.sellerId,
    sellerName: `Продавец #${app.sellerId}`,
    segment: segmentNames[app.segmentId] || `Сегмент #${app.segmentId}`,
    position: Number(app.slotId || 0),
    productName: app.productName || `Товар продавца #${app.sellerId}`,
    price: Number(app.price || 0),
    discount: Number(app.discount || 0),
    image: PLACEHOLDER_IMAGE,
    status: (["pending", "approved", "rejected"].includes(app.status) ? app.status : "pending") as Application["status"],
    stopFactors: app.stopFactors || [],
    submittedAt: new Date().toISOString(),
});

export const useModeration = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [detectedStopFactors, setDetectedStopFactors] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ModerationTab>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    const loadApplications = useCallback(async () => {
        if (!actionId) {
            return;
        }

        setIsLoading(true);
        setHasError(null);

        try {
            const [appsResponse, promotionResponse] = await Promise.all([
                adminClient.getModerationApplications(Number(actionId)),
                adminClient.getPromotion(Number(actionId)),
            ]);

            const segmentNames = (promotionResponse.segments || []).reduce<Record<string, string>>((acc, segment) => {
                acc[segment.id] = segment.name;
                return acc;
            }, {});

            setApplications((appsResponse.applications || []).map((app) => mapApplication(app, segmentNames)));
        } catch (error) {
            setHasError("Не удалось загрузить заявки на модерацию");
            setApplications(MOCK_APPLICATIONS);
        } finally {
            setIsLoading(false);
        }
    }, [actionId]);

    useEffect(() => {
        void loadApplications();
    }, [loadApplications]);

    const statistics = calculateModerationStatistics(applications);

    const handleApprove = async (appId: number) => {
        try {
            await adminClient.approveApplication(appId);
            await loadApplications();
            if (selectedApp?.id === appId) {
                setSelectedApp((prev) => (prev ? { ...prev, status: "approved" } : prev));
            }
        } catch (error) {
            setHasError("Не удалось одобрить заявку");
        }
    };

    const handleReject = async (appId: number) => {
        try {
            await adminClient.rejectApplication(appId, "rejected_by_admin");
            await loadApplications();
            if (selectedApp?.id === appId) {
                setSelectedApp((prev) => (prev ? { ...prev, status: "rejected" } : prev));
            }
        } catch (error) {
            setHasError("Не удалось отклонить заявку");
        }
    };

    const handleBulkApprove = async () => {
        const targets = applications.filter((app) => app.status === "pending" && app.stopFactors.length === 0);
        try {
            await Promise.all(targets.map((app) => adminClient.approveApplication(app.id)));
            await loadApplications();
        } catch (error) {
            setHasError("Не удалось выполнить массовое одобрение");
        }
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

    const filteredApplications = useMemo(
        () => applications.filter((app) => activeTab === "all" || app.status === activeTab),
        [applications, activeTab],
    );

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
        isLoading,
        hasError,
        handleApprove,
        handleReject,
        handleBulkApprove,
        handleViewDetails,
        handleUpdateStopFactors,
        handleCloseDialog,
        handleGoBack,
    };
};
