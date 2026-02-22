export type PricingType = "auction" | "fixed";
export type SlotStatus = "available" | "occupied";

export interface AuctionSlot {
    id: number;
    position: number;
    currentBid: number;
    minBid: number;
    bidStep: number;
    timeLeft: string;
    topBidder: string | null;
}

export interface FixedPriceSlot {
    id: number;
    position: number;
    price: number;
    status: SlotStatus;
}

export type Slot = AuctionSlot | FixedPriceSlot;

export interface ProductData {
    name: string;
    price: number;
    discount: number;
    image: File | null;
}

export interface SelectedSlotInfo {
    position: number;
    price: number;
    minBid?: number;
    bidStep?: number;
}
