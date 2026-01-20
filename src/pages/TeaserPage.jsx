import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 3. Cinematic Sequence (Mobile Optimized)
        const sequence = [
            { delay: 1000, step: 1 },  // "Az idő..."
            { delay: 5000, step: 2 },  // "...rétegek."
            { delay: 10000, step: 3 }, // "A város..."
            { delay: 15000, step: 4 }, // "Megmaradt."
            { delay: 21000, step: 5 }, // "A falak..."
            { delay: 27000, step: 6 }, // "...körülötted."
            { delay: 34000, step: 7 }, // 1532 (TITLE)
            { delay: 40000, step: 8 }, // COMING SOON (Finale)
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // Cinematic Fade & Scale Variant
    const sceneVariant = {
        initial: { opacity: 0, scale: 0.9, filter: 'blur(5px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.1, filter: 'blur(10px)' },
        transition: { duration: 1.5, ease: "easeInOut" }
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden z-[9999]">

            {/* Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_120%)] pointer-events-none z-10 opacity-80" />

            {/* Content Layer */}
            <div className="relative z-20 w-full max-w-lg px-8 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode='wait'>

                    {/* S1: Az idő */}
                    {step === 1 && (
                        <motion.div key="s1" {...sceneVariant} className="w-full">
                            <p className="text-3xl font-serif text-neutral-400 tracking-wide font-light">
                                Az idő nem vonal.
                            </p>
                        </motion.div>
                    )}

                    {/* S2: Rétegek */}
                    {step === 2 && (
                        <motion.div key="s2" {...sceneVariant} className="w-full">
                            <p className="text-3xl font-serif text-amber-50/90 tracking-wide font-light">
                                Hanem rétegek.
                            </p>
                        </motion.div>
                    )}

                    {/* S3: A város */}
                    {step === 3 && (
                        <motion.div key="s3" {...sceneVariant} className="w-full">
                            <p className="text-sm uppercase tracking-[0.4em] text-neutral-500 mb-4">
                                Kőszeg
                            </p>
                            <p className="text-2xl font-light text-neutral-300">
                                A város nem csak épült.
                            </p>
                        </motion.div>
                    )}

                    {/* S4: Megmaradt */}
                    {step === 4 && (
                        <motion.div key="s4" {...sceneVariant} className="w-full">
                            <p className="text-5xl font-serif italic text-white leading-tight drop-shadow-2xl">
                                Megmaradt.
                            </p>
                        </motion.div>
                    )}

                    {/* S5: A falak */}
                    {step === 5 && (
                        <motion.div key="s5" {...sceneVariant} className="w-full space-y-4">
                            <div className="h-px w-12 bg-amber-500/50 mx-auto mb-6"></div>
                            <p className="text-xl font-light text-neutral-300 leading-relaxed">
                                "Van, amit csak a falak tudnak..."
                            </p>
                        </motion.div>
                    )}

                    {/* S6: Körülötted */}
                    {step === 6 && (
                        <motion.div key="s6" {...sceneVariant} className="w-full">
                            <p className="text-3xl font-serif text-amber-100/90 leading-relaxed">
                                ...és most <br />
                                <span className="text-amber-500 font-normal">körülötted van.</span>
                            </p>
                        </motion.div>
                    )}

                    {/* S7: 1532 */}
                    {step === 7 && (
                        <motion.div
                            key="title"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                            transition={{ duration: 2.5 }}
                            className="w-full py-10"
                        >
                            <h1 className="text-[100px] leading-none font-serif font-bold text-white tracking-tighter mix-blend-screen opacity-90">
                                1532
                            </h1>
                        </motion.div>
                    )}

                    {/* S8: COMING SOON - FINALE */}
                    {step === 8 && (
                        <motion.div
                            key="finale"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="w-full space-y-6"
                        >
                            <div className="text-center">
                                <p className="text-3xl md:text-4xl text-white font-light tracking-[0.2em] uppercase font-serif">
                                    Coming Soon
                                </p>
                            </div>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "60px" }}
                                transition={{ duration: 1.5, delay: 2 }}
                                className="h-[2px] bg-amber-600 mx-auto"
                            />

                            <p className="text-xs text-neutral-500 tracking-[0.5em] font-sans mt-8 uppercase">
                                Kőszeg Quest
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
