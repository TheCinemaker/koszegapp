import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function TimeAnomaly({ scannedId }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden">

            {/* GLITCH EFFECT BACKGROUND */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3AybnN4bnN4bnN4bnN4bnN4bnN4bnN4bnN4bnN4bnN4bnN4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7qE1YN7aQZ338tYk/giphy.gif')] bg-cover opacity-20 mix-blend-screen" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center animate-pulse"
            >
                <span className="text-3xl">⚠️</span>
            </motion.div>

            <div className="space-y-4 z-10">
                <h1 className="text-2xl font-bold uppercase tracking-widest glitch-text">
                    IDŐ-ANOMÁLIA ÉSZLELVE
                </h1>

                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg max-w-sm mx-auto">
                    <p className="text-sm leading-relaxed text-red-200">
                        Ez a tárgy ({scannedId || 'ISMERETLEN'}) nem létezett 1532-ben.
                    </p>
                    <div className="h-px bg-red-500/30 my-3" />
                    <p className="text-xs italic opacity-70">
                        "Ha ez egy Cola, akkor még nem találták fel. Ha egy modern kulcs, akkor nem nyitja a várkaput."
                    </p>
                </div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-red-500/50">
                    A rendszer nem tudja értelmezni ezt a jelet.
                </p>
            </div>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/game/scan')}
                className="
          px-8 py-3 
          border border-red-500 text-red-500 
          uppercase tracking-widest text-xs font-bold
          hover:bg-red-500 hover:text-black transition-colors
          rounded-sm z-10
        "
            >
                Vissza a kereséshez
            </motion.button>

            <div className="absolute bottom-4 left-0 right-0 text-[9px] text-red-900 uppercase">
                Error Code: ANCHRONISM_DETECTED
            </div>
        </div>
    );
}
