import { useState } from "react";
import { useNavigate } from "react-router";
import { AdminAction, StatusFilter } from "../types";
import { MOCK_ADMIN_ACTIONS } from "../constants";
import { calculateStatistics } from "./helpers";

export const useAdminDashboard = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [actions] = useState<AdminAction[]>(MOCK_ADMIN_ACTIONS);

    const filteredActions = actions.filter((action) => statusFilter === "all" || action.status === statusFilter);

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
    };
};
