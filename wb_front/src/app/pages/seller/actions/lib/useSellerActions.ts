import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { sellerClient } from "@/app/shared/api/clients/seller.client";
import { DEFAULT_SELLER_ID } from "@/app/shared/api/config";
import { SellerAction, CategoryFilter } from "../types";
import { MOCK_ACTIONS } from "../constants";
import { filterActionsByCategory } from "./helpers";

const mapStatus = (status: string): SellerAction["status"] => {
    switch (status) {
        case "RUNNING":
            return "active";
        case "COMPLETED":
            return "completed";
        case "READY_TO_START":
        default:
            return "upcoming";
    }
};

const mapAction = (action: {
    id: string;
    name: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    categoryHint: string;
    theme: string;
}): SellerAction => ({
    id: Number(action.id),
    name: action.name,
    description: action.theme || "Акция для размещения товаров",
    startDate: action.dateFrom,
    endDate: action.dateTo,
    status: mapStatus(action.status),
    category: action.categoryHint || "Все категории",
    participants: 0,
    views: 0,
});

export const useSellerActions = () => {
    const navigate = useNavigate();
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
    const [actions, setActions] = useState<SellerAction[]>(MOCK_ACTIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadActions = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const response = await sellerClient.getSellerActions(DEFAULT_SELLER_ID);
                if (!mounted) return;
                setActions((response.actions || []).map(mapAction));
            } catch (error) {
                if (!mounted) return;
                setHasError("Не удалось загрузить список акций");
                setActions(MOCK_ACTIONS);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadActions();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredActions = filterActionsByCategory(actions, categoryFilter);

    const handleSelectAction = (actionId: number) => {
        navigate(`/seller/actions/${actionId}/segments`);
    };

    const handleNavigateHome = () => {
        navigate("/");
    };

    return {
        filteredActions,
        categoryFilter,
        setCategoryFilter,
        handleSelectAction,
        handleNavigateHome,
        isLoading,
        hasError,
    };
};
