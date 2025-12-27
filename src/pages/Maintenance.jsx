// src/pages/Maintenance.jsx
import React from 'react';
import { FaTools, FaHardHat } from 'react-icons/fa';

export default function Maintenance() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-beige-100 to-white dark:from-gray-900 dark:to-gray-800 text-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/50">
                <div className="flex justify-center mb-6">
                    <img src="/images/koeszeg_logo_nobg.png" className="w-24 h-24 drop-shadow-lg" alt="KőszegAPP Logo" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 tracking-tight">
                    Fejlesztés alatt
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    A KőszegAPP jelenleg karbantartás alatt áll. <br />
                    Hamarosan visszatérünk egy megújult élménnyel!
                </p>

                <div className="flex justify-center gap-4 text-gray-400 dark:text-gray-500">
                    <FaTools className="text-2xl" />
                    <FaHardHat className="text-2xl" />
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">KőszegAPP Team</p>
                </div>
            </div>
        </div>
    );
}
