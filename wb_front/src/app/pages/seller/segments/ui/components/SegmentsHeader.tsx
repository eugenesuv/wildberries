import { Button } from "@/app/entities/ui/button";
import { ArrowLeft } from "lucide-react";

interface SegmentsHeaderProps {
    actionName: string;
    onGoBack: () => void;
}

export function SegmentsHeader({ actionName, onGoBack }: SegmentsHeaderProps) {
    return (
        <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onGoBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl">Выбор Сегмента</h1>
                        <p className="text-sm text-muted-foreground">Акция: {actionName}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
