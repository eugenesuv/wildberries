import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/entities/ui/dialog";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Checkbox } from "@/app/entities/ui/checkbox";
import { Label } from "@/app/entities/ui/label";
import { Check, X } from "lucide-react";
import { Application } from "../../types";
import { STATUS_COLORS, STATUS_LABELS, STOP_FACTORS } from "../../constants";
import { formatCurrency } from "../../lib/helpers";

interface ApplicationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    application: Application | null;
    detectedStopFactors: string[];
    onUpdateStopFactors: (factor: string, checked: boolean) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export function ApplicationDetailsDialog({
    open,
    onOpenChange,
    application,
    detectedStopFactors,
    onUpdateStopFactors,
    onApprove,
    onReject,
}: ApplicationDetailsDialogProps) {
    if (!application) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Детали заявки</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <img
                            src={application.image}
                            alt={application.productName}
                            className="w-48 h-48 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="text-sm text-muted-foreground">Товар</div>
                                <div className="font-medium text-lg">{application.productName}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-sm text-muted-foreground">Цена</div>
                                    <div className="font-medium">{formatCurrency(application.price)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Скидка</div>
                                    <div className="font-medium">{application.discount}%</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Сегмент</div>
                                    <div className="font-medium">{application.segment}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Позиция</div>
                                    <div className="font-medium">#{application.position}</div>
                                </div>
                            </div>
                            <div>
                                <Badge className={STATUS_COLORS[application.status]}>
                                    {STATUS_LABELS[application.status]}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Проверка стоп-факторов */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Проверка стоп-факторов</h4>
                        <div className="space-y-2">
                            {STOP_FACTORS.map((factor) => (
                                <div key={factor} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`detail-${factor}`}
                                        checked={detectedStopFactors.includes(factor)}
                                        onCheckedChange={(checked) => onUpdateStopFactors(factor, checked as boolean)}
                                    />
                                    <Label htmlFor={`detail-${factor}`} className="cursor-pointer">
                                        {factor}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Действия */}
                    {application.status === "pending" && (
                        <div className="border-t pt-4 grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onReject(application.id);
                                    onOpenChange(false);
                                }}
                                className="text-red-600"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Отклонить
                            </Button>
                            <Button
                                onClick={() => {
                                    onApprove(application.id);
                                    onOpenChange(false);
                                }}
                                disabled={detectedStopFactors.length > 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Одобрить
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
