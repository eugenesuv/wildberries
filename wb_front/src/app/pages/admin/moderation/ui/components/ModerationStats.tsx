import { Card, CardContent } from "@/app/entities/ui/card";
import { Package, Check, X } from "lucide-react";
import { ModerationStatistics } from "../../types";

interface ModerationStatsProps {
    statistics: ModerationStatistics;
}

export function ModerationStats({ statistics }: ModerationStatsProps) {
    const stats = [
        {
            label: "На модерации",
            value: statistics.pendingCount,
            color: "yellow",
            icon: Package,
        },
        {
            label: "Одобрено",
            value: statistics.approvedCount,
            color: "green",
            icon: Check,
        },
        {
            label: "Отклонено",
            value: statistics.rejectedCount,
            color: "red",
            icon: X,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.label}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </div>
                                <div
                                    className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}
                                >
                                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
