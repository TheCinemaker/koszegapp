import React from 'react';
import { motion } from 'framer-motion';

export default function IntroScreen({ onStart }) {
    // Évszám (Statikus vagy dinamikus is lehetne, de a 1532 a 'branding')
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
                    className="space-y-4"
                >
                    <p className="text-sm text-white/40 font-mono uppercase tracking-widest">
                        A város zaja tompul.
                    </p>

                    <h2 className="text-3xl font-serif text-white/90 leading-tight">
                        Megállsz.
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                    className="mt-4 text-white/60 leading-relaxed font-light max-w-xs"
                >
                    <p>
                        Az idő nem előre halad.
                    </p>
                    <p className="mt-4 font-serif italic text-white/80">
                        Hanem megnyílik.
                    </p>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    onClick={onStart}
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
                    Belépek →
                </motion.button>

            </div>
        </div>
    );
}
