import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Calendar, Package, TrendingUp, Users } from "lucide-react";
import { SellerAction } from "../../types";
import { STATUS_COLORS, STATUS_LABELS } from "../../constants";
import { formatDateRange, formatNumber } from "../../lib/helpers";

interface ActionCardProps {
    action: SellerAction;
    index: number;
    onSelect: (actionId: number) => void;
}

export function ActionCard({ action, index, onSelect }: ActionCardProps) {
    const isActive = action.status === "active";
    const isCompleted = action.status === "completed";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                            {action.name}
                        </CardTitle>
                        <Badge className={STATUS_COLORS[action.status]}>{STATUS_LABELS[action.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateRange(action.startDate, action.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>{action.category}</span>
                    </div>

                    {isActive && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Участников</div>
                                    <div className="font-semibold">{action.participants}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Просмотров</div>
                                    <div className="font-semibold">{formatNumber(action.views)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button className="w-full" disabled={isCompleted} onClick={() => onSelect(action.id)}>
                        {isCompleted ? "Акция завершена" : "Выбрать сегменты"}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
