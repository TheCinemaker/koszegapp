import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ScanIntro() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex items-center justify-center px-8 text-center selection:bg-white/20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="max-w-sm space-y-8"
            >
                <p className="text-sm text-white/50 leading-relaxed font-light">
                    Ha egy helyen időkaput találsz,<br />
                    tartsd fölé a kamerát.
                </p>

                <button
                    onClick={() => navigate('/game/scan/live')}
                    className="
            text-xs
            uppercase
            tracking-[0.4em]
            text-blue-300
            opacity-80
            hover:opacity-100
            border-b border-transparent
            hover:border-blue-300/40
            pb-2
            transition-all
          "
                >
                    Indíthatom →
                </button>

                <div className="pt-8">
                    <button
                        onClick={() => navigate('/game/treasure-chest')}
                        className="
              text-[10px]
              uppercase
              tracking-[0.3em]
              text-white/30
              hover:text-white/60
              transition-colors
            "
                    >
                        Vissza a Naplóhoz
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
