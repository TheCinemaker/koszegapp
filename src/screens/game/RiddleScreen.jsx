import React from 'react';
import { motion } from 'framer-motion';

export default function RiddleScreen({ riddleText, onConfirm }) {
    const year = 1532;

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

            {/* ===== ÉVSZÁM – SOFTSTART STÍLUS (15% FIX, SERIF) ===== */}
            <div className="absolute top-[15%] left-0 right-0 flex justify-center pointer-events-none">
                <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70">
                    {year}
                </div>
            </div>

            {/* ===== TARTALMI RÉTEG ===== */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[32vh] space-y-10 text-center">

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className="space-y-6"
                >
                    <p className="text-sm text-white/40 font-mono uppercase tracking-widest">
                        Új Nyom
                    </p>

                    <h2 className="text-2xl md:text-3xl font-serif italic text-white/90 leading-relaxed px-4">
                        "{riddleText || "Figyelj a városra."}"
                    </h2>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    onClick={onConfirm}
                    className="
                        mt-16
                        text-xs
                        uppercase
                        tracking-[0.4em]
                        text-blue-300
                        opacity-60
                        hover:opacity-100
                        transition-opacity
                        border-b border-transparent
                        hover:border-blue-300/30
                        pb-2
                    "
                >
                    Megértettem →
                </motion.button>
            </div>
        </div>
    );
}
