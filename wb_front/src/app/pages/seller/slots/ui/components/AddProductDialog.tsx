import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/entities/ui/dialog";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { SelectedSlotInfo, ProductData, SellerCatalogProduct } from "../../types";
import { formatPrice } from "../../lib/helpers";

interface AddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedSlot: SelectedSlotInfo | null;
    bidAmount: number;
    productData: ProductData;
    sellerProducts: SellerCatalogProduct[];
    selectedProductId: string;
    onBidAmountChange: (amount: number) => void;
    onProductDataChange: (data: ProductData) => void;
    onSelectedProductIdChange: (productId: string) => void;
    onImageUpload: (file: File | null) => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
}

export function AddProductDialog({
    open,
    onOpenChange,
    selectedSlot,
    bidAmount,
    productData,
    sellerProducts,
    selectedProductId,
    onBidAmountChange,
    onProductDataChange,
    onSelectedProductIdChange,
    onImageUpload,
    onConfirm,
    isSubmitting,
}: AddProductDialogProps) {
    if (!selectedSlot) return null;

    const totalPrice = selectedSlot.price || bidAmount || 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Добавление товара - Позиция #{selectedSlot.position}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Информация о слоте */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Стоимость слота:</span>
                            <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
                        </div>
                        {selectedSlot.bidStep && (
                            <div className="mt-2">
                                <Label htmlFor="bid-amount">Ваша ставка (₽)</Label>
                                <Input
                                    id="bid-amount"
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => onBidAmountChange(Number(e.target.value))}
                                    min={selectedSlot.minBid}
                                    step={selectedSlot.bidStep}
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Минимум: {selectedSlot.minBid} ₽, Шаг: {selectedSlot.bidStep} ₽
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Форма товара */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="seller-product">Товар продавца</Label>
                            <Select value={selectedProductId} onValueChange={onSelectedProductIdChange}>
                                <SelectTrigger id="seller-product" className="mt-1">
                                    <SelectValue placeholder="Выберите товар из каталога" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sellerProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="product-price">Цена товара (₽)</Label>
                                <Input
                                    id="product-price"
                                    type="number"
                                    value={productData.price}
                                    placeholder="0"
                                    className="mt-1"
                                    readOnly
                                />
                            </div>

                            <div>
                                <Label htmlFor="product-discount">Скидка (%)</Label>
                                <Input
                                    id="product-discount"
                                    type="number"
                                    value={productData.discount}
                                    className="mt-1"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="product-name">Название товара</Label>
                            <Input id="product-name" value={productData.name} className="mt-1" readOnly />
                        </div>
                    </div>

                    {/* Итого */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Итого к оплате:</span>
                            <span className="text-2xl font-bold text-purple-600">{formatPrice(totalPrice)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Отмена
                            </Button>
                            <Button
                                onClick={onConfirm}
                                disabled={!selectedProductId || !productData.name || !productData.price || isSubmitting}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            >
                                {isSubmitting ? "Отправка..." : "Подтвердить и оплатить"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
