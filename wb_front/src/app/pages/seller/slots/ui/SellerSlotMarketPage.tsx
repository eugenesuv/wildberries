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
    } = useSellerSlotMarket();

    const showAuctionTab = auctionSlots.length > 0;
    const showFixedTab = fixedPriceSlots.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <SlotMarketHeader segment={segment} onGoBack={handleGoBack} />

            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {hasError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {hasError}
                        </div>
                    )}
                    {isLoading && <div className="mb-4 text-sm text-muted-foreground">Загрузка слотов...</div>}
                    {!isLoading && !showAuctionTab && !showFixedTab && (
                        <div className="mb-4 text-sm text-muted-foreground">В этом сегменте пока нет доступных слотов</div>
                    )}
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as "auction" | "fixed")}
                        className="space-y-6"
                    >
                        <PricingTabs
                            activeTab={activeTab}
                            showAuction={showAuctionTab}
                            showFixed={showFixedTab}
                            onTabChange={setActiveTab}
                        />

                        {showAuctionTab && (
                            <TabsContent value="auction" className="mt-6">
                                <AuctionSlotsGrid slots={auctionSlots} onBid={handleBid} />
                            </TabsContent>
                        )}

                        {showFixedTab && (
                            <TabsContent value="fixed" className="mt-6">
                                <FixedPriceSlotsGrid slots={fixedPriceSlots} onBuy={handleBuyFixed} />
                            </TabsContent>
                        )}
                    </Tabs>
                </motion.div>
            </div>

            <AddProductDialog
                open={showConfirmDialog}
                onOpenChange={handleCloseDialog}
                selectedSlot={selectedSlot}
                bidAmount={bidAmount}
                productData={productData}
                sellerProducts={sellerProducts}
                selectedProductId={selectedProductId}
                onBidAmountChange={setBidAmount}
                onProductDataChange={setProductData}
                onSelectedProductIdChange={setSelectedProductId}
                onImageUpload={handleImageUpload}
                onConfirm={handleConfirmPurchase}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
