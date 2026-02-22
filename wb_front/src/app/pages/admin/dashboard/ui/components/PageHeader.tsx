import { LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/app/entities/ui/button";

interface PageHeaderProps {
    onCreateAction: () => void;
    onNavigateHome: () => void;
}

export function PageHeader({ onCreateAction, onNavigateHome }: PageHeaderProps) {
    return (
        <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-purple-600" />
                        <h1 className="text-2xl">Админ-панель</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onNavigateHome}>
                            На главную
                        </Button>
                        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600" onClick={onCreateAction}>
                            <Plus className="w-4 h-4 mr-2" />
                            Создать акцию
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
