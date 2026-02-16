import { Button } from "@/app/entities/ui/button";

interface SellerHeaderProps {
    onNavigateHome: () => void;
}

export function SellerHeader({ onNavigateHome }: SellerHeaderProps) {
    return (
        <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl">Кабинет Продавца</h1>
                    <Button variant="outline" onClick={onNavigateHome}>
                        Вернуться на главную
                    </Button>
                </div>
            </div>
        </header>
    );
}
