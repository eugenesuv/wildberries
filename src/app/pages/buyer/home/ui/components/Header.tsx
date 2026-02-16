import { Sparkles } from "lucide-react";
import { Button } from "@/app/entities/ui/button";

interface HeaderProps {
    onNavigate: (path: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
    return (
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6" style={{ color: "var(--magic-primary)" }} />
                        <h1 className="text-xl">Гороскопные Скидки</h1>
                    </div>
                    <nav className="flex gap-4">
                        <Button variant="ghost" onClick={() => onNavigate("/seller/actions")}>
                            Для продавцов
                        </Button>
                        <Button variant="ghost" onClick={() => onNavigate("/admin/dashboard")}>
                            Админ-панель
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}
