import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/app/entities/ui/button";

interface ModerationHeaderProps {
    actionId?: string;
    onGoBack: () => void;
    onBulkApprove: () => void;
    pendingCount: number;
    actionName?: string;
}

export function ModerationHeader({
    actionId,
    onGoBack,
    onBulkApprove,
    pendingCount,
    actionName = "Гороскопные Скидки - Январь 2026",
}: ModerationHeaderProps) {
    return (
        <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onGoBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl">Модерация товаров</h1>
                        <p className="text-sm text-muted-foreground">Акция: {actionName}</p>
                    </div>
                    <Button variant="outline" onClick={onBulkApprove} disabled={pendingCount === 0}>
                        <Check className="w-4 h-4 mr-2" />
                        Одобрить все без стоп-факторов ({pendingCount})
                    </Button>
                </div>
            </div>
        </header>
    );
}
