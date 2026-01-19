import React from 'react';
import { motion } from 'framer-motion';

export default function ModeSelection({ onSelect }) {

    const handleSelect = (mode) => {
        if (navigator && navigator.vibrate) navigator.vibrate(50);
        onSelect(mode);
    };

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex flex-col items-center justify-center p-6 text-center">

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-10"
            >
                <h2 className="text-3xl font-serif text-white mb-2">Hogyan folytatod?</h2>
                <p className="text-white/50 text-sm">Válassz küldetést az időutazáshoz.</p>
            </motion.div>

            <div className="w-full max-w-sm space-y-4">

                {/* GYEREK MÓD */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect('child')}
                    className="w-full p-6 rounded-xl border border-white/10 bg-gradient-to-br from-blue-900/30 to-slate-900/30 hover:from-blue-800/40 hover:to-slate-800/40 text-left group transition-all"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-3xl">🧩</span>
                        <h3 className="text-xl font-bold text-blue-200 group-hover:text-white transition-colors">Felfedező</h3>
                    </div>
                    <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                        Játékos feladatok, rejtvények és kalandok. Családoknak és gyerekeknek ajánlott.
                    </p>
                </motion.button>

                {/* FELNŐTT MÓD */}
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect('adult')}
                    className="w-full p-6 rounded-xl border border-white/10 bg-gradient-to-br from-amber-900/20 to-stone-900/30 hover:from-amber-800/30 hover:to-stone-800/40 text-left group transition-all"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-3xl">📜</span>
                        <h3 className="text-xl font-bold text-amber-200 group-hover:text-white transition-colors">Történész</h3>
                    </div>
                    <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                        Mélyebb történelmi összefüggések és komolyabb kihívások. Felnőtteknek ajánlott.
                    </p>
                </motion.button>

            </div>

        </div>
    );
}
