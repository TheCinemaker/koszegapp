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
                    <p className="font-bold text-red-400 uppercase tracking-widest text-xs mb-4">
                        Szerzői jogi védelem
                    </p>
                    <p className="leading-relaxed text-white/90 text-sm">
                        A KőszegAPP alkalmazás, annak teljes tartalma, működési koncepciója, forráskódja, grafikai megjelenése, adatstruktúrája és egyedi megoldásai szerzői jogi védelem alatt álló szellemi alkotások, amelyek kizárólag a jogosult tulajdonát képezik.
                    </p>
                    <p className="leading-relaxed text-white/90 text-sm">
                        Az alkalmazás bármilyen formában történő másolása, felhasználása, átdolgozása, terjesztése, visszafejtése, illetve az alkalmazás működésével vagy koncepciójával lényegében megegyező vagy ahhoz hasonló rendszer létrehozása a jogosult előzetes írásos engedélye nélkül tilos.
                    </p>
                    <p className="leading-relaxed text-white/90 text-sm italic border-t border-white/10 pt-4 mt-4">
                        A jogosulatlan felhasználás jogsértésnek minősül, és polgári jogi, valamint szükség esetén büntetőjogi eljárást vonhat maga után. A jogosult fenntartja a jogot, hogy jogsértés esetén haladéktalanul jogi lépéseket tegyen, ideértve a kártérítési igény érvényesítését is.
                    </p>
                    <p className="text-right text-xs text-white/50 uppercase tracking-widest mt-2">
                        Minden jog fenntartva.
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
