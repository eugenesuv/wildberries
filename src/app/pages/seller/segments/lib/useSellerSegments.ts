import { useNavigate, useParams } from "react-router";
import { Segment } from "../types";
import { ZODIAC_SEGMENTS, ACTION_NAME } from "../constants";
import { isSegmentFull } from "./helpers";

export const useSellerSegments = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();

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
        segments: ZODIAC_SEGMENTS,
        actionName: ACTION_NAME,
        handleSegmentClick,
        handleGoBack,
    };
};
