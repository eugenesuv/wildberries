import { useState } from "react";
import { useNavigate } from "react-router";
import { SellerAction, CategoryFilter } from "../types";
import { MOCK_ACTIONS } from "../constants";
import { filterActionsByCategory } from "./helpers";

export const useSellerActions = () => {
    const navigate = useNavigate();
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
    const [actions] = useState<SellerAction[]>(MOCK_ACTIONS);

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
    };
};
