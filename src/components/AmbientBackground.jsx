import React, { useState, useEffect, useMemo } from 'react';
import SunCalc from 'suncalc';
import { motion, AnimatePresence } from 'framer-motion';

// Kőszeg Coordinates
const COORDS = { lat: 47.3895, lng: 16.5410 };

// Color Palettes for Phases
const PALETTES = {
    night: {
        bg: 'linear-gradient(to bottom, #020617, #0f172a)', // Near black
        sun: 'rgba(148, 163, 184, 0.15)', // Moon glow
        particleColor: 'rgba(255, 255, 255, 0.4)',
    },
    dawn: {
        bg: 'linear-gradient(to bottom, #1e1b4b, #7c2d12, #ea580c)', // Indigo -> Deep Orange
        sun: 'rgba(255, 186, 115, 0.35)',
        particleColor: 'rgba(255, 255, 255, 0.5)',
    },
    day: {
        bg: 'linear-gradient(to bottom, #0ea5e9, #38bdf8)', // Sky Blue
        sun: 'rgba(255, 255, 255, 0.35)',
        particleColor: 'rgba(255, 255, 255, 0.6)',
    },
    dusk: {
        bg: 'linear-gradient(to bottom, #1e3a8a, #831843, #be185d)', // Deep Blue -> Pink/Red
        sun: 'rgba(255, 113, 113, 0.4)',
        particleColor: 'rgba(255, 255, 255, 0.4)',
    }
};

