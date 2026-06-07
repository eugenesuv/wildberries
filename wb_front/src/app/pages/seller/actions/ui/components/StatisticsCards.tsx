import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { TrendingUp, LayoutGrid, Users, Eye } from "lucide-react";
import type { SellerStatistics } from "@/app/shared/api/types/seller.types";

interface StatisticsCardsProps {
    statistics: SellerStatistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Активных акций</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.activePromotions}</div>
                    <p className="text-xs text-muted-foreground mt-1">акций</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Свободных слотов</CardTitle>
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.freeSlots}</div>
                    <p className="text-xs text-muted-foreground mt-1">слотов</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Участвовало продавцов</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.occupiedSlots}</div>
                    <p className="text-xs text-muted-foreground mt-1">продавцов</p>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Переходов в акции</CardTitle>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="text-3xl font-bold">{statistics.totalViews}</div>
                    <p className="text-xs text-muted-foreground mt-1">просмотров</p>
                </CardContent>
            </Card>
        </div>
    );
}
