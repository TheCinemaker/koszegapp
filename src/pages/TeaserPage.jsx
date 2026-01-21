import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 12. Mystic Script & Timings
        const sequence = [
            { t: 1500, s: 1 },  // Figyelnek.
            { t: 5500, s: 2 },  // Nem felejtenek.
            { t: 9500, s: 3 },  // A történet / nem ért véget.
            { t: 14500, s: 4 }, // Ha figyelsz.
            { t: 18500, s: 5 }, // Megtalálod....
            { t: 24000, s: 6 }, // 1532 (Finale)
        ];

        const timers = sequence.map(e =>
            setTimeout(() => setStep(e.s), e.t)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const textVariant = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.8, ease: "easeIn" }
        },
        exit: {
            opacity: 0,
            transition: { duration: 1.5, ease: "easeOut" }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black text-white flex flex-col items-center justify-center font-sans">

            <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center justify-center text-center h-full">
                <AnimatePresence mode="wait">

                    {step === 1 && (
                        <motion.h1 key="s1" {...textVariant}
                            className="text-3xl sm:text-5xl font-bold tracking-widest uppercase text-white leading-relaxed">
                            Figyelnek.
                        </motion.h1>
                    )}

                    {step === 2 && (
                        <motion.h1 key="s2" {...textVariant}
                            className="text-3xl sm:text-5xl font-bold tracking-widest uppercase text-white leading-relaxed">
                            Nem felejtenek.
                        </motion.h1>
                    )}

                    {step === 3 && (
                        <motion.h1 key="s3" {...textVariant}
                            className="text-3xl sm:text-5xl font-bold tracking-widest uppercase text-white leading-relaxed">
                            A történet<br />
                            <span className="opacity-80">nem ért véget.</span>
                        </motion.h1>
                    )}

                    {step === 4 && (
                        <motion.h1 key="s4" {...textVariant}
                            className="text-3xl sm:text-5xl font-bold tracking-widest uppercase text-white leading-relaxed">
                            Ha figyelsz.
                        </motion.h1>
                    )}

                    {step === 5 && (
                        <motion.h1 key="s5" {...textVariant}
                            className="text-4xl sm:text-6xl font-black tracking-widest uppercase text-white leading-relaxed">
                            Megtalálod...
                        </motion.h1>
                    )}

                    {/* FINALE: 1532 */}
                    {step >= 6 && (
                        <motion.div
                            key="finale"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5 }}
                            className="flex flex-col items-center justify-center h-full relative"
                        >

                            {/* 1532 */}
                            <div className="relative mb-8">
                                <h1 className="text-[100px] sm:text-[160px] leading-none font-serif font-black tracking-tighter text-white relative z-10">
                                    1532
                                </h1>
                            </div>

                            {/* Orange Line & Split Slogan */}
                            <div className="relative w-full flex flex-col items-center space-y-6">

                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "240px" }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="h-[2px] bg-orange-500"
                                />

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{ duration: 2, delay: 0.8 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <p className="text-sm sm:text-lg font-sans uppercase tracking-[0.3em] text-white">
                                        Van,
                                    </p>
                                    <p className="text-sm sm:text-lg font-sans uppercase tracking-[0.3em] text-white">
                                        amit csak a falak tudnak.
                                    </p>
                                </motion.div>
                            </div>

                            {/* COMING SOON... */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 2, delay: 3 }}
                                className="absolute bottom-20"
                            >
                                <p className="text-xl sm:text-2xl font-sans font-black tracking-[0.2em] uppercase text-white/50">
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
