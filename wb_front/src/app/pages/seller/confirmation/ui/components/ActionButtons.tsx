import { Button } from "@/app/entities/ui/button";
import { Home, Package, Download } from "lucide-react";

interface ActionButtonsProps {
    onHomeClick: () => void;
    onApplicationsClick: () => void;
    onDownloadReceipt: () => void;
}

export function ActionButtons({ onHomeClick, onApplicationsClick, onDownloadReceipt }: ActionButtonsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={onHomeClick}>
                <Home className="w-4 h-4" />
                На главную
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={onApplicationsClick}>
                <Package className="w-4 h-4" />
                Мои заявки
            </Button>
            <Button
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
                onClick={onDownloadReceipt}
            >
                <Download className="w-4 h-4" />
                Скачать чек
            </Button>
        </div>
    );
}
