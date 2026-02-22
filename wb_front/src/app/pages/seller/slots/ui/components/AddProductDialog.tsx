import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/entities/ui/dialog";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Slider } from "@/app/entities/ui/slider";
import { Upload } from "lucide-react";
import { SelectedSlotInfo, ProductData } from "../../types";
import { formatPrice } from "../../lib/helpers";
import { DISCOUNT_SLIDER_CONFIG } from "../../constants";

interface AddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedSlot: SelectedSlotInfo | null;
    bidAmount: number;
    productData: ProductData;
    onBidAmountChange: (amount: number) => void;
    onProductDataChange: (data: ProductData) => void;
    onImageUpload: (file: File | null) => void;
    onConfirm: () => void;
}

export function AddProductDialog({
    open,
    onOpenChange,
    selectedSlot,
    bidAmount,
    productData,
    onBidAmountChange,
    onProductDataChange,
    onImageUpload,
    onConfirm,
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
                            <Label htmlFor="product-name">Название товара</Label>
                            <Input
                                id="product-name"
                                value={productData.name}
                                onChange={(e) => onProductDataChange({ ...productData, name: e.target.value })}
                                placeholder="Введите название товара"
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="product-price">Цена товара (₽)</Label>
                                <Input
                                    id="product-price"
                                    type="number"
                                    value={productData.price}
                                    onChange={(e) =>
                                        onProductDataChange({ ...productData, price: Number(e.target.value) })
                                    }
                                    placeholder="0"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="product-discount">Скидка (%)</Label>
                                <div className="mt-1 space-y-2">
                                    <Slider
                                        id="product-discount"
                                        value={[productData.discount]}
                                        onValueChange={([value]) =>
                                            onProductDataChange({ ...productData, discount: value })
                                        }
                                        {...DISCOUNT_SLIDER_CONFIG}
                                    />
                                    <div className="text-center text-sm font-medium">{productData.discount}%</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="product-image">Изображение товара</Label>
                            <div className="mt-1">
                                <label
                                    htmlFor="product-image"
                                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                                >
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {productData.image ? productData.image.name : "Нажмите для загрузки"}
                                        </span>
                                    </div>
                                    <input
                                        id="product-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => onImageUpload(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
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
                                disabled={!productData.name || !productData.price}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            >
                                Подтвердить и оплатить
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
