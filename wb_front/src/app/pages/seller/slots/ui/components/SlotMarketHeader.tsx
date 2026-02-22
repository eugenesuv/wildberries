import { Button } from "@/app/entities/ui/button";
import { ArrowLeft } from "lucide-react";

interface SlotMarketHeaderProps {
    segment?: string;
    onGoBack: () => void;
}

export function SlotMarketHeader({ segment, onGoBack }: SlotMarketHeaderProps) {
    return (
        <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onGoBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl capitalize">Слоты для знака: {segment}</h1>
                        <p className="text-sm text-muted-foreground">Выберите позицию и добавьте товар</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
