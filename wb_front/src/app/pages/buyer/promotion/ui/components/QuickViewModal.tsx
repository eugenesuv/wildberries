import { Button } from "@/app/entities/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { Product } from "../../types";
import { formatPrice } from "../../lib/helpers";

interface QuickViewModalProps {
    product: Product | null;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
}

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
    if (!product) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-medium">Быстрый просмотр</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded" />
                    <div>
                        <h4 className="text-xl font-semibold mb-2">{product.name}</h4>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
                            {product.oldPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.oldPrice)}
                                </span>
                            )}
                        </div>
                        <Button className="w-full" onClick={() => onAddToCart(product)}>
                            <ShoppingCart className="w-4 h-4 mr-2" />В корзину на WB
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
