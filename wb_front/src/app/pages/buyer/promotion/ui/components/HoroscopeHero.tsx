import { motion } from "motion/react";
import { Badge } from "@/app/entities/ui/badge";
import { Star, Sparkles, TrendingUp } from "lucide-react";
import { HoroscopeData } from "../../types";
import { generateStars } from "../../lib/helpers";

interface HoroscopeHeroProps {
    horoscope: HoroscopeData;
}

export function HoroscopeHero({ horoscope }: HoroscopeHeroProps) {
    const stars = generateStars(30);

    return (
        <section className={`relative overflow-hidden bg-gradient-to-r ${horoscope.gradient} text-white`}>
            {/* Анимированный фон со звёздами */}
            <div className="absolute inset-0 overflow-hidden">
                {stars.map((star) => (
                    <motion.div
                        key={star.id}
                        className="absolute"
                        initial={{
                            x: star.x + "%",
                            y: star.y + "%",
                            opacity: 0,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: star.delay,
                        }}
                    >
                        <Sparkles className="w-6 h-6 text-white/30" />
                    </motion.div>
                ))}
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Star className="w-8 h-8" />
                        <h1 className="text-4xl md:text-5xl">{horoscope.title}</h1>
                        <Star className="w-8 h-8" />
                    </div>
                    <p className="text-xl md:text-2xl mb-6 opacity-90">{horoscope.prediction}</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Badge variant="secondary" className="text-base px-4 py-2">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Категория: {horoscope.recommendedCategory}
                        </Badge>
                        <Badge variant="secondary" className="text-base px-4 py-2">
                            Счастливый цвет: {horoscope.luckyColor}
                        </Badge>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
