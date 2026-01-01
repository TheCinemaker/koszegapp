import React from 'react';
import { IoImageOutline } from 'react-icons/io5';

/**
 * A premium "No Image" placeholder in Apple style.
 * Features a soft gradient, centered logo/icon, and polite text.
 */
export default function GhostImage({ className = "w-full h-full", text = "Sajnos ehhez nincs képünk..." }) {
    return (
        <div className={`relative overflow-hidden bg-gray-100 dark:bg-[#1c1c1e] flex flex-col items-center justify-center text-center p-6 ${className}`}>

            {/* Soft Background Gradient Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Icon / Logo Area */}
            <div className="relative z-10 mb-4 flex items-center justify-center w-20 h-20 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-full border border-white/20 shadow-sm">
                <img
                    src="/images/koeszeg_logo_nobg.png"
                    alt="Kőszeg"
                    className="w-10 h-10 opacity-60 grayscale"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} // Fallback if logo missing
                />
                <IoImageOutline className="text-3xl text-gray-400 hidden" />
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-xs">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">
                    Nincs kép
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {text}
                </p>
            </div>

        </div>
    );
}
