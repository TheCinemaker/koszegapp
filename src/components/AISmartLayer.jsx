import React, { useContext } from "react";
import { AIOrchestratorContext } from "../contexts/AIOrchestratorContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function AISmartLayer() {
    const { suggestion, dismiss } = useContext(AIOrchestratorContext);

    if (!suggestion) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-28 right-6 z-[9990]" // z-index lower than chat bubble (9998)
            >
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 px-4 py-3 max-w-xs ring-1 ring-black/5">
                    <p className="text-sm mb-3 font-medium text-gray-800 dark:text-gray-200">{suggestion.text}</p>
                    <div className="flex justify-between items-center gap-4">
                        <button
                            onClick={suggestion.action}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition"
                        >
                            Mutasd
                        </button>
                        <button
                            onClick={dismiss}
                            className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
