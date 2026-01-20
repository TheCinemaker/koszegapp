import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 6. Final "Essence" Script
        const sequence = [
            { delay: 1000, step: 1 },  // "A város, amit ismersz..."
            { delay: 4500, step: 2 },  // "...tele van titkokkal."
            { delay: 8000, step: 3 },  // "Lépj át az időkapun." (Mechanika)
            { delay: 12000, step: 4 }, // "Keresd a jeleket." (Gameplay)
            { delay: 16000, step: 5 }, // "Hallgasd a falakat." (Story)
            { delay: 20000, step: 6 }, // "Éld át az ostromot." (Téma)
            { delay: 26000, step: 7 }, // TITLE: 1532
            { delay: 29000, step: 8 }, // SUBTITLE
            { delay: 33000, step: 9 }, // HUGE COMING SOON
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // Stable, Slow Fade Variant (NO BLINKING)
    const stableVariant = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
        transition: { duration: 1.5, ease: "easeOut" }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden z-[9999]">

            {/* Subtle Texture - Static, NO PULSE */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000000_100%)] z-0" />

            {/* Content Layer */}
            <div className="relative z-20 w-full max-w-xl px-6 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode='wait'>

                    {/* S1 */}
                    {step === 1 && (
                        <motion.div key="s1" {...stableVariant}>
                            <p className="text-3xl font-serif text-neutral-400 font-light">
                                A város, amit ismersz...
                            </p>
                        </motion.div>
                    )}

                    {/* S2 */}
                    {step === 2 && (
                        <motion.div key="s2" {...stableVariant}>
                            <p className="text-4xl font-serif text-white font-light">
                                ...tele van titkokkal.
                            </p>
                        </motion.div>
                    )}

                    {/* S3 */}
                    {step === 3 && (
                        <motion.div key="s3" {...stableVariant}>
                            <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-4 rounded-lg">
                                <p className="text-2xl font-light text-amber-100 font-sans tracking-wide">
                                    Lépj át az időkapun.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* S4 */}
                    {step === 4 && (
                        <motion.div key="s4" {...stableVariant}>
                            <p className="text-3xl font-serif text-neutral-200">
                                Keresd a jeleket.
                            </p>
                        </motion.div>
                    )}

                    {/* S5 */}
                    {step === 5 && (
                        <motion.div key="s5" {...stableVariant}>
                            <p className="text-3xl font-serif text-neutral-300 italic">
                                "Hallgasd a falakat."
                            </p>
                        </motion.div>
                    )}

                    {/* S6 */}
                    {step === 6 && (
                        <motion.div key="s6" {...stableVariant}>
                            <p className="text-4xl font-serif text-red-100 font-bold tracking-widest uppercase">
                                Éld át az ostromot.
                            </p>
                        </motion.div>
                    )}

                    {/* THE FINALE (7, 8, 9) */}
                    {step >= 7 && (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-16">

                            {/* 1532 - STABLE, NO FLICKER */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 2.5, ease: 'easeOut' }}
                                className="relative z-30"
                            >
                                <h1 className="text-[120px] sm:text-[160px] leading-none font-serif font-bold text-white tracking-tighter">
                                    1532
                                </h1>
                            </motion.div>

                            {/* SUBTITLE */}
                            {step >= 8 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1.5 }}
                                    className="mt-6"
                                >
                                    <p className="text-lg sm:text-xl text-amber-500 font-medium uppercase tracking-[0.2em]">
                                        Van, amit falak tudnak
                                    </p>
                                </motion.div>
                            )}

                            {/* COMING SOON - HUGE & VISIBLE */}
                            {step >= 9 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="mt-16 bg-white/5 border border-white/10 px-8 py-4 rounded-xl backdrop-blur-sm"
                                >
                                    <p className="text-4xl sm:text-5xl font-serif font-bold text-white tracking-widest uppercase drop-shadow-xl">
                                        HAMAROSAN
                                    </p>
                                    <p className="text-xs text-neutral-400 font-sans tracking-[0.5em] mt-2 uppercase text-center">
                                        2025 tavasz
                                    </p>
                                </motion.div>
                            )}

                        </div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
