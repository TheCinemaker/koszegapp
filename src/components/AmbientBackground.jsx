import React, { useState, useEffect, useMemo } from 'react';
import SunCalc from 'suncalc';
import { motion, AnimatePresence } from 'framer-motion';

// Kőszeg Coordinates
const COORDS = { lat: 47.3895, lng: 16.5410 };

// Color Palettes for Phases
const PALETTES = {
    night: {
        bg: 'linear-gradient(to bottom, #0f172a, #1e1b4b)', // Slate 900 -> Indigo 950
        sun: 'rgba(120,150,255,0.12)', // Moon-like
    },
    dawn: {
        bg: 'linear-gradient(to bottom, #312e81, #c2410c)', // Indigo 900 -> Orange 700
        sun: 'rgba(255,200,150,0.3)',
    },
    day: {
        bg: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', // Blue 500 -> Blue 400 (Base Sky)
        sun: 'rgba(255,255,255,0.25)', // Bright Sun
    },
    dusk: {
        bg: 'linear-gradient(to bottom, #1e3a8a, #be185d)', // Blue 900 -> Pink 700
        sun: 'rgba(255,100,100,0.3)', // Reddish Sun
    }
};

export default function AmbientBackground({ weather, dark }) {
    const [sunData, setSunData] = useState(null);
    const [phase, setPhase] = useState('day');
    const [debugHour, setDebugHour] = useState(null); // NULL = Realtime, Number = Debug Time
    const [enabled, setEnabled] = useState(localStorage.getItem('ambientMode') === 'true'); // Default to FALSE

    // Listen for toggle changes
    useEffect(() => {
        const handleToggle = () => setEnabled(localStorage.getItem('ambientMode') === 'true');
        window.addEventListener('ambient-mode-change', handleToggle);
        return () => window.removeEventListener('ambient-mode-change', handleToggle);
    }, []);

    // Update Sun Position & Phase every minute
    useEffect(() => {
        const updateSun = () => {
            let now = new Date();

            // --- DEBUG TIME OVERRIDE ---
            if (debugHour !== null) {
                const d = new Date();
                d.setHours(Math.floor(debugHour));
                d.setMinutes(Math.floor((debugHour % 1) * 60));
                now = d;
            }

            const times = SunCalc.getTimes(now, COORDS.lat, COORDS.lng);
            const position = SunCalc.getPosition(now, COORDS.lat, COORDS.lng);

            // Determine Phase based on altitude
            let newPhase = 'day';
            const alt = position.altitude;

            if (alt < -0.2) newPhase = 'night';
            else if (alt >= -0.2 && alt < 0) newPhase = times.dawn < now && now < times.sunrise ? 'dawn' : 'dusk';
            else if (alt >= 0) newPhase = 'day';

            // More precise time-based phase override for Dawn/Dusk
            if (now >= times.nightEnd && now < times.sunriseEnd) newPhase = 'dawn';
            else if (now >= times.sunsetStart && now < times.night) newPhase = 'dusk';
            else if (now >= times.night || now < times.nightEnd) newPhase = 'night';
            else newPhase = 'day';

            setPhase(newPhase);

            // Calculate Sun/Moon Position % for CSS
            const azimuthNorm = (position.azimuth + Math.PI) / (2 * Math.PI); // 0 to 1

            // Map time to X position for visual simplicity
            const totalMinutes = now.getHours() * 60 + now.getMinutes();
            const xPercent = (totalMinutes / 1440) * 100;

            const yPercent = 80 - (Math.max(0, alt) / (Math.PI / 2)) * 70;

            setSunData({ x: xPercent, y: yPercent });
        };

        updateSun();
        const interval = setInterval(updateSun, 1000); // 1 sec update for smooth debug slider
        return () => clearInterval(interval);
    }, [debugHour]); // Re-run when debugHour changes

    // Compute Gradient based on Phase and Dark Mode
    const computedGradient = useMemo(() => {
        if (!sunData) return {};

        const palette = PALETTES[phase];
        let bgStyle = palette.bg;

        if (dark) {
            bgStyle = 'linear-gradient(to bottom, #020617, #0f172a)';
        }

        const sunColor = palette.sun;
        const { x, y } = sunData;

        return `
      radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${sunColor}, transparent 50%),
      ${bgStyle}
    `;

    }, [phase, sunData, dark]);

    const weatherFilter = useMemo(() => {
        if (!weather?.icon) return 'none';
        const code = weather.icon;
        if (code.includes('01') || code.includes('02')) return 'saturate(1.1) brightness(1.05)';
        if (code.includes('03') || code.includes('04')) return 'saturate(0.8) brightness(0.95) contrast(0.9)';
        if (code.includes('09') || code.includes('10') || code.includes('11')) return 'saturate(0.6) brightness(0.9) contrast(0.85) hue-rotate(-5deg)';
        if (code.includes('13')) return 'saturate(0.4) brightness(1.1) contrast(0.9)';
        return 'none';
    }, [weather]);


    if (!enabled) return <div className="fixed inset-0 bg-[#f5f5f7] dark:bg-black -z-50 transition-colors duration-500" />;
    if (!sunData) return <div className="fixed inset-0 bg-slate-900 -z-50" />;

    return (
        <>
            <motion.div
                className="fixed inset-0 -z-50 pointer-events-none"
                animate={{
                    background: computedGradient,
                    filter: weatherFilter
                }}
                transition={{
                    duration: 2, // Faster transition for demo
                    ease: "easeInOut"
                }}
            />

            {/* --- DEMO CONTROLS (Floating Bottom Right) - DISABLED FOR PRODUCTION --- */}
            {/*
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 z-[9999] text-white shadow-2xl transition-opacity duration-300 opacity-0 hover:opacity-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Atmosphere Engine</span>
                    <button 
                        onClick={() => setDebugHour(null)} 
                        className={`text-[10px] px-2 py-1 rounded border ${debugHour === null ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}
                    >
                        LIVE 🔴
                    </button>
                </div>
                
                <input 
                    type="range" 
                    min="0" 
                    max="23.9" 
                    step="0.1" 
                    value={debugHour === null ? new Date().getHours() + new Date().getMinutes()/60 : debugHour} 
                    onChange={(e) => setDebugHour(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-2"
                />
                
                <div className="flex justify-between text-[10px] font-mono text-white/70">
                    <span>00:00</span>
                    <span className="text-white font-bold">
                        {debugHour !== null 
                            ? `${Math.floor(debugHour).toString().padStart(2, '0')}:${Math.floor((debugHour % 1) * 60).toString().padStart(2, '0')}` 
                            : 'REALTIME'}
                    </span>
                    <span>24:00</span>
                </div>

                <div className="mt-2 text-[10px] flex gap-2 justify-center border-t border-white/10 pt-2">
                    <span className={`px-2 py-0.5 rounded ${phase === 'dawn' ? 'bg-orange-500/50' : 'bg-transparent'}`}>Dawn</span>
                    <span className={`px-2 py-0.5 rounded ${phase === 'day' ? 'bg-blue-500/50' : 'bg-transparent'}`}>Day</span>
                    <span className={`px-2 py-0.5 rounded ${phase === 'dusk' ? 'bg-pink-500/50' : 'bg-transparent'}`}>Dusk</span>
                    <span className={`px-2 py-0.5 rounded ${phase === 'night' ? 'bg-indigo-900/50' : 'bg-transparent'}`}>Night</span>
                </div>
            </div>
            */}
        </>
    );
}
