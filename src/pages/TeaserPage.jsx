import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 8. Apple Style Script (Clean, Fast, Precise)
        const sequence = [
            { delay: 1000, step: 1 },  // A KÖVEK FIGYELNEK
            { delay: 4500, step: 2 },  // A FALAK EMLÉKEZNEK
            { delay: 8000, step: 3 },  // A SZOBROK MESÉLNEK
            { delay: 11500, step: 4 }, // ELMONDJÁK...
            { delay: 16000, step: 5 }, // KERESD A TITKOKAT
            { delay: 21000, step: 6 }, // 1532
            { delay: 24000, step: 7 }, // HAMAROSAN
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // Apple-style clean motion: smooth, slight scale, ease-out-quart
    const appleVariant = {
        initial: { opacity: 0, scale: 0.96, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 1.04, filter: 'blur(20px)' }, // Cinematic blur out
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } // Apple-like spring/ease
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden z-[9999] font-sans">

            {/* Content Layer - CENTERED, SAN-SERIF, MONOCHROME */}
            <div className="relative z-20 w-full max-w-2xl px-6 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode='wait'>

                    {/* S1 */}
                    {step === 1 && (
                        <motion.div key="s1" {...appleVariant}>
                            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                                A KÖVEK<br />FIGYELNEK
                            </h1>
                        </motion.div>
                    )}

                    {/* S2 */}
                    {step === 2 && (
                        <motion.div key="s2" {...appleVariant}>
                            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                                A FALAK<br />EMLÉKEZNEK
                            </h1>
                        </motion.div>
                    )}

                    {/* S3 */}
                    {step === 3 && (
                        <motion.div key="s3" {...appleVariant}>
                            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                                A SZOBROK<br />MESÉLNEK
                            </h1>
                        </motion.div>
                    )}

                    {/* S4 */}
                    {step === 4 && (
                        <motion.div key="s4" {...appleVariant}>
                            <p className="text-2xl sm:text-4xl font-medium tracking-wide uppercase leading-relaxed text-white">
                                ELMONDJÁK,<br />MIRE EMLÉKEZNEK
                            </p>
                        </motion.div>
                    )}

                    {/* S5 */}
                    {step === 5 && (
                        <motion.div key="s5" {...appleVariant}>
                            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase">
                                KERESD<br />A TITKOKAT
                            </h1>
                        </motion.div>
                    )}

                    {/* THE FINALE (6, 7) */}
                    {step >= 6 && (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-10">

                            {/* 1532 - Clean, Heavy Sans */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <h1 className="text-[120px] sm:text-[180px] leading-none font-bold text-white tracking-tighter">
                                    1532
                                </h1>
                            </motion.div>

                            {/* SUBTITLE */}
                            {step >= 6 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.8 }}
                                    className="mt-6"
                                >
                                    <p className="text-sm sm:text-lg text-white font-semibold uppercase tracking-[0.2em]">
                                        VAN, AMIT CSAK A FALAK TUDNAK
                                    </p>
                                </motion.div>
                            )}

                            {/* HAMAROSAN - Apple Style (San Francisco) */}
                            {step >= 7 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="mt-24 sm:mt-32"
                                >
                                    <h2 className="text-4xl sm:text-6xl font-light text-white tracking-[0.15em] uppercase">
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
