import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { Checkbox } from "@/app/entities/ui/checkbox";
import { FilterState } from "../../types";
import { CATEGORY_FILTERS } from "../../constants";

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: Partial<FilterState>) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleCategoryChange = (value: string) => {
        onFilterChange({ category: value });
    };

    const handleDiscountToggle = (checked: boolean) => {
        onFilterChange({ onlyDiscounts: checked });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
            <div className="md:flex md:flex-wrap md:items-center md:gap-4">
                {/* Mobile filter toggle */}
                <div className="md:hidden mb-4">
                    <details open={isMobileOpen} onToggle={(e) => setIsMobileOpen(e.currentTarget.open)}>
                        <summary className="cursor-pointer select-none">Фильтры</summary>
                        <div className="mt-3 space-y-3">
                            <Select value={filters.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-full">
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
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="discounts-m"
                                    checked={filters.onlyDiscounts}
                                    onCheckedChange={(c) => handleDiscountToggle(!!c)}
                                />
                                <label
                                    htmlFor="discounts-m"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Только со скидкой
                                </label>
                            </div>
                        </div>
                    </details>
                </div>

                {/* Desktop filters */}
                <div className="hidden md:flex md:flex-wrap md:items-center md:gap-4">
                    <Select value={filters.category} onValueChange={handleCategoryChange}>
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

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="discounts"
                            checked={filters.onlyDiscounts}
                            onCheckedChange={(checked) => handleDiscountToggle(!!checked)}
                        />
                        <label htmlFor="discounts" className="text-sm font-medium leading-none cursor-pointer">
                            Только со скидкой
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
