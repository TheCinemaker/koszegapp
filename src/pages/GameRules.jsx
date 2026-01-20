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

                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                        <h2 className="text-lg font-bold text-blue-300 mb-2 uppercase tracking-wide">1. A Cél</h2>
                        <p>
                            Kőszeg, 1532. A város ostrom alatt áll. A te feladatod, hogy összegyűjtsd a szétszóródott kulcsdarabokat és megmentsd a várost a pusztulástól.
                        </p>
                    </div>

                    <section>
                        <h2 className="text-lg font-bold text-amber-200 mb-2">Hogyan játssz?</h2>
                        <ul className="list-disc pl-5 space-y-3 marker:text-amber-500">
                            <li>
                                <strong className="text-white">Keress QR Kódokat:</strong> A város nevezetes pontjain elrejtettünk QR kódokat. Keresd a kis táblákat!
                            </li>
                            <li>
                                <strong className="text-white">Szkennelj:</strong> Használd a beépített szkennert vagy a telefonod kameráját a kódok beolvasásához.
                            </li>
                            <li>
                                <strong className="text-white">Válaszolj:</strong> Minden helyszínen egy kérdést kell megválaszolnod, vagy egy feladatot megoldanod a "kulcs" megszerzéséhez.
                            </li>
                            <li>
                                <strong className="text-white">Gyűjts:</strong> Minél több kulcsot szerzel, annál közelebb kerülsz a Vár titkához.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-amber-200 mb-2">Játékmódok</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm text-center">
                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                <div className="font-bold mb-1">Felfedező</div>
                                <div className="opacity-70">Családoknak, gyerekeknek (Könnyebb)</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded border border-white/10">
                                <div className="font-bold mb-1">Történész</div>
                                <div className="opacity-70">Felnőtteknek, történelem rajongóknak (Nehezebb)</div>
                            </div>
                        </div>
                    </section>

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
