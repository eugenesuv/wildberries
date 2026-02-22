import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { sellerClient } from "@/app/shared/api/clients/seller.client";
import { DEFAULT_SELLER_ID } from "@/app/shared/api/config";
import { AuctionSlot, FixedPriceSlot, ProductData, SelectedSlotInfo, PricingType, SellerCatalogProduct } from "../types";

const EMPTY_PRODUCT_DATA: ProductData = {
    name: "",
    price: 0,
    discount: 10,
    image: null,
};

const mapAuctionSlot = (slot: {
    slotId: number;
    position: number;
    currentBid: number;
    minBid: number;
    bidStep: number;
    timeLeft: string;
    topBidderName?: string;
}): AuctionSlot => ({
    id: Number(slot.slotId),
    position: Number(slot.position),
    currentBid: Number(slot.currentBid || 0),
    minBid: Number(slot.minBid || 0),
    bidStep: Number(slot.bidStep || 0),
    timeLeft: slot.timeLeft || "0ч 0м",
    topBidder: slot.topBidderName || null,
});

const mapFixedSlot = (slot: { slotId: number; position: number; price: number; status: "available" | "occupied" }): FixedPriceSlot => ({
    id: Number(slot.slotId),
    position: Number(slot.position),
    price: Number(slot.price || 0),
    status: slot.status,
});

const mapCatalogProduct = (item: {
    id: string;
    name: string;
    price: string;
    discount: number;
    image: string;
    categoryName: string;
}): SellerCatalogProduct => ({
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    discount: Number(item.discount || 0),
    image: item.image || "",
    categoryName: item.categoryName || "",
});

