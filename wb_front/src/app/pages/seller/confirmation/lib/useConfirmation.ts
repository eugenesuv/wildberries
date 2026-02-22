import { useLocation, useNavigate } from "react-router";
import { ConfirmationData } from "../types";
import { MOCK_CONFIRMATION } from "../constants";

export const useConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const confirmationData: ConfirmationData =
        (location.state as { confirmationData?: ConfirmationData } | null)?.confirmationData || MOCK_CONFIRMATION;

    const handleDownloadReceipt = () => {
        // Здесь будет логика скачивания чека
        console.log("Downloading receipt...");
    };

    const handleNavigateHome = () => {
        navigate("/");
    };

    const handleNavigateToApplications = () => {
        navigate("/seller/actions");
    };

    return {
        confirmationData,
        handleDownloadReceipt,
        handleNavigateHome,
        handleNavigateToApplications,
    };
};
