import { useLocation, useNavigate } from "react-router";
import { ConfirmationData } from "../types";

export const useConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const confirmationData: ConfirmationData | undefined = (
        location.state as { confirmationData?: ConfirmationData } | null
    )?.confirmationData;

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
