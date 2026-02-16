import { AuctionSlot, FixedPriceSlot } from "../types";

export const formatPrice = (price: number): string => {
    return `${price.toLocaleString("ru-RU")} ₽`;
};

export const isAuctionSlot = (slot: any): slot is AuctionSlot => {
    return "currentBid" in slot && "bidStep" in slot;
};

export const isFixedPriceSlot = (slot: any): slot is FixedPriceSlot => {
    return "price" in slot && "status" in slot;
};

export const calculateMinBid = (slot: AuctionSlot): number => {
    return Math.max(slot.minBid, slot.currentBid + slot.bidStep);
};

export const validateBid = (bid: number, slot: AuctionSlot): boolean => {
    return bid >= slot.minBid && (bid - slot.minBid) % slot.bidStep === 0;
};

export const getSlotPrice = (slot: AuctionSlot | FixedPriceSlot): number => {
    if (isAuctionSlot(slot)) {
        return slot.minBid;
    }
    return slot.price;
};
