import { useMemo } from "react";

import { motion } from "motion/react";
import { Badge } from "@/app/entities/ui/badge";
import { Star, TrendingUp } from "lucide-react";
import { HoroscopeData } from "../../types";

interface HoroscopeHeroProps {
    horoscope: HoroscopeData;
}

export function HoroscopeHero({ horoscope }: HoroscopeHeroProps) {
    const stars = useMemo(
        () =>
            [...Array(30)].map(() => ({
                left: Math.random() * 100,
                top: Math.random() * 100,
            })),
        [],
    );

    return (
        <section className={`relative overflow-hidden bg-gradient-to-r ${horoscope.gradient} text-white`}>
            {/* Анимированный фон со звёздами */}
            <div className="absolute inset-0 overflow-hidden">
                {stars.map((pos, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${pos.left}%`,
                            top: `${pos.top}%`,
                        }}
                        initial={{
                            opacity: 0,
                            scale: 0,
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
