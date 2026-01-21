import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Sequence timing
        const sequence = [
            { t: 1000, s: 1 },  // A KÖVEK FIGYELNEK
            { t: 5000, s: 2 },  // A FALAK EMLÉKEZNEK
            { t: 9000, s: 3 },  // A SZOBROK MESÉLNEK
            { t: 13000, s: 4 }, // TITOK...
            { t: 17000, s: 5 }, // KERESD A TITKOKAT
            { t: 22000, s: 6 }, // 1532 (FINALE STARTS)
        ];

        const timers = sequence.map(e =>
            setTimeout(() => setStep(e.s), e.t)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    // 2. & 3. Static Fade In/Out, No Movement, Sans-Serif
    const textVariant = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.5, ease: "easeIn" } // "Erőből fade in"
        },
        exit: {
            opacity: 0,
            transition: { duration: 1.5, ease: "easeOut" } // "Lassan fade out"
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black text-white flex flex-col items-center justify-center font-sans">

            {/* 1. Black Background (No image, no grain) */}

            <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode="wait">

                    {step === 1 && (
                        <motion.h1 key="s1" {...textVariant}
                            className="text-5xl sm:text-7xl font-bold tracking-wider uppercase text-white">
                            A KÖVEK FIGYELNEK
                        </motion.h1>
                    )}

                    {step === 2 && (
                        <motion.h1 key="s2" {...textVariant}
                            className="text-5xl sm:text-7xl font-bold tracking-wider uppercase text-white">
                            A FALAK EMLÉKEZNEK
                        </motion.h1>
                    )}

                    {step === 3 && (
                        <motion.h1 key="s3" {...textVariant}
                            className="text-5xl sm:text-7xl font-bold tracking-wider uppercase text-white">
                            A SZOBROK MESÉLNEK
                        </motion.h1>
                    )}

                    {/* Keeping logic consistent with previous steps, assuming S4 is a transition text */}
                    {step === 4 && (
                        <motion.h1 key="s4" {...textVariant}
                            className="text-5xl sm:text-7xl font-bold tracking-wider uppercase text-white">
                            ELMONDJÁK...
                        </motion.h1>
                    )}

                    {step === 5 && (
                        <motion.h1 key="s5" {...textVariant}
                            className="text-5xl sm:text-7xl font-bold tracking-wider uppercase text-white">
                            KERESD A TITKOKAT
                        </motion.h1>
                    )}

                    {/* 4. 5. 6. FINALE - 1532 STAYS */}
                    {step >= 6 && (
                        <motion.div
                            key="finale"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="flex flex-col items-center justify-center h-full relative"
                        >
                            {/* 1532 - Original Serif Font with visual quirk if possible via alignment */}
                            <div className="relative mb-2">
                                <h1 className="text-[140px] sm:text-[200px] leading-none font-serif font-black tracking-tighter text-white relative z-10">
                                    1532
                                </h1>
                            </div>

                            {/* 5. Orange Line & Slogan */}
                            <div className="relative w-full flex flex-col items-center">
                                {/* Orange line expanding */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "300px" }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="h-[2px] bg-orange-500 mb-6"
                                />

                                {/* Slogan fading in */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.7 }}
                                    transition={{ duration: 2, delay: 0.5 }}
                                    className="text-sm sm:text-lg font-sans uppercase tracking-[0.3em] text-white"
                                >
                                    van, amit csak a falak tudnak
                                </motion.p>
                            </div>

                            {/* 6. COMING SOON... ANGOLUL */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 2, delay: 2.5 }}
                                className="absolute bottom-16 sm:bottom-24"
                            >
                                <p className="text-2xl sm:text-3xl font-sans font-black tracking-[0.2em] uppercase text-white">
                                    COMING SOON...
                                </p>
                            </motion.div>

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
