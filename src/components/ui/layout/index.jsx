import React from 'react';
import { motion } from 'framer-motion';

export const FullScreenContainer = ({ children, bgImage }) => (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
        {bgImage && (
            <div className="absolute inset-0 z-0">
                <img src={bgImage} className="w-full h-full object-cover opacity-70 grayscale-[0.2]" alt="Background" />
                {/* Vignette + Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
            </div>
        )}
        <div className="relative z-10 w-full h-full flex flex-col">
            {children}
        </div>
    </div>
);

export const ContentLayer = ({ children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`absolute bottom-0 left-0 right-0 px-8 pb-12 pt-40 md:pt-48 bg-gradient-to-t from-black via-black/95 to-transparent ${className}`}
    >
        {children}
    </motion.div>
);

export const GestureButton = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full mt-12 text-xs tracking-[0.3em] uppercase opacity-50 hover:opacity-100 transition-opacity text-center pb-4 border-b border-white/10"
    >
        {children} <span className="ml-2">→</span>
    </button>
);

export const KeyCounter = ({ found, total }) => (
    <div className="absolute top-8 right-8 text-[10px] tracking-widest opacity-40 font-mono z-20">
        {found} / {total}
    </div>
);
