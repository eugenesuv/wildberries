import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { DollarSign } from "lucide-react";
import { FixedPriceSlot } from "../../types";
import { formatPrice } from "../../lib/helpers";

interface FixedPriceSlotCardProps {
    slot: FixedPriceSlot;
    index: number;
    onBuy: (slot: FixedPriceSlot) => void;
}

export function FixedPriceSlotCard({ slot, index, onBuy }: FixedPriceSlotCardProps) {
    const isOccupied = slot.status === "occupied";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className={`hover:shadow-lg transition-shadow ${isOccupied ? "opacity-60" : ""}`}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">Позиция #{slot.position}</CardTitle>
                        {isOccupied && <Badge variant="secondary">Занято</Badge>}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Стоимость</div>
                        <div className="text-3xl font-bold">{formatPrice(slot.price)}</div>
                    </div>

                    <Button className="w-full" disabled={isOccupied} onClick={() => onBuy(slot)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        {isOccupied ? "Занято" : "Купить слот"}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
