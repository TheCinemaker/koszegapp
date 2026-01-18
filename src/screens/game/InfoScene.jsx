import React from 'react';
import { motion } from 'framer-motion';

const bgVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const titleVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
};

const textVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
};

export default function InfoScene({ gem, onClose }) {
    // Handle image path correctly depending on if it's external or local
    const imageSrc = gem.image?.startsWith('http')
        ? gem.image
        : `/images/game/${gem.image}`;

    const year = 1532;

    return (
        <div className="fixed inset-0 bg-[#0b0b0c] text-neutral-100 overflow-hidden px-6 selection:bg-white/20">

            {/* ===== ÉVSZÁM – SOFTSTART STÍLUS (15% FIX, SERIF) ===== */}
            <div className="absolute top-[15%] left-0 right-0 flex justify-center pointer-events-none z-20">
                <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70">
                    {year}
                </div>
            </div>

            {/* ===== HÁTTÉRKÉP (ALUL) ===== */}
            <motion.div
                variants={bgVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 z-0"
            >
                <img
                    src={imageSrc}
                    alt={gem.name}
                    className="w-full h-full object-cover opacity-60 grayscale mix-blend-overlay"
                />
                {/* Sötétítés, hogy a fehér szöveg olvasható legyen */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c] via-[#0b0b0c]/80 to-[#0b0b0c]" />
            </motion.div>

            {/* ===== TARTALOM ===== */}
            <div className="relative z-10 w-full max-w-md mx-auto h-full flex flex-col items-center justify-start pt-[32vh] space-y-8 text-center">

                {/* HELYSZÍN CÍM */}
                <motion.div
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.45, duration: 0.7, ease: 'easeOut' }}
                    className="space-y-4"
                >
                    <p className="text-sm text-white/40 font-mono uppercase tracking-widest">
                        A titok forrása
                    </p>
                    <h1 className="text-3xl font-serif text-white/90 leading-tight">
                        {gem.name}
                    </h1>
                </motion.div>

                {/* SZÖVEG */}
                <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.85, duration: 0.8, ease: 'easeOut' }}
                    className="text-white/60 leading-relaxed font-light max-w-xs mx-auto space-y-4"
                >
                    {/* Itt lehetne 'Indiana Jones' stilusú formázást alkalmazni később */}
                    <p className="border-l border-white/10 pl-4 italic font-serif text-white/80">
                        "{gem.description}"
                    </p>
                </motion.div>

                {/* HALK CTA */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    onClick={onClose}
                    className="
                        mt-8
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
                    Tovább a következő jelhez →
                </motion.button>
            </div>
        </div>
    );
}
