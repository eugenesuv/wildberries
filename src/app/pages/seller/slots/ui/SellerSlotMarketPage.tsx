import { motion } from "motion/react";
import { Tabs, TabsContent } from "@/app/entities/ui/tabs";
import { useSellerSlotMarket } from "../lib/useSellerSlotMarket";
import { SlotMarketHeader } from "./components/SlotMarketHeader";
import { PricingTabs } from "./components/PricingTabs";
import { AuctionSlotsGrid } from "./components/AuctionSlotsGrid";
import { FixedPriceSlotsGrid } from "./components/FixedPriceSlotsGrid";
import { AddProductDialog } from "./components/AddProductDialog";

export function SellerSlotMarketPage() {
    const {
        segment,
        auctionSlots,
        fixedPriceSlots,
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
    } = useSellerSlotMarket();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <SlotMarketHeader segment={segment} onGoBack={handleGoBack} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as "auction" | "fixed")}
                        className="space-y-6"
                    >
                        <PricingTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        <TabsContent value="auction" className="mt-6">
                            <AuctionSlotsGrid slots={auctionSlots} onBid={handleBid} />
                        </TabsContent>

                        <TabsContent value="fixed" className="mt-6">
                            <FixedPriceSlotsGrid slots={fixedPriceSlots} onBuy={handleBuyFixed} />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>

            <AddProductDialog
                open={showConfirmDialog}
                onOpenChange={handleCloseDialog}
                selectedSlot={selectedSlot}
                bidAmount={bidAmount}
                productData={productData}
                onBidAmountChange={setBidAmount}
                onProductDataChange={setProductData}
                onImageUpload={handleImageUpload}
                onConfirm={handleConfirmPurchase}
            />
        </div>
    );
}
