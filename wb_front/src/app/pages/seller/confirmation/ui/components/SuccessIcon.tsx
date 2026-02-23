import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

export function SuccessIcon() {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block"
        >
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
        </motion.div>
    );
}
