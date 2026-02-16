import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { CategoryFilter } from "../../types";
import { CATEGORY_FILTERS } from "../../constants";

interface ActionsHeaderProps {
    categoryFilter: CategoryFilter;
    onCategoryChange: (value: CategoryFilter) => void;
}

export function ActionsHeader({ categoryFilter, onCategoryChange }: ActionsHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-3xl mb-2">Доступные Акции</h2>
                <p className="text-muted-foreground">Выберите акцию для участия</p>
            </div>

            <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORY_FILTERS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
