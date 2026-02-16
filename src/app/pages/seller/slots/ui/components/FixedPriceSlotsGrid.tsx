import { FixedPriceSlot } from "../../types";
import { FixedPriceSlotCard } from "./FixedPriceSlotCard";
import { InfoBanner } from "./InfoBanner";
import { FIXED_PRICE_INFO } from "../../constants";

interface FixedPriceSlotsGridProps {
    slots: FixedPriceSlot[];
    onBuy: (slot: FixedPriceSlot) => void;
}

export function FixedPriceSlotsGrid({ slots, onBuy }: FixedPriceSlotsGridProps) {
    return (
        <div className="space-y-6">
            <InfoBanner title={FIXED_PRICE_INFO.title} description={FIXED_PRICE_INFO.description} variant="green" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {slots.map((slot, index) => (
                    <FixedPriceSlotCard key={slot.id} slot={slot} index={index} onBuy={onBuy} />
                ))}
            </div>
        </div>
    );
}