export const useSellerSlotMarket = () => {
    const navigate = useNavigate();
    const { actionId, segment } = useParams<{ actionId: string; segment: string }>();

    const [segmentLabel, setSegmentLabel] = useState(segment || "");
    const [actionName, setActionName] = useState(actionId ? `Акция #${actionId}` : "Акция");
    const [auctionSlots, setAuctionSlots] = useState<AuctionSlot[]>([]);
    const [fixedPriceSlots, setFixedPriceSlots] = useState<FixedPriceSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlotInfo | null>(null);
    const [bidAmount, setBidAmount] = useState(0);
    const [productData, setProductData] = useState<ProductData>(EMPTY_PRODUCT_DATA);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<PricingType>("auction");
    const [sellerProducts, setSellerProducts] = useState<SellerCatalogProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        if (!actionId || !segment) {
            return;
        }

        let mounted = true;

        const loadMarket = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const [slotsResponse, productsResponse, segmentsResponse, actionsResponse] = await Promise.all([
                    sellerClient.getSegmentSlots(Number(actionId), Number(segment)),
                    sellerClient.listProductsBy({ sellerId: DEFAULT_SELLER_ID, perPage: 100, page: 1 }),
                    sellerClient.getActionSegments(Number(actionId)),
                    sellerClient.getSellerActions(DEFAULT_SELLER_ID),
                ]);

                if (!mounted) {
                    return;
                }

                setAuctionSlots((slotsResponse.auction || []).map(mapAuctionSlot));
                setFixedPriceSlots((slotsResponse.fixed || []).map(mapFixedSlot));

                const products = (productsResponse.items || []).map(mapCatalogProduct);
                setSellerProducts(products);
                setSelectedProductId((prev) => prev || products[0]?.id || "");

                const currentSegment = (segmentsResponse.actionSegments || []).find((item) => String(item.id) === segment);
                if (currentSegment?.name) {
                    setSegmentLabel(currentSegment.name);
                }

                const currentAction = (actionsResponse.actions || []).find((item) => item.id === actionId);
                if (currentAction?.name) {
                    setActionName(currentAction.name);
                }
            } catch (error) {
                if (!mounted) {
                    return;
                }

                setHasError("Не удалось загрузить рынок слотов");
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadMarket();

        return () => {
            mounted = false;
        };
    }, [actionId, segment]);

    const selectedCatalogProduct = useMemo(
        () => sellerProducts.find((product) => product.id === selectedProductId) || null,
        [sellerProducts, selectedProductId],
    );

    useEffect(() => {
        if (!selectedCatalogProduct) {
            setProductData(EMPTY_PRODUCT_DATA);
            return;
        }

        setProductData({
            name: selectedCatalogProduct.name,
            price: selectedCatalogProduct.price,
            discount: selectedCatalogProduct.discount,
            image: null,
        });
    }, [selectedCatalogProduct]);

    const handleBid = (slot: AuctionSlot) => {
        setActiveTab("auction");
        setSelectedSlot({
            slotId: slot.id,
            pricingType: "auction",
            position: slot.position,
            price: slot.minBid,
            minBid: slot.minBid,
            bidStep: slot.bidStep,
        });
        setBidAmount(slot.minBid);
        setShowConfirmDialog(true);
        setHasError(null);
    };

    const handleBuyFixed = (slot: FixedPriceSlot) => {
        if (slot.status === "occupied") return;

        setActiveTab("fixed");
        setSelectedSlot({
            slotId: slot.id,
            pricingType: "fixed",
            position: slot.position,
            price: slot.price,
        });
        setShowConfirmDialog(true);
        setHasError(null);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedSlot) {
            return;
        }

        if (!selectedProductId) {
            setHasError("Выберите товар из каталога продавца");
            return;
        }

        if (selectedSlot.pricingType === "auction") {
            if (selectedSlot.minBid && bidAmount < selectedSlot.minBid) {
                setHasError(`Ставка должна быть не меньше ${selectedSlot.minBid} ₽`);
                return;
            }
            if (
                selectedSlot.bidStep &&
                selectedSlot.minBid &&
                (bidAmount - selectedSlot.minBid) % selectedSlot.bidStep !== 0
            ) {
                setHasError(`Шаг ставки должен быть ${selectedSlot.bidStep} ₽`);
                return;
            }
        }

        setIsSubmitting(true);
        setHasError(null);

        try {
            const response = await sellerClient.makeBet({
                sellerId: String(DEFAULT_SELLER_ID),
                slotId: String(selectedSlot.slotId),
                amount: selectedSlot.pricingType === "auction" ? String(bidAmount) : undefined,
                productId: selectedProductId,
            });

            if (!response.success) {
                setHasError(response.message || "Не удалось отправить заявку");
                return;
            }

            setShowConfirmDialog(false);

            navigate("/seller/confirmation", {
                state: {
                    confirmationData: {
                        applicationNumber: `АК-${Date.now()}`,
                        status: "pending",
                        promotionName: actionName,
                        segment: segmentLabel,
                        position: selectedSlot.position,
                        price: selectedSlot.pricingType === "auction" ? bidAmount : selectedSlot.price,
                    },
                },
            });
        } catch (error: any) {
            setHasError(error?.message || "Не удалось отправить заявку");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseDialog = () => {
        setShowConfirmDialog(false);
        setSelectedSlot(null);
        setBidAmount(0);
    };

    const handleImageUpload = (file: File | null) => {
        setProductData((prev) => ({ ...prev, image: file }));
    };

    const handleGoBack = () => {
        navigate(`/seller/actions/${actionId}/segments`);
    };

    return {
        actionId,
        segment: segmentLabel,
        actionName,
        auctionSlots,
        fixedPriceSlots,
        selectedSlot,
        bidAmount,
        productData,
        showConfirmDialog,
        activeTab,
        sellerProducts,
        selectedProductId,
        isLoading,
        isSubmitting,
        hasError,
        setActiveTab,
        setBidAmount,
        setProductData,
        setSelectedProductId,
        handleBid,
        handleBuyFixed,
        handleConfirmPurchase,
        handleCloseDialog,
        handleImageUpload,
        handleGoBack,
    };
};
