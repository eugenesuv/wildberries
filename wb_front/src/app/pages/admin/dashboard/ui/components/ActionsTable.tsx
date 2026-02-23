import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/entities/ui/table";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Edit, Eye } from "lucide-react";
import { AdminAction } from "../../types";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";
import { formatDate, formatCurrency } from "../../lib/helpers";

interface ActionsTableProps {
    actions: AdminAction[];
    onEdit: (id: number) => void;
    onView: (id: number) => void;
}

export function ActionsTable({ actions, onEdit, onView }: ActionsTableProps) {
    if (actions.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Нет акций для выбранного фильтра</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тема</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead className="text-right">Участники</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {actions.map((action) => (
                    <TableRow key={action.id}>
                        <TableCell className="font-medium">{action.name}</TableCell>
                        <TableCell>{action.theme}</TableCell>
                        <TableCell>
                            <Badge className={STATUS_COLORS[action.status]}>{STATUS_LABELS[action.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {formatDate(action.startDate)} - {formatDate(action.endDate)}
                        </TableCell>
                        <TableCell className="text-right">{action.participants}</TableCell>
                        <TableCell className="text-right">{formatCurrency(action.revenue)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(action.id)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onView(action.id)}>
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
