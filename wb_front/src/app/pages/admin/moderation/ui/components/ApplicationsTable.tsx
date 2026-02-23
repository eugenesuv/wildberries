import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/entities/ui/table";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Eye, Check, X } from "lucide-react";
import { Application } from "../../types";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";
import { formatCurrency } from "../../lib/helpers";

interface ApplicationsTableProps {
    applications: Application[];
    onViewDetails: (app: Application) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export function ApplicationsTable({ applications, onViewDetails, onApprove, onReject }: ApplicationsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead>Сегмент</TableHead>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Скидка</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map((app) => (
                    <TableRow key={app.id} className={app.stopFactors.length > 0 ? "bg-red-50" : ""}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <img src={app.image} alt={app.productName} className="w-12 h-12 object-cover rounded" />
                                <div>
                                    <div className="font-medium">{app.productName}</div>
                                    {app.stopFactors.length > 0 && (
                                        <div className="text-xs text-red-600">
                                            Стоп-факторы: {app.stopFactors.join(", ")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{app.sellerName}</TableCell>
                        <TableCell>{app.segment}</TableCell>
                        <TableCell>#{app.position}</TableCell>
                        <TableCell>{formatCurrency(app.price)}</TableCell>
                        <TableCell>{app.discount > 0 ? `${app.discount}%` : "—"}</TableCell>
                        <TableCell>
                            <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onViewDetails(app)}>
                                    <Eye className="w-4 h-4" />
                                </Button>
                                {app.status === "pending" && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onApprove(app.id)}
                                            disabled={app.stopFactors.length > 0}
                                        >
                                            <Check className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onReject(app.id)}>
                                            <X className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
