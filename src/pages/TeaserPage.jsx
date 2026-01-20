import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const sequence = [
            { t: 1000, s: 1 },
            { t: 6000, s: 2 },
            { t: 11000, s: 3 },
            { t: 16500, s: 4 },
            { t: 22500, s: 5 },
            { t: 30000, s: 6 },
            { t: 36000, s: 7 },
        ];

        const timers = sequence.map(e =>
            setTimeout(() => setStep(e.s), e.t)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const cinematic = {
        initial: { opacity: 0, y: 40, filter: 'blur(14px)' },
        animate: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 2.2, ease: [0.22, 1, 0.36, 1] }
        },
        exit: {
            opacity: 0,
            y: -20,
            filter: 'blur(20px)',
            transition: { duration: 1.6 }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black text-white">

            {/* 🎥 CINEMATIC BACKGROUND */}
            <motion.div
                className="absolute inset-0 bg-[url('/teaser-bg.jpg')] bg-cover bg-center"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 40, ease: 'linear' }}
            />
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 film-grain pointer-events-none" />

            {/* 🎞️ CONTENT */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
                <AnimatePresence mode="wait">

                    {step === 1 && (
                        <motion.h1 key="s1" {...cinematic}
                            className="text-6xl sm:text-7xl font-semibold leading-tight">
                            A kövek<br />
                            <span className="font-light opacity-70">figyelnek</span>
                        </motion.h1>
                    )}

                    {step === 2 && (
                        <motion.h1 key="s2" {...cinematic}
                            className="text-6xl sm:text-7xl font-semibold leading-tight">
                            A falak<br />
                            <span className="font-light opacity-70">emlékeznek</span>
                        </motion.h1>
                    )}

                    {step === 3 && (
                        <motion.h1 key="s3" {...cinematic}
                            className="text-6xl sm:text-7xl font-semibold leading-tight">
                            A város<br />
                            <span className="font-light opacity-70">túlélte</span>
                        </motion.h1>
                    )}

                    {step === 4 && (
                        <motion.p key="s4" {...cinematic}
                            className="text-3xl sm:text-4xl font-light tracking-wide">
                            Amit mások<br />elfelejtettek
                        </motion.p>
                    )}

                    {step === 5 && (
                        <motion.h1 key="s5" {...cinematic}
                            className="text-7xl sm:text-8xl font-bold">
                            Keresd<br />a nyomokat
                        </motion.h1>
                    )}

                    {step >= 6 && (
                        <motion.div
                            key="final"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 2 }}
                            className="flex flex-col items-center"
                        >
                            <motion.h1
                                initial={{ opacity: 0, scale: 0.8, letterSpacing: '0.2em' }}
                                animate={{ opacity: 1, scale: 1, letterSpacing: '-0.02em' }}
                                transition={{ duration: 3, ease: [0.19, 1, 0.22, 1] }}
                                className="text-[160px] sm:text-[200px] font-black leading-none"
                            >
                                1532
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5, duration: 1.5 }}
                                className="mt-6 text-sm tracking-[0.4em] uppercase opacity-80"
                            >
                                Van, amit csak a falak tudnak
                            </motion.p>

                            {step >= 7 && (
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 3, duration: 2 }}
                                    className="mt-28 text-4xl tracking-[0.3em] font-light"
                                >
                                    Hamarosan
                                </motion.h2>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
