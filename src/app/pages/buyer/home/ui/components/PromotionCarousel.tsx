import { motion } from "motion/react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/app/entities/ui/carousel";
import { Button } from "@/app/entities/ui/button";
import { Star, Sparkles } from "lucide-react";
import { Promotion } from "../../types";

interface PromotionCarouselProps {
    promotions: Promotion[];
    abIndex: number;
    isHovering: boolean;
    onHoverChange: (hovering: boolean) => void;
    onPromotionClick: (segment: string) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function PromotionCarousel({
    promotions,
    abIndex,
    isHovering,
    onHoverChange,
    onPromotionClick,
    onNext,
    onPrev,
}: PromotionCarouselProps) {
    return (
        <div className="max-w-4xl mx-auto">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent onMouseEnter={() => onHoverChange(true)} onMouseLeave={() => onHoverChange(false)}>
                    {promotions.map((promo, index) => (
                        <CarouselItem key={promo.id}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${promo.gradient} p-8 md:p-12 cursor-pointer group`}
                                onClick={() => onPromotionClick(promo.segment)}
                            >
                                {/* Анимированные звёзды на фоне */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            initial={{
                                                x: Math.random() * 100 + "%",
                                                y: Math.random() * 100 + "%",
                                                opacity: 0,
                                            }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: i * 0.2,
                                            }}
                                        >
                                            <Star className="w-4 h-4 text-white/50" />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="relative z-10 text-white">
                                    <h3 className="text-3xl md:text-4xl mb-2">{promo.title}</h3>
                                    <p className="text-lg md:text-xl mb-6 opacity-90">
                                        {promo.subtitleVariants[abIndex]}
                                    </p>
                                    <Button
                                        size="lg"
                                        className="relative bg-white text-purple-600 hover:bg-white/90 group-hover:scale-105 transition-transform overflow-hidden"
                                    >
                                        <span className="relative z-10">Открыть подборку</span>
                                        <Sparkles className="w-4 h-4 ml-2 relative z-10" />
                                        <span
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                background:
                                                    "radial-gradient(closest-side, rgba(255,255,255,0.7), transparent)",
                                                animation: "glitter 1.2s linear infinite",
                                            }}
                                        />
                                    </Button>
                                </div>
                            </motion.div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious onClick={onPrev} />
                <CarouselNext onClick={onNext} />
            </Carousel>
        </div>
    );
}
