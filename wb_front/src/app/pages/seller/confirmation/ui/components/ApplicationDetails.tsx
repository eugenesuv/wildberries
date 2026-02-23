import { Badge } from "@/app/entities/ui/badge";
import { ConfirmationData } from "../../types";
import { APPLICATION_STATUS } from "../../constants";
import { formatPrice, formatApplicationNumber } from "../../lib/helpers";

interface ApplicationDetailsProps {
    data: ConfirmationData;
}

export function ApplicationDetails({ data }: ApplicationDetailsProps) {
    const status = APPLICATION_STATUS[data.status];

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-medium mb-4">Детали заявки</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-muted-foreground">Номер заявки:</span>
                    <div className="font-semibold">{formatApplicationNumber(data.applicationNumber)}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Статус:</span>
                    <div>
                        <Badge variant="outline" className={status.className}>
                            {status.label}
                        </Badge>
                    </div>
                </div>
                <div>
                    <span className="text-muted-foreground">Акция:</span>
                    <div className="font-semibold">{data.promotionName}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Сегмент:</span>
                    <div className="font-semibold capitalize">{data.segment}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Позиция:</span>
                    <div className="font-semibold">#{data.position}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Стоимость:</span>
                    <div className="font-semibold">{formatPrice(data.price)}</div>
                </div>
            </div>
        </div>
    );
}
