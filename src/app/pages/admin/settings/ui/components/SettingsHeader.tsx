import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/app/entities/ui/button";

interface SettingsHeaderProps {
    isNew: boolean;
    onGoBack: () => void;
    onSave: () => void;
}

export function SettingsHeader({ isNew, onGoBack, onSave }: SettingsHeaderProps) {
    return (
        <header className="bg-white border-b sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onGoBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl">{isNew ? "Создание акции" : "Настройки акции"}</h1>
                        <p className="text-sm text-muted-foreground">Настройте параметры персонализированной акции</p>
                    </div>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600" onClick={onSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                    </Button>
                </div>
            </div>
        </header>
    );
}
