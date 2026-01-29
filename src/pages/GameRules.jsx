import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function GameRules() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex flex-col items-center p-6 pt-16 font-sans">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full pb-20"
            >
                <h1 className="text-3xl font-serif text-amber-500 mb-8 border-b border-amber-500/30 pb-4 text-center">
                    Játékszabályok
                </h1>

                <div className="space-y-8 text-white/80 leading-relaxed font-light">

                    {/* Section 1: Introduction */}
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10 space-y-4">
                        <p className="font-bold text-amber-500">Kőszeg, 1532. A város ostrom alatt áll.</p>
                        <p>
                            A te feladatod, hogy összegyűjtsd az idővonalon szétszóródott kulcsdarabokat és megmentsd a várost a pusztulástól. Így bezárhatod a várkaput!
                        </p>
                    </div>

                    {/* Section 2: Gameplay */}
                    <div className="space-y-4">
                        <p>
                            Minden helyszínen egy emléket olvashatsz az adott helyszínről. Az ajánlott útvonalhoz minden megállónál egy feladatot kell megoldanod, így gyorsabban bezárhatod az időkaput!
                        </p>
                    </div>

                    {/* Section 3: Mystery */}
                    <div className="bg-blue-500/10 p-6 rounded-lg border border-blue-500/20 italic text-blue-200">
                        <p>
                            Minél több kulcsot szerzel, annál közelebb kerülsz a Vár titkához. Mert vannak titkok, hidd el! Misztikus, rejtélyes titkok, amit csak a falak és kövek ismernek! Minden titkot meg kell ismerned!
                        </p>
                    </div>

                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/game/start')}
                        className="
                    px-6 py-3 
                    text-blue-300 
                    uppercase tracking-widest text-xs 
                    hover:bg-blue-300/10 
                    border border-blue-300/30 
                    rounded transition-colors
                "
                    >
                        ← Vissza a játékhoz
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
