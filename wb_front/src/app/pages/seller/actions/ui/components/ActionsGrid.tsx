import { SellerAction } from "../../types";
import { ActionCard } from "./ActionCard";

interface ActionsGridProps {
    actions: SellerAction[];
    onSelectAction: (actionId: number) => void;
}

export function ActionsGrid({ actions, onSelectAction }: ActionsGridProps) {
    if (actions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Нет акций для выбранной категории</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actions.map((action, index) => (
                <ActionCard key={action.id} action={action} index={index} onSelect={onSelectAction} />
            ))}
        </div>
    );
}
