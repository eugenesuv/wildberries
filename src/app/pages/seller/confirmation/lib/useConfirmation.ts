import { useNavigate } from "react-router";
import { ConfirmationData } from "../types";
import { MOCK_CONFIRMATION } from "../constants";

export const useConfirmation = () => {
    const navigate = useNavigate();

    // В реальном приложении здесь может быть загрузка данных из API
    const confirmationData: ConfirmationData = MOCK_CONFIRMATION;

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
