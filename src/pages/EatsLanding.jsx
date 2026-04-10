import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IoRestaurant, IoArrowForward, IoTime } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';

export default function EatsLanding() {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurants = async () => {
            const { data } = await supabase.from('restaurants').select('is_open');
            if (data) setRestaurants(data);
            setLoading(false);
        };
        fetchRestaurants();
    }, []);

    const openCount = useMemo(() => {
        return restaurants.filter(r => r.is_open).length;
    }, [restaurants]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans">
            
            {/* AMBIENT BACKGROUND IMAGE */}
            <motion.div 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="absolute inset-0 z-0"
            >
                <img 
                    src="/images/marketing/eats-hero.png" 
                    alt="KőszegEats Hero" 
                    className="h-full w-full object-cover opacity-80"
                />
                
                {/* DARK GRADIENT OVERLAY (Apple Style) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
            </motion.div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-6 pb-24 text-center sm:pb-32">
                
                {/* LOGO OR TOP ICON */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute top-12 flex flex-col items-center"
                >
                    <div className="h-16 w-16 mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                        <IoRestaurant className="text-3xl text-amber-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-white/60">visitKőszeg</span>
                </motion.div>

                {/* MAIN HEADLINE */}
                <div className="max-w-xl">
                    <motion.h1 
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                        className="mb-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl"
                    >
                        Elindult Kőszeg első <br/>
                        <span className="bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent">
                            online ételrendelése!
                        </span>
                    </motion.h1>

                    {/* DYNAMIC INFO CARD */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="inline-flex items-center gap-2 mb-12 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl"
                    >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-sm font-bold text-white/80">
                            {loading ? 'Helyek keresése...' : `Jelenleg ${openCount} étterem várja a rendelésed`}
                        </span>
                    </motion.div>

                    {/* BIG ENTRANCE BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)", color: "#000" }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        onClick={() => navigate('/eats')}
                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-white/10 px-8 py-5 text-lg font-black tracking-widest text-white backdrop-blur-2xl transition-all duration-500 sm:w-auto"
                    >
                        BELÉPÉS AZ ÉTLAPOKHOZ
                        <IoArrowForward className="transition-transform group-hover:translate-x-2" />
                    </motion.button>
                </div>

                {/* FOOTER INFO */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 2, duration: 2 }}
                    className="absolute bottom-8 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                >
                    <span>Kőszegi Éttermek</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-800" />
                    <span>Helyi kiszállítás</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-800" />
                    <span>Mindig frissen</span>
                </motion.div>
            </div>

            {/* AMBIENT NOISE OVERLAY */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        </div>
    );
}
