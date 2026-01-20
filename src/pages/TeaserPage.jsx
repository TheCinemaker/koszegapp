import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeaserPage() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // 2. Gyorsított, "Vertical Flow" idővonal (Faster pacing)
        const sequence = [
            { delay: 1000, step: 1 },  // "Az idő nem vonal."
            { delay: 5000, step: 2 },  // "...hanem rétegek egymáson."
            { delay: 9000, step: 3 },  // "A város nem csak épült."
            { delay: 13000, step: 4 }, // "Megmaradt."
            { delay: 17000, step: 5 }, // "Vannak helyek..."
            { delay: 22000, step: 6 }, // "...ahol a múlt körülötted van."
            { delay: 27000, step: 7 }, // 1532 (TITLE REVEAL)
            { delay: 33000, step: 8 }, // Epilogue: Suttogás
        ];

        const timers = sequence.map(item =>
            setTimeout(() => setStep(item.step), item.delay)
        );

        return () => timers.forEach(clearTimeout);
    }, []);

    // "Lift Up" Effect: Lentről be, Középre, Felfelé ki
    const textVariant = {
        initial: { opacity: 0, y: 150, filter: 'blur(8px)' },  // Mélyebbről indul
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },    // Középen éles
        exit: { opacity: 0, y: -150, filter: 'blur(8px)' },    // Felfelé távozik
        transition: { duration: 2.0, ease: "easeInOut" }       // Folyamatos mozgásérzet
    };

    return (
        <div className="h-screen w-screen bg-[#050505] text-neutral-100 flex flex-col items-center justify-center overflow-hidden cursor-none selection:bg-amber-500/30">

            <AnimatePresence mode='wait'>

                {/* STEP 1 */}
                {step === 1 && (
                    <motion.div key="s1" {...textVariant} className="max-w-2xl text-center px-6 absolute">
                        <p className="text-3xl md:text-5xl font-serif font-light text-neutral-300 leading-tight">
                            "Az idő nem vonal."
                        </p>
                    </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <motion.div key="s2" {...textVariant} className="max-w-2xl text-center px-6 absolute">
                        <p className="text-3xl md:text-5xl font-serif font-light text-amber-50/80 leading-tight">
                            "Hanem rétegek egymáson."
                        </p>
                    </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <motion.div key="s3" {...textVariant} className="max-w-2xl text-center px-6 absolute">
                        <p className="text-2xl md:text-4xl font-sans font-light tracking-wide text-neutral-400">
                            A város nem csak épült.
                        </p>
                    </motion.div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                    <motion.div key="s4" {...textVariant} className="max-w-2xl text-center px-6 absolute">
                        <p className="text-4xl md:text-6xl font-serif italic text-white leading-tight">
                            Megmaradt.
                        </p>
                    </motion.div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                    <motion.div key="s5" {...textVariant} className="max-w-3xl text-center px-6 absolute space-y-4">
                        <p className="text-xl md:text-3xl font-light text-neutral-300 leading-relaxed">
                            "Vannak helyek, ahol a múlt nem mögötted van..."
                        </p>
                    </motion.div>
                )}

                {/* STEP 6 */}
                {step === 6 && (
                    <motion.div key="s6" {...textVariant} className="max-w-3xl text-center px-6 absolute">
                        <p className="text-2xl md:text-4xl font-serif text-amber-100/90 leading-relaxed">
                            "...hanem <span className="text-amber-500">körülötted</span>."
                        </p>
                    </motion.div>
                )}

                {/* STEP 7: THE REVEAL (1532) */}
                {(step === 7 || step === 8) && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 3, ease: 'easeOut' }}
                        className="flex flex-col items-center relative z-10"
                    >
                        <h1 className="text-[120px] md:text-[200px] font-serif font-bold text-white leading-none tracking-tighter mix-blend-overlay opacity-90">
                            1532
                        </h1>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, delay: 2 }}
                            className="h-1 bg-amber-600 w-full mb-6"
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 3, duration: 2 }}
                            className="text-sm md:text-lg uppercase tracking-[0.6em] text-amber-500/80 font-medium"
                        >
                            Van, amit csak a falak tudnak
                        </motion.p>
                    </motion.div>
                )}

                {/* PROMPT TO REPLAY (Optional) */}
                {step === 8 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 5, duration: 2 }}
                        className="fixed bottom-8 text-neutral-800 text-xs tracking-widest uppercase"
                    >
                        hamarosan
                    </motion.div>
                )}

            </AnimatePresence>

            {/* Subtle Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        </div>
    );
}
