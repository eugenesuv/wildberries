import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { TrendingUp, LayoutGrid, Layers, CreditCard, Gavel } from "lucide-react";
import { Statistics } from "../../types";
import { formatCurrency } from "../../lib/helpers";

interface StatisticsCardsProps {
    statistics: Statistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Активных акций</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.activeActions}</div>
                    <p className="text-xs text-muted-foreground mt-1">из {statistics.totalActions} всего</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Слотов</CardTitle>
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.totalSlots}</div>
                    <p className="text-xs text-muted-foreground mt-1">всего слотов</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Сегментов</CardTitle>
                    <Layers className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.totalSegments}</div>
                    <p className="text-xs text-muted-foreground mt-1">сегментов</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Общая стоимость фикс.слотов</CardTitle>
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{formatCurrency(statistics.totalBookedSlotsPrice)}</div>
                    <p className="text-xs text-muted-foreground mt-1">фикс. слоты</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Общая стоимость аукциона</CardTitle>
                    <Gavel className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{formatCurrency(statistics.totalAuctionSlotsPrice)}</div>
                    <p className="text-xs text-muted-foreground mt-1">аукцион</p>
                </CardContent>
            </Card>
        </div>
    );
}
