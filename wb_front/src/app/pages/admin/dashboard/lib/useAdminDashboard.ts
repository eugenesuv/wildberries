import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { adminClient } from "@/app/shared/api/clients/admin.client";
import { AdminAction, StatusFilter } from "../types";
import { MOCK_ADMIN_ACTIONS } from "../constants";
import { calculateStatistics } from "./helpers";

const mapStatus = (status: string): AdminAction["status"] => {
    switch (status) {
        case "RUNNING":
            return "active";
        case "COMPLETED":
            return "completed";
        case "READY_TO_START":
        case "PAUSED":
            return "upcoming";
        default:
            return "draft";
    }
};

const mapPromotionSummary = (promotion: {
    id: number;
    name: string;
    theme: string;
    status: string;
    dateFrom: string;
    dateTo: string;
}): AdminAction => ({
    id: Number(promotion.id),
    name: promotion.name,
    theme: promotion.theme || "—",
    status: mapStatus(promotion.status),
    startDate: promotion.dateFrom,
    endDate: promotion.dateTo,
    participants: 0,
    revenue: 0,
    views: 0,
});

export const useAdminDashboard = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [actions, setActions] = useState<AdminAction[]>(MOCK_ADMIN_ACTIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadPromotions = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const response = await adminClient.listPromotions();
                if (!mounted) return;
                setActions((response.promotions || []).map(mapPromotionSummary));
            } catch (error) {
                if (!mounted) return;
                setHasError("Не удалось загрузить список акций");
                setActions(MOCK_ADMIN_ACTIONS);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadPromotions();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredActions = useMemo(
        () => actions.filter((action) => statusFilter === "all" || action.status === statusFilter),
        [actions, statusFilter],
    );

    const statistics = calculateStatistics(actions);

    const handleCreateAction = () => {
        navigate("/admin/actions/new/settings");
    };

    const handleEditAction = (actionId: number) => {
        navigate(`/admin/actions/${actionId}/settings`);
    };

    const handleViewAction = (actionId: number) => {
        navigate(`/admin/actions/${actionId}/moderation`);
    };

    const handleNavigateHome = () => {
        navigate("/");
    };

    return {
        actions,
        filteredActions,
        statistics,
        statusFilter,
        setStatusFilter,
        handleCreateAction,
        handleEditAction,
        handleViewAction,
        handleNavigateHome,
        isLoading,
        hasError,
    };
};
