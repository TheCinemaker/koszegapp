import React from 'react';
import { motion } from 'framer-motion';

const getGemImage = (img) => {
    if (!img) return '';
    return img.startsWith('http') ? img : `/images/game/${img}`;
};

export default function KeyScene({ gem, isNewKey, onNext, onClose, mode, foundCount, totalCount }) {
    const observationText = gem.question ? gem.question[mode] : gem.description;
    const year = 1532;

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

            {/* ===== HÁTTÉRKÉP (OPCIONÁLIS, HALVÁNYAN) ===== */}
            {/* Ha "mágikusat" akarunk, a kép lehet nagyon halvány a háttérben, vagy csak egy textúra */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                <img
                    src={getGemImage(gem.image)}
                    alt=""
                    className="w-full h-full object-cover dark:grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c] via-transparent to-[#0b0b0c]" />
            </div>


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
                        {isNewKey ? "Időkapu Horgony" : "Stabilizálva"}
                    </p>

                    <h2 className="text-3xl font-serif text-white/90 leading-tight">
                        {gem.name}
                    </h2>
                </motion.div>

                {isNewKey ? (
                    <motion.div
                        initial={{ opacity: 0, y: 35 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                        className="mt-4 text-white/60 leading-relaxed font-light max-w-xs space-y-6"
                    >
                        <p>
                            Amit látsz, nem történelemóra.
                            <br />
                            <span className="text-neutral-100/40">A város döntései itt formálódtak.</span>
                        </p>

                        <div className="border-l border-white/10 pl-4 py-1 italic font-serif text-white/80">
                            "{observationText}"
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 35 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                        className="mt-4 text-white/60 leading-relaxed font-light max-w-xs"
                    >
                        <p className="italic font-serif">
                            "Ezt a pillanatot már stabilizáltad.
                            Az idő itt nem inog tovább."
                        </p>
                    </motion.div>
                )}

                <motion.button
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    onClick={isNewKey ? onNext : onClose}
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
                    {isNewKey ? "Stabilizálom →" : "Vissza"}
                </motion.button>

                {/* Counter (Kicsit eldugva, de ott van) */}
                <div className="absolute top-[-15vh] right-0 text-xs font-mono text-white/20">
                    {foundCount} / {totalCount}
                </div>

            </div>
        </div>
    );
}
