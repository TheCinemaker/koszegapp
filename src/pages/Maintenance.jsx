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
                    <img src="/images/koeszeg_logo_nobg.png" className="w-24 h-24 drop-shadow-lg" alt="visitkoszeg Logo" />
                </div>

                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 drop-shadow-sm">
                        visit<span className="text-indigo-600">koszeg</span>
                    </h1>
                    <p className="text-gray-600 font-medium max-w-xs mx-auto text-lg leading-relaxed">
                        A visitkoszeg jelenleg karbantartás alatt áll. <br />
                        Hamarosan visszatérünk!
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-2/3 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">visitkoszeg Team</p>
                </div>
            </div>
        </div>
    );
}
