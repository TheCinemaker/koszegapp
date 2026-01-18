import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import SilentFallback from '../components/game/SilentFallback';

export default function SoftStart() {
    const navigate = useNavigate();
    const { foundGems } = useGame();
    const hasFoundSomething = foundGems.length > 0;

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6">

            {/* ===== ÉVSZÁM – FIX HELYEN (15% MAGASAN) ===== */}
            <div className="absolute top-[15%] left-0 right-0 flex justify-center pointer-events-none">
                <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70">
                    1532
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
                        A város nem felejtett.
                    </p>

                    <h2 className="text-3xl font-serif text-white/90 leading-tight">
                        Nem minden fal néma.
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                    className="mt-4 text-white/60 leading-relaxed font-light max-w-xs"
                >
                    <p>
                        Nem minden történet maradt meg a könyvekben, van, amit csak a kövek őriznek.
                    </p>
                    <p className="mt-4">
                        Vannak helyek a városban,
                        ahol a múlt nem zárult le.
                    </p>
                    <p className="font-serif italic text-white/80 mt-2">
                        Ha jó helyen állsz meg, talán elmondanak valamit.
                    </p>
                </motion.div>

                <div className="mt-16 space-y-6 flex flex-col items-center w-full max-w-xs mx-auto">
                    <motion.button
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        onClick={() => navigate('/game/scan')}
                        className="
                            w-full
                            text-xs
                            uppercase
                            tracking-[0.4em]
                            text-blue-300
                            opacity-80
                            hover:opacity-100
                            transition-opacity
                            border-b border-blue-300/20
                            hover:border-blue-300/40
                            pb-3
                        "
                    >
                        Jel beolvasása →
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        onClick={() => navigate('/game/treasure-chest')}
                        className="
                            w-full
                            text-xs
                            uppercase
                            tracking-[0.4em]
                            text-white/40
                            hover:text-blue-300/80
                            transition-colors
                            border-b border-transparent
                            hover:border-blue-300/10
                            pb-3
                        "
                    >
                        Megnézem, mit őriz →
                    </motion.button>
                </div>

                {/* ===== KONTEKSTUS CTA ===== */}
                {hasFoundSomething ? (
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.6 }}
                        onClick={() => navigate('/game/scan')}
                        className="
                            mt-6
                            text-xs
                            uppercase
                            tracking-[0.4em]
                            text-white/70
                            hover:text-white
                            transition-colors
                        "
                    >
                        Új időkapu keresése →
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.6 }}
                        className="mt-8 text-sm text-neutral-100/30 leading-relaxed max-w-xs"
                    >
                        <p>
                            Ha most indulsz el először,
                            a vár környéke jó kezdet.
                        </p>
                        <p className="mt-2 text-neutral-100/50 font-serif italic">
                            A falakon keresd a jelet.
                        </p>
                    </motion.div>
                )}
            </div>

            <SilentFallback />
        </div>
    );
}
