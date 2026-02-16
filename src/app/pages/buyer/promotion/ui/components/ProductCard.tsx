import { motion } from "motion/react";
import { Card } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Badge } from "@/app/entities/ui/badge";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import { Product } from "../../types";
import { formatPrice } from "../../lib/helpers";

interface ProductCardProps {
    product: Product;
    isFavorite: boolean;
    index: number;
    onFavoriteToggle: (id: number) => void;
    onClick: (product: Product) => void;
    onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, isFavorite, index, onFavoriteToggle, onClick, onAddToCart }: ProductCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card
                className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onClick(product)}
            >
                <div className="relative">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-indigo-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {product.badge}
                        </Badge>
                    )}
                    {product.discount && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                            -{product.discount}%
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavoriteToggle(product.id);
                        }}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                    </Button>
                </div>

                <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
                        {product.oldPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.oldPrice)}
                            </span>
                        )}
                    </div>
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                        }}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />В корзину
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
