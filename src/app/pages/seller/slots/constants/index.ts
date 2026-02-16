import { AuctionSlot, FixedPriceSlot } from "../types";

export const AUCTION_SLOTS: AuctionSlot[] = [
    {
        id: 1,
        position: 1,
        currentBid: 5000,
        minBid: 5500,
        bidStep: 500,
        timeLeft: "2ч 45м",
        topBidder: "Продавец #123",
    },
    {
        id: 2,
        position: 2,
        currentBid: 3500,
        minBid: 4000,
        bidStep: 500,
        timeLeft: "2ч 45м",
        topBidder: "Продавец #456",
    },
    {
        id: 3,
        position: 3,
        currentBid: 2000,
        minBid: 2500,
        bidStep: 500,
        timeLeft: "2ч 45м",
        topBidder: null,
    },
];

export const FIXED_PRICE_SLOTS: FixedPriceSlot[] = [
    { id: 4, position: 4, price: 3000, status: "available" },
    { id: 5, position: 5, price: 2500, status: "available" },
    { id: 6, position: 6, price: 2000, status: "occupied" },
    { id: 7, position: 7, price: 1500, status: "available" },
    { id: 8, position: 8, price: 1500, status: "available" },
    { id: 9, position: 9, price: 1000, status: "available" },
    { id: 10, position: 10, price: 1000, status: "occupied" },
];

export const AUCTION_INFO = {
    title: "Как работает аукцион?",
    description: "Делайте ставки на топовые позиции. Победитель определяется по окончанию времени аукциона.",
};

export const FIXED_PRICE_INFO = {
    title: "Фиксированная цена",
    description: "Оплатите фиксированную стоимость и получите слот мгновенно.",
};

export const DISCOUNT_SLIDER_CONFIG = {
    min: 0,
    max: 90,
    step: 5,
} as const;
