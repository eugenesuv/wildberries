import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Clock, Gavel } from "lucide-react";
import { AuctionSlot } from "../../types";
import { formatPrice } from "../../lib/helpers";

interface AuctionSlotCardProps {
    slot: AuctionSlot;
    index: number;
    onBid: (slot: AuctionSlot) => void;
}

export function AuctionSlotCard({ slot, index, onBid }: AuctionSlotCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">Позиция #{slot.position}</CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.timeLeft}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Текущая ставка</div>
                        <div className="text-2xl font-bold">{formatPrice(slot.currentBid)}</div>
                    </div>

                    {slot.topBidder && (
                        <div className="text-sm">
                            <span className="text-muted-foreground">Лидирует: </span>
                            <span className="font-medium">{slot.topBidder}</span>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Минимальная ставка</div>
                        <div className="text-lg font-semibold">{formatPrice(slot.minBid)}</div>
                        <div className="text-xs text-muted-foreground">Шаг: {slot.bidStep} ₽</div>
                    </div>

                    <Button className="w-full" onClick={() => onBid(slot)}>
                        <Gavel className="w-4 h-4 mr-2" />
                        Сделать ставку
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