export default function AmbientBackground({ weather, upcoming = [], dark }) {
    const [sunData, setSunData] = useState(null);
    const [phase, setPhase] = useState('day');
    const [enabled, setEnabled] = useState(localStorage.getItem('ambientMode') === 'true');

    // Update Ambient Toggle State
    useEffect(() => {
        const handleToggle = () => {
            setEnabled(localStorage.getItem('ambientMode') === 'true');
        };
        window.addEventListener('ambient-mode-change', handleToggle);
        return () => window.removeEventListener('ambient-mode-change', handleToggle);
    }, []);

    // Update Sun Position & Phase
    useEffect(() => {
        const updateSun = () => {
            const now = new Date();
            const times = SunCalc.getTimes(now, COORDS.lat, COORDS.lng);
            const position = SunCalc.getPosition(now, COORDS.lat, COORDS.lng);

            // Determine Phase
            let newPhase = 'day';
            const alt = position.altitude;

            if (alt < -0.2) newPhase = 'night';
            else if (alt >= -0.2 && alt < 0) {
                newPhase = now < times.sunrise ? 'dawn' : 'dusk';
            } else {
                newPhase = 'day';
            }

            // More precise time-based phase override
            if (now >= times.nightEnd && now < times.sunrise) newPhase = 'dawn';
            else if (now >= times.sunset && now < times.night) newPhase = 'dusk';
            else if (now >= times.night || now < times.nightEnd) newPhase = 'night';
            else newPhase = 'day';

            setPhase(newPhase);

            // Calculate Visual Sun/Moon Position
            const totalMinutes = now.getHours() * 60 + now.getMinutes();
            const xPercent = (totalMinutes / 1440) * 100;
            const yPercent = 80 - (Math.max(-0.5, alt) / (Math.PI / 2)) * 75;

            setSunData({ x: xPercent, y: yPercent });
        };

        updateSun();
        const interval = setInterval(updateSun, 60000);
        return () => clearInterval(interval);
    }, []);

    // Weather Visual States
    const weatherConfig = useMemo(() => {
        if (!weather?.icon) return { type: 'clear', intensity: 0 };
        const code = weather.icon;

        if (code.includes('01') || code.includes('02')) return { type: 'clear', intensity: 0 };
        if (code.includes('03') || code.includes('04')) return { type: 'clouds', intensity: 0.5 };
        if (code.includes('09') || code.includes('10')) return { type: 'rain', intensity: 0.7 };
        if (code.includes('11')) return { type: 'storm', intensity: 1.0 };
        if (code.includes('13')) return { type: 'snow', intensity: 0.8 };

        return { type: 'clear', intensity: 0 };
    }, [weather]);

    // Predictive Logic: Is rain coming in the next 6 hours?
    const predictiveStatus = useMemo(() => {
        if (!upcoming || upcoming.length === 0) return { imminentRain: false, factor: 0 };

        // Check first 2 blocks (approx 6 hours)
        const imminentBlocks = upcoming.slice(0, 2);
        const rainBlock = imminentBlocks.find(b =>
            b.icon.includes('09') || b.icon.includes('10') || b.icon.includes('11') || b.pop > 0.3
        );

        if (rainBlock) {
            // Higher factor if it's the very next block or high probability
            return {
                imminentRain: true,
                factor: rainBlock.pop > 0.6 ? 1 : 0.6
            };
        }

        return { imminentRain: false, factor: 0 };
    }, [upcoming]);

    const computedGradient = useMemo(() => {
        if (!sunData) return '';
        const palette = PALETTES[phase];
        let bgStyle = palette.bg;

        if (dark) {
            bgStyle = 'linear-gradient(to bottom, #020617, #0f172a)';
        }

        // Current Weather overrides
        if (weatherConfig.type === 'rain' || weatherConfig.type === 'storm' || weatherConfig.type === 'clouds') {
            if (!dark) bgStyle = 'linear-gradient(to bottom, #475569, #94a3b8)'; // Slate grey sky
        }

        // Predictive Darkening (The "Storm is Coming" effect)
        // If not already raining, but rain is imminent, blend to a darker version of the current palette
        if (predictiveStatus.imminentRain && !dark && weatherConfig.type === 'clear') {
            const darkFactor = predictiveStatus.factor;
            // Transition from original sky towards a moody "pre-storm" slate
            // We use a custom overlay behavior in the CSS or here
            bgStyle = `linear-gradient(to bottom, #334155, #64748b)`; // Dark slate
        }

        const { x, y } = sunData;
        const sunColor = palette.sun;

        return `radial-gradient(circle at ${x}% ${y}%, ${sunColor}, transparent 40%), ${bgStyle}`;
    }, [phase, sunData, dark, weatherConfig, predictiveStatus]);

    if (!enabled) return null;

    return (
        <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden select-none">
            {/* Base Atmosphere Layer */}
            <motion.div
                className="absolute inset-0"
                animate={{ background: computedGradient }}
                transition={{ duration: 3, ease: "easeInOut" }}
            />

            {/* Cloud Overlays (Subtle Drifting Shadows) */}
            {(weatherConfig.type === 'clouds' || weatherConfig.type === 'rain' || weatherConfig.type === 'storm' || predictiveStatus.imminentRain) && (
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-white/10 blur-[100px] animate-drift-slow"
                        animate={{ opacity: predictiveStatus.imminentRain ? 0.2 : 0.1 }}
                    />
                    <motion.div
                        className="absolute top-[10%] left-[20%] w-[80%] h-[40%] bg-black/5 blur-[80px] animate-drift-medium"
                        animate={{ opacity: predictiveStatus.imminentRain ? 0.15 : 0.05 }}
                    />
                </div>
            )}

            {/* Rain Simulation */}
            {(weatherConfig.type === 'rain' || weatherConfig.type === 'storm') && (
                <div className="absolute inset-0 rain-container opacity-40">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white/30 w-[1px] h-[15vh] rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `rain-fall ${0.5 + Math.random() * 0.5}s linear infinite`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Snow Simulation */}
            {weatherConfig.type === 'snow' && (
                <div className="absolute inset-0 snow-container opacity-60">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white rounded-full blur-[1px]"
                            style={{
                                width: `${2 + Math.random() * 4}px`,
                                height: `${2 + Math.random() * 4}px`,
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                animation: `snow-fall ${3 + Math.random() * 5}s linear infinite`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Vignette / Depth Layer */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.1)] pointer-events-none" />

            {/* Inline Styles for Weather Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes drift-slow {
                    0% { transform: translateX(-10%) translateY(0); }
                    50% { transform: translateX(10%) translateY(5%); }
                    100% { transform: translateX(-10%) translateY(0); }
                }
                .animate-drift-slow { animation: drift-slow 60s ease-in-out infinite; }

                @keyframes drift-medium {
                    0% { transform: translateX(20%) translateY(0); }
                    50% { transform: translateX(-10%) translateY(-5%); }
                    100% { transform: translateX(20%) translateY(0); }
                }
                .animate-drift-medium { animation: drift-medium 45s ease-in-out infinite; }

                @keyframes rain-fall {
                    0% { transform: translateY(-100%) rotate(15deg); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(800%) rotate(15deg); opacity: 0; }
                }

                @keyframes snow-fall {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(110vh) translateX(20px); opacity: 0; }
                }
            `}} />
        </div>
    );
}
