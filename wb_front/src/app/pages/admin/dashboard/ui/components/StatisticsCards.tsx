import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { TrendingUp, Users, DollarSign, Eye } from "lucide-react";
import { Statistics } from "../../types";
import { formatCompactNumber } from "../../lib/helpers";

interface StatisticsCardsProps {
    statistics: Statistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Активных акций</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{statistics.activeActions}</div>
                    <p className="text-xs text-muted-foreground mt-1">из {statistics.totalActions} всего</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Участников</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{statistics.totalParticipants}</div>
                    <p className="text-xs text-muted-foreground mt-1">продавцов участвует</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Выручка</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCompactNumber(statistics.totalRevenue)} ₽</div>
                    <p className="text-xs text-muted-foreground mt-1">за все время</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Просмотров</CardTitle>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCompactNumber(statistics.totalViews)}</div>
                    <p className="text-xs text-muted-foreground mt-1">покупателями</p>
                </CardContent>
            </Card>
        </div>
    );
}
