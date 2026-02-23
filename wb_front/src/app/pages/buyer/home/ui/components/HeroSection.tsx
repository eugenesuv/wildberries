import { motion } from "motion/react";

export function HeroSection() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="text-4xl mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Твоя неделя в товарах
            </h2>
            <p className="text-lg text-muted-foreground">Персонализированные предложения на основе твоего гороскопа</p>
        </motion.div>
    );
}
