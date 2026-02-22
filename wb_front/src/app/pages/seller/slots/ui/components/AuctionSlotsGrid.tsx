import { AuctionSlot } from "../../types";
import { AuctionSlotCard } from "./AuctionSlotCard";
import { InfoBanner } from "./InfoBanner";
import { AUCTION_INFO } from "../../constants";

interface AuctionSlotsGridProps {
    slots: AuctionSlot[];
    onBid: (slot: AuctionSlot) => void;
}

export function AuctionSlotsGrid({ slots, onBid }: AuctionSlotsGridProps) {
    return (
        <div className="space-y-6">
            <InfoBanner title={AUCTION_INFO.title} description={AUCTION_INFO.description} variant="blue" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot, index) => (
                    <AuctionSlotCard key={slot.id} slot={slot} index={index} onBid={onBid} />
                ))}
            </div>
        </div>
    );
}
