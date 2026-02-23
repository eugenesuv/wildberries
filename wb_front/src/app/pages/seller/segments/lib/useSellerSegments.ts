import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { sellerClient } from "@/app/shared/api/clients/seller.client";
import { DEFAULT_SELLER_ID } from "@/app/shared/api/config";
import { Segment } from "../types";
import { ACTION_NAME, ZODIAC_SEGMENTS } from "../constants";
import { isSegmentFull } from "./helpers";

const mapSegment = (segment: {
    id: number;
    name: string;
    category: string;
    population: number;
    bookedSlots: number;
    totalSlots: number;
}): Segment => {
    const occupiedSlots = Number(segment.bookedSlots || 0);
    const totalSlots = Number(segment.totalSlots || 0);

    return {
        id: String(segment.id),
        name: segment.name,
        category: segment.category || "Без категории",
        occupiedSlots,
        totalSlots,
        reach: Number(segment.population || 0),
        status: totalSlots > 0 && occupiedSlots >= totalSlots ? "full" : "available",
    };
};

export const useSellerSegments = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const [segments, setSegments] = useState<Segment[]>(ZODIAC_SEGMENTS);
    const [actionName, setActionName] = useState(ACTION_NAME);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        if (!actionId) {
            return;
        }

        let mounted = true;

        const loadSegments = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const [segmentsResponse, actionsResponse] = await Promise.all([
                    sellerClient.getActionSegments(Number(actionId)),
                    sellerClient.getSellerActions(DEFAULT_SELLER_ID),
                ]);

                if (!mounted) return;

                setSegments((segmentsResponse.actionSegments || []).map(mapSegment));

                const currentAction = (actionsResponse.actions || []).find((action) => action.id === actionId);
                if (currentAction?.name) {
                    setActionName(currentAction.name);
                } else {
                    setActionName(`Акция #${actionId}`);
                }
            } catch (error) {
                if (!mounted) return;
                setHasError("Не удалось загрузить сегменты акции");
                setSegments(ZODIAC_SEGMENTS);
                setActionName(ACTION_NAME);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadSegments();

        return () => {
            mounted = false;
        };
    }, [actionId]);

    const handleSegmentClick = (segment: Segment) => {
        if (!isSegmentFull(segment)) {
            navigate(`/seller/actions/${actionId}/segments/${segment.id}/slots`);
        }
    };

    const handleGoBack = () => {
        navigate("/seller/actions");
    };

    return {
        actionId,
        segments,
        actionName,
        handleSegmentClick,
        handleGoBack,
        isLoading,
        hasError,
    };
};
