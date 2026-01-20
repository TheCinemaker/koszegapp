import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MYSTICAL_MESSAGES = [
    "Az idő kereke visszafordul...",
    "A jelen halványul, a múlt élesedik.",
    "Egy kapu tárul fel 1532-be.",
    "A történelem nem múlt el, csak alszik.",
    "A kövek újra mesélni kezdenek.",
    "Érzed? A levegő megváltozik.",
    "Lépj be az ostrom árnyékába.",
    "A kulcs a múltban rejtőzik."
];

export default function LoadingScreen({ onComplete }) {
    // 2026-tól indulunk vissza 1532-be
    const [year, setYear] = useState(2026);
    const [isExiting, setIsExiting] = useState(false);

    // Véletlenszerű üzenet kiválasztása
    const message = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * MYSTICAL_MESSAGES.length);
        return MYSTICAL_MESSAGES[randomIndex];
    }, []);

    useEffect(() => {
        // --- IDŐUTAZÁS LOGIKA ---
        const duration = 4000; // 4 másodperc alatt érünk le
        const startYear = 2026;
        const targetYear = 1532;
        const totalDrop = startYear - targetYear;
        const intervalTime = duration / totalDrop; // ms per year tick

        // Évszám pörgetés
        const yearTimer = setInterval(() => {
            setYear(prev => {
                const next = prev - 5; // Gyorsabban ugrálunk
                if (next <= targetYear) {
                    clearInterval(yearTimer);
                    return targetYear;
                }
                return next;
            });
        }, 10); // Sűrű frissítés a sima hatáshoz

        // --- HAPTIKUS FEEDBACK (Ticking) ---
        const tickHaptic = setInterval(() => {
            if (navigator && navigator.vibrate) {
                try { navigator.vibrate(10); } catch (e) { }
            }
        }, 200);

        // --- EXIT LOGIKA ---
        const exitTimer = setTimeout(() => {
            // Siker "dobbanás"
            if (navigator && navigator.vibrate) {
                try { navigator.vibrate([50, 50, 200]); } catch (e) { }
            }
            // Indul az exit animáció (fade to black)
            setIsExiting(true);
        }, 4000); // 4mp után indul a fade out

        // Végső lezárás (exit animáció után)
        const completeTimer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 5200); // +1.2s a fade out-ra

        return () => {
            clearInterval(yearTimer);
            clearInterval(tickHaptic);
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-[#0b0b0c] flex flex-col items-center justify-center z-50 p-6 overflow-hidden">

            {/* --- FADE TO BLACK OVERLAY --- */}
            <AnimatePresence>
                {isExiting && (
                    <motion.div
                        className="fixed inset-0 bg-black z-[100]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.0, ease: "easeInOut" }}
                    />
                )}
            </AnimatePresence>

            {/* --- HÁTTÉR --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Finom Gradiens - Most már Dark / Gold tónus */}
                <div className="absolute inset-0 bg-radial-gradient from-amber-900/10 via-[#0b0b0c] to-black opacity-80" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm w-full">

                {/* --- IDŐ KEREKE (Wheel of Time) --- */}
                <div className="relative w-64 h-64 mb-10 flex items-center justify-center">

                    {/* 1. Külső Gyűrű (Lassan forog visszafelé) */}
                    <motion.div
                        className="absolute inset-0 border border-white/10 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* 2. Skála Gyűrű (Tick marks) */}
                    <motion.svg
                        className="absolute inset-2 w-full h-full text-white/20"
                        viewBox="0 0 100 100"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        {/* 12 osztás */}
                        {[...Array(12)].map((_, i) => (
                            <line
                                key={i}
                                x1="50" y1="5" x2="50" y2="10"
                                transform={`rotate(${i * 30} 50 50)`}
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                        ))}
                        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
                    </motion.svg>

                    {/* 3. Belső "Mechanika" (Gyorsabban forog visszafelé) */}
                    <motion.div
                        className="absolute w-40 h-40 border-2 border-dashed border-white/20 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />

                    {/* 4. Központi Évszám Kijelző */}
                    <div className="absolute flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-full w-24 h-24 border border-white/10 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                        <span className="text-xs text-amber-500/60 uppercase tracking-widest mb-1">Év</span>
                        <span className="text-3xl font-mono font-bold text-amber-100 tabular-nums tracking-tighter">
                            {Math.max(year, 1532)}
                        </span>
                    </div>

                    {/* 5. Progress Indicator (Vékony kék ív) */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%" cy="50%" r="48%"
                            fill="none"
                            stroke="#f59e0b" // Amber-500
                            strokeWidth="1"
                            strokeDasharray="301" // 2 * PI * r (approx)
                            strokeDashoffset={301 * (1 - (2026 - year) / (2026 - 1532))}
                            className="transition-all duration-75 ease-linear opacity-50"
                        />
                    </svg>
                </div>

                {/* --- ÜZENET --- */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-center"
                >
                    <p className="text-lg font-medium text-white/80 drop-shadow-md">
                        {message}
                    </p>
                    <motion.div
                        className="mt-3 flex justify-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}
