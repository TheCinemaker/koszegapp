import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function IntroExperience() {
    const navigate = useNavigate();
    const { startGame, gameMode } = useGame();
    const [year, setYear] = useState(2025);
    const [phase, setPhase] = useState('counting');

    useEffect(() => {
        const start = 2025;
        const end = 1532;
        const duration = 4000;
        const frames = 120;
        const step = duration / frames;
        let f = 0;

        const timer = setInterval(() => {
            f++;
            const t = f / frames;
            const eased = 1 - Math.pow(1 - t, 3);
            setYear(Math.floor(start - (start - end) * eased));

            if (f >= frames) {
                clearInterval(timer);
                setYear(end);
                setTimeout(() => setPhase('text'), 800);
            }
        }, step);

        return () => clearInterval(timer);
    }, []);

    const handleEntry = () => {
        // Mark game as started properly
        startGame('intro_gate', gameMode || 'adult');
        navigate('/game/start', { replace: true });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black selection:bg-white/20">

            {/* FÁZIS 1 – ÉV */}
            <motion.div
                key={year}
                className="text-7xl font-light tracking-tighter font-serif text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                {year}
            </motion.div>

            {/* FÁZIS 2 – SZÖVEG */}
            {phase === 'text' && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
                    className="mt-8 text-xs uppercase tracking-[0.3em] font-sans text-center text-white/80"
                >
                    Az idő nem egyetlen korból való.
                </motion.p>
            )}

            {/* FÁZIS 3 – CTA */}
            {phase === 'text' && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1 }}
                    onClick={handleEntry}
                    className="mt-24 text-[10px] uppercase tracking-[0.4em] text-blue-300 border-b border-transparent hover:border-blue-300/30 pb-2 transition-all opacity-80 hover:opacity-100"
                >
                    Belépek az időkapun →
                </motion.button>
            )}

        </div>
    );
}
