import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AuctionSlot, FixedPriceSlot, ProductData, SelectedSlotInfo, PricingType } from "../types";
import { AUCTION_SLOTS, FIXED_PRICE_SLOTS } from "../constants";

export const useSellerSlotMarket = () => {
    const navigate = useNavigate();
    const { actionId, segment } = useParams<{ actionId: string; segment: string }>();

    const [selectedSlot, setSelectedSlot] = useState<SelectedSlotInfo | null>(null);
    const [bidAmount, setBidAmount] = useState(0);
    const [productData, setProductData] = useState<ProductData>({
        name: "",
        price: 0,
        discount: 10,
        image: null,
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<PricingType>("auction");

    const handleBid = (slot: AuctionSlot) => {
        setSelectedSlot({
            position: slot.position,
            price: slot.minBid,
            minBid: slot.minBid,
            bidStep: slot.bidStep,
        });
        setBidAmount(slot.minBid);
        setShowConfirmDialog(true);
    };

    const handleBuyFixed = (slot: FixedPriceSlot) => {
        if (slot.status === "occupied") return;

        setSelectedSlot({
            position: slot.position,
            price: slot.price,
        });
        setShowConfirmDialog(true);
    };

    const handleConfirmPurchase = () => {
        // Здесь будет логика отправки заявки
        setShowConfirmDialog(false);
        navigate("/seller/confirmation");
    };

    const handleCloseDialog = () => {
        setShowConfirmDialog(false);
        setSelectedSlot(null);
        setBidAmount(0);
        setProductData({
            name: "",
            price: 0,
            discount: 10,
            image: null,
        });
    };

    const handleImageUpload = (file: File | null) => {
        setProductData({ ...productData, image: file });
    };

    const handleGoBack = () => {
        navigate(`/seller/actions/${actionId}/segments`);
    };

    return {
        actionId,
        segment,
        auctionSlots: AUCTION_SLOTS,
        fixedPriceSlots: FIXED_PRICE_SLOTS,
        selectedSlot,
        bidAmount,
        productData,
        showConfirmDialog,
        activeTab,
        setActiveTab,
        setBidAmount,
        setProductData,
        handleBid,
        handleBuyFixed,
        handleConfirmPurchase,
        handleCloseDialog,
        handleImageUpload,
        handleGoBack,
    };
};
