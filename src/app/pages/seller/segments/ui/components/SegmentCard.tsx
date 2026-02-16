import { motion } from "motion/react";
import { Card, CardContent } from "@/app/entities/ui/card";
import { Badge } from "@/app/entities/ui/badge";
import { Button } from "@/app/entities/ui/button";
import { Users, Package } from "lucide-react";
import { Segment } from "../../types";
import {
    getSegmentStatusColor,
    getSegmentStatusText,
    calculateOccupiedPercentage,
    isSegmentFull,
    formatReach,
} from "../../lib/helpers";

interface SegmentCardProps {
    segment: Segment;
    index: number;
    onClick: (segment: Segment) => void;
}

export function SegmentCard({ segment, index, onClick }: SegmentCardProps) {
    const isFull = isSegmentFull(segment);
    const statusColor = getSegmentStatusColor(segment.occupiedSlots, segment.totalSlots);
    const statusText = getSegmentStatusText(segment.occupiedSlots, segment.totalSlots);
    const occupiedPercentage = calculateOccupiedPercentage(segment.occupiedSlots, segment.totalSlots);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                className={`hover:shadow-lg transition-all cursor-pointer group ${isFull ? "opacity-60" : ""}`}
                onClick={() => onClick(segment)}
            >
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-2xl mb-1 group-hover:text-purple-600 transition-colors">
                                {segment.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{segment.category}</p>
                        </div>
                        <Badge className={statusColor}>{statusText}</Badge>
                    </div>

                    {/* Прогресс-бар заполненности слотов */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Занято слотов</span>
                            <span>
                                {segment.occupiedSlots}/{segment.totalSlots}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${occupiedPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Охват</div>
                                <div className="font-semibold">{formatReach(segment.reach)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="text-xs text-muted-foreground">Категория</div>
                                <div className="font-semibold text-xs truncate">{segment.category}</div>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full" disabled={isFull}>
                        {isFull ? "Все слоты заняты" : "Выбрать слоты"}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
