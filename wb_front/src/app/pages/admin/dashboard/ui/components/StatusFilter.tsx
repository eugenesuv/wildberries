import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { AdminStatusFilter } from "../../types";
import { STATUS_FILTER_OPTIONS } from "../../constants";

interface StatusFilterProps {
    value: AdminStatusFilter;
    onChange: (value: AdminStatusFilter) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
