import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 5. Mystic / Provocative Script
        const sequence = [
            { delay: 1000, step: 1 },  // "A történelemkönyvek..."
            { delay: 4000, step: 2 },  // "...hallgatnak." (vagy hazudnak?) -> Hallgatnak sejtelmesebb.
            { delay: 8000, step: 3 },  // "Azt hiszed, a múlt elmúlt?"
            { delay: 14000, step: 4 }, // "Tévedsz."
            { delay: 18000, step: 5 }, // "A kövek figyelnek."
            { delay: 24000, step: 6 }, // "És van egy titok..."
            { delay: 30000, step: 7 }, // "...ami most ébren van."
            { delay: 36000, step: 8 }, // TITLE: 1532
            { delay: 39000, step: 9 }, // SUBTITLE: Van, amit csak a falak tudnak
            { delay: 44000, step: 10 }, // COMING SOON
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // Mystic Blur-In Variant
    const mysticVariant = {
        initial: { opacity: 0, scale: 0.95, filter: 'blur(8px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.05, filter: 'blur(12px)' },
        transition: { duration: 2.0, ease: "easeInOut" }
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden z-[9999]">

            {/* Fog / Smoke Overlay Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-10 animate-pulse pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] z-10 opacity-90" />

            {/* Content Layer */}
            <div className="relative z-20 w-full max-w-xl px-8 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode='wait'>

                    {/* S1 */}
                    {step === 1 && (
                        <motion.div key="s1" {...mysticVariant}>
                            <p className="text-2xl font-serif text-neutral-500 font-light tracking-widest uppercase">
                                A történelemkönyvek
                            </p>
                        </motion.div>
                    )}

                    {/* S2 */}
                    {step === 2 && (
                        <motion.div key="s2" {...mysticVariant}>
                            <p className="text-4xl font-serif text-white font-light tracking-widest uppercase">
                                Hallgatnak.
                            </p>
                        </motion.div>
                    )}

                    {/* S3 */}
                    {step === 3 && (
                        <motion.div key="s3" {...mysticVariant}>
                            <p className="text-3xl font-light text-neutral-300 font-serif leading-relaxed">
                                "Azt hiszed, a múlt elmúlt?"
                            </p>
                        </motion.div>
                    )}

                    {/* S4 */}
                    {step === 4 && (
                        <motion.div key="s4" {...mysticVariant}>
                            <p className="text-5xl font-serif text-red-900/80 font-bold tracking-widest drop-shadow-lg">
                                TÉVEDSZ.
                            </p>
                        </motion.div>
                    )}

                    {/* S5 */}
                    {step === 5 && (
                        <motion.div key="s5" {...mysticVariant}>
                            <p className="text-2xl font-light text-neutral-400 font-sans tracking-[0.2em] uppercase">
                                A kövek figyelnek.
                            </p>
                        </motion.div>
                    )}

                    {/* S6 */}
                    {step === 6 && (
                        <motion.div key="s6" {...mysticVariant}>
                            <p className="text-3xl font-serif text-neutral-300 font-light">
                                Van egy titok...
                            </p>
                        </motion.div>
                    )}

                    {/* S7 */}
                    {step === 7 && (
                        <motion.div key="s7" {...mysticVariant}>
                            <p className="text-4xl font-serif text-amber-500/80 font-italic">
                                ...ami most ébred.
                            </p>
                        </motion.div>
                    )}

                    {/* THE BRAND REVEAL (8, 9, 10) */}
                    {step >= 8 && (
                        <div className="flex flex-col items-center justify-center space-y-6">

                            {/* 1532 */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 3, ease: 'easeOut' }}
                            >
                                <h1 className="text-[110px] sm:text-[140px] leading-[0.8] font-serif font-bold text-white tracking-tighter mix-blend-overlay">
                                    1532
                                </h1>
                            </motion.div>

                            {/* SUBTITLE */}
                            {step >= 9 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 2 }}
                                    className="relative"
                                >
                                    <p className="text-sm sm:text-lg text-amber-500/90 uppercase tracking-[0.2em] font-medium max-w-xs mx-auto leading-relaxed">
                                        Van, amit csak a falak tudnak
                                    </p>
                                </motion.div>
                            )}

                            {/* COMING SOON (LATE) */}
                            {step >= 10 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ duration: 3, delay: 1 }}
                                    className="pt-16"
                                >
                                    <p className="text-xs text-white/40 tracking-[0.5em] font-sans uppercase">
                                        Coming Soon
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
