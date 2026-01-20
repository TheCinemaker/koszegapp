import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LegalNotice() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex flex-col items-center p-6 pt-24 font-sans">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8"
            >
                <h1 className="text-3xl font-serif text-amber-500 mb-8 border-b border-amber-500/30 pb-4">
                    Jogi Nyilatkozat
                </h1>

                <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-lg space-y-4">
                    <p className="font-bold text-red-400 uppercase tracking-widest text-xs">
                        Figyelmeztetés
                    </p>
                    <p className="leading-relaxed text-white/90">
                        Ez az alkalmazás és annak teljes tartalma <strong>saját szellemi termékem</strong>.
                    </p>
                    <p className="leading-relaxed text-white/90 font-medium">
                        Senki nem használhatja fel az engedélyem nélkül!
                    </p>
                    <p className="leading-relaxed text-white/90 italic">
                        Amennyiben bárki engedély nélkül másolja, felhasználja, vagy ehhez hasonló rendszert készít az ötletem alapján, azzal szemben azonnali jogi lépéseket teszek és beperelem!
                    </p>
                </div>

                <div className="mt-12">
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
