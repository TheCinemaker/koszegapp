import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 7. Minimalist & Correct Narrative Script (ALL CAPS)
        const sequence = [
            { delay: 1500, step: 1 },  // A KÖVEK FIGYELNEK
            { delay: 5000, step: 2 },  // A FALAK EMLÉKEZNEK
            { delay: 9000, step: 3 },  // A SZOBROK MESÉLNEK
            { delay: 13000, step: 4 }, // ELMONDJÁK, MIRE EMLÉKEZNEK (vagy TITOK)
            { delay: 18000, step: 5 }, // KERESD A TITKOKAT
            { delay: 24000, step: 6 }, // 1532
            { delay: 28000, step: 7 }, // HAMAROSAN
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // Pure Text Variant - No decorations
    const textVariant = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)' },
        transition: { duration: 2.0, ease: "easeInOut" }
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden z-[9999]">

            {/* Content Layer - CENTERED, PURE TYPOGRAPHY */}
            <div className="relative z-20 w-full max-w-2xl px-6 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode='wait'>

                    {/* S1 */}
                    {step === 1 && (
                        <motion.div key="s1" {...textVariant}>
                            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-widest leading-tight text-neutral-400">
                                A KÖVEK<br /><span className="text-white">FIGYELNEK</span>
                            </h1>
                        </motion.div>
                    )}

                    {/* S2 */}
                    {step === 2 && (
                        <motion.div key="s2" {...textVariant}>
                            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-widest leading-tight text-neutral-400">
                                A FALAK<br /><span className="text-white">EMLÉKEZNEK</span>
                            </h1>
                        </motion.div>
                    )}

                    {/* S3 */}
                    {step === 3 && (
                        <motion.div key="s3" {...textVariant}>
                            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-widest leading-tight text-neutral-400">
                                A SZOBROK<br /><span className="text-white">MESÉLNEK</span>
                            </h1>
                        </motion.div>
                    )}

                    {/* S4 */}
                    {step === 4 && (
                        <motion.div key="s4" {...textVariant}>
                            <p className="text-2xl sm:text-4xl font-light tracking-[0.2em] uppercase leading-relaxed text-neutral-300">
                                ELMONDJÁK,<br />MIRE EMLÉKEZNEK
                            </p>
                        </motion.div>
                    )}

                    {/* S5 */}
                    {step === 5 && (
                        <motion.div key="s5" {...textVariant}>
                            <h1 className="text-5xl sm:text-7xl font-serif font-black tracking-widest text-amber-500/90 uppercase">
                                KERESD<br />A TITKOKAT
                            </h1>
                        </motion.div>
                    )}

                    {/* THE FINALE (6, 7) */}
                    {step >= 6 && (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-10">

                            {/* 1532 */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 2.5, ease: 'easeOut' }}
                            >
                                <h1 className="text-[120px] sm:text-[180px] leading-none font-serif font-bold text-white tracking-tighter">
                                    1532
                                </h1>
                            </motion.div>

                            {/* SUBTITLE */}
                            {step >= 6 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1.5, delay: 1.5 }}
                                    className="mt-4 sm:mt-8"
                                >
                                    <p className="text-sm sm:text-xl text-neutral-400 font-bold uppercase tracking-[0.4em]">
                                        VAN, AMIT CSAK A FALAK TUDNAK
                                    </p>
                                </motion.div>
                            )}

                            {/* HAMAROSAN - HUGE, CLEAN */}
                            {step >= 7 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 2, delay: 0.5 }}
                                    className="mt-20 sm:mt-32"
                                >
                                    <h2 className="text-5xl sm:text-7xl font-sans font-black text-white tracking-widest uppercase">
                                        HAMAROSAN
                                    </h2>
                                </motion.div>
                            )}

                        </div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
