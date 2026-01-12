import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTrashOutline, IoWarningOutline, IoArrowBack, IoArrowForward, IoLeafOutline, IoWaterOutline, IoInformationCircleOutline, IoSearchOutline, IoCheckmarkCircle, IoLogIn, IoLogOut, IoPerson, IoCalendar } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isAfter, isSameDay, addDays, getDay, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';

import scheduleData from '../data/wasteSchedule.json';
import newsData from '../data/news.json';

import DoctorsModal from '../components/DoctorsModal';
import ProvidersModal from '../components/ProvidersModal';
import CityServicesModal from '../components/CityServicesModal';
import ShopsModal from '../components/ShopsModal';
import TransportModal from '../components/TransportModal';
import MassScheduleModal from '../components/MassScheduleModal';

import UserBookingsRibbon from '../components/UserBookingsRibbon';
import UserMessageRibbon from '../components/UserMessageRibbon';

import { FadeUp, ParallaxImage } from '../components/AppleMotion';

const DAY_MAP_HU = {
    'Vasárnap': 0, 'Hétfő': 1, 'Kedd': 2, 'Szerda': 3, 'Csütörtök': 4, 'Péntek': 5, 'Szombat': 6
};

// --- HELPER COMPONENT: Feature Card ---
const FeatureCard = ({ title, subtitle, icon, colorFrom, colorTo, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="
            cursor-pointer 
            relative overflow-hidden
            bg-white/60 dark:bg-[#1a1c2e]/60 
            backdrop-blur-[30px] saturate-150
            rounded-[2.5rem] 
            border border-white/60 dark:border-white/10 
            shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
            p-5
            flex flex-col justify-between 
            h-full min-h-[110px]
            group
        "
    >
        {/* Abstract Background Gradient */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-20 blur-[50px] rounded-full group-hover:opacity-30 transition-opacity duration-500`} />

        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} flex items-center justify-center text-white text-2xl shadow-lg mb-3 transform group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                {title}
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {subtitle}
            </p>
        </div>

        <div className="relative z-10 flex justify-end mt-4">
            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-300">
                <IoArrowForward className="text-lg" />
            </div>
        </div>
    </motion.div>
);

export default function LocalDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showTomorrowDetails, setShowTomorrowDetails] = useState(false);
    const [providers, setProviders] = useState([]);
    const { user, logout } = useAuth(); // Destructure logout here

    useEffect(() => {
        const fetchProviders = async () => {
            const { data, error } = await supabase.from('providers').select('*');
            if (error) console.error("Error fetching providers:", error);
            else setProviders(data || []);
        };
        fetchProviders();
    }, []);

    // Modals
    const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
    const [showDoctorsModal, setShowDoctorsModal] = useState(false);
    const [showCityServicesModal, setShowCityServicesModal] = useState(false);
    const [showShopsModal, setShowShopsModal] = useState(false);
    const [showTransportModal, setShowTransportModal] = useState(false);
    const [showMassModal, setShowMassModal] = useState(false);

    // --- WASTE LOGIC ---
    const getNextDateForZone = (code) => {
        if (!code) return null;
        const today = startOfDay(new Date());
        const dates = Object.keys(scheduleData.schedule).sort();
        for (const dStr of dates) {
            const d = parseISO(dStr);
            if (isAfter(d, today) || isSameDay(d, today)) {
                const codes = scheduleData.schedule[dStr];
                if (codes.includes(code)) return d;
            }
        }
        return null;
    };
    const formatDate = (date) => {
        if (!date) return '-';
        if (typeof date === 'string') return date;
        return format(date, 'yyyy. MM. dd.', { locale: hu }) + ` (${format(date, 'EEEE', { locale: hu })})`;
    };

    const tomorrowInfo = useMemo(() => {
        const now = new Date();
        const tomorrow = addDays(now, 1);
        const tomorrowDoW = format(tomorrow, 'EEEE', { locale: hu });
        const blackDay = tomorrowDoW.charAt(0).toUpperCase() + tomorrowDoW.slice(1);

        const tomorrow2026 = new Date(tomorrow);
        tomorrow2026.setFullYear(2026);
        const dateStr = format(tomorrow2026, 'yyyy-MM-dd');

        const scheduleCodes = scheduleData.schedule[dateStr] || [];
        const activeYellow = scheduleCodes.filter(z => z.startsWith('SZ'));
        const activeGreen = scheduleCodes.filter(z => z.startsWith('Z') || z.startsWith('K'));

        const blackStreets = [];
        const yellowStreets = [];
        const greenStreets = [];

        Object.entries(scheduleData.streets).forEach(([street, codes]) => {
            if (codes.black === blackDay) blackStreets.push(street);
            if (codes.yellow && activeYellow.includes(codes.yellow)) yellowStreets.push(street);
            if (codes.green && activeGreen.includes(codes.green)) greenStreets.push(street);
        });

        return {
            date: formatDate(tomorrow2026),
            blackDay,
            yellowZones: activeYellow,
            greenZones: activeGreen,
            blackStreets: blackStreets.sort(),
            yellowStreets: yellowStreets.sort(),
            greenStreets: greenStreets.sort(),
            hasPickup: blackStreets.length > 0 || yellowStreets.length > 0 || greenStreets.length > 0
        };
    }, []);

    const filteredStreets = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const entries = Object.entries(scheduleData.streets);

        return entries
            .filter(([name]) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term))
            .slice(0, 30)
            .map(([name, codes]) => ({
                street: name,
                nextBlack: codes.black,
                nextYellow: formatDate(getNextDateForZone(codes.yellow)),
                nextGreen: formatDate(getNextDateForZone(codes.green)),
                yellowCode: codes.yellow,
                greenCode: codes.green
            }));
    }, [searchTerm]);


    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden pt-2 pb-24">

            {/* --- HERO SECTION --- */}
            <div className="relative pt-12 pb-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="w-12 h-12 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                            <IoArrowBack className="text-xl text-zinc-900 dark:text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Kőszegieknek</h1>
                            {user ? (
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold flex flex-wrap items-center gap-1 leading-tight">
                                    <span>Szia, {user.user_metadata?.nickname || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('.')[1]?.split('@')[0] || 'Vendég'}! 👋</span>
                                    <span className="text-zinc-500 font-normal dark:text-zinc-400 text-sm">Jó, hogy itt vagy!</span>
                                </p>
                            ) : (
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Helyi információk és szolgáltatások</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Auth Button */}
                        {/* Auth Button - DISABLED */}
                        {/* {user ? (
                            <button
                                onClick={logout}
                                className="flex px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-lg border border-red-200 dark:border-red-900/50"
                            >
                                <IoLogOut className="text-lg" />
                                <span>Kilépés</span>
                            </button>
                        ) : (
                            <Link to="/auth" className="flex px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-bold items-center gap-2 hover:scale-105 transition-transform shadow-lg">
                                <IoLogIn className="text-lg" />
                                <span>Belépés</span>
                            </Link>
                        )} */}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">

                {/* --- WASTE MONITOR SECTION (FEATURED) --- */}
                <FadeUp delay={0.1}>
                    <motion.div
                        className="
                            relative overflow-hidden
                            bg-white dark:bg-[#151515]
                            rounded-[2.5rem]
                            border border-zinc-100 dark:border-white/10
                            shadow-2xl shadow-zinc-200/50 dark:shadow-black/50
                        "
                    >
                        {/* Decorative background blob */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-100/50 to-transparent dark:from-orange-900/10 pointer-events-none blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

                        <div className="p-8 sm:p-10 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start gap-8">

                                {/* Left: Search & Info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30">
                                            ♻️
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Hulladéknaptár</h2>
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Intelligens értesítő rendszer</p>
                                        </div>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative group">
                                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors text-lg" />
                                        <input
                                            type="text"
                                            placeholder="Keresd meg az utcádat..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="
                                                w-full h-14 pl-12 pr-4 rounded-2xl
                                                bg-zinc-100 dark:bg-zinc-800/50
                                                border-2 border-transparent focus:border-orange-500/50
                                                text-zinc-900 dark:text-white font-medium
                                                placeholder-zinc-400
                                                focus:outline-none focus:ring-4 focus:ring-orange-500/10
                                                transition-all
                                            "
                                        />
                                    </div>

                                    {/* Quick Status / Global Info */}
                                    {!searchTerm && (
                                        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl p-5 border border-zinc-100 dark:border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Holnapi körkép</span>
                                            </div>

                                            {tomorrowInfo.hasPickup ? (
                                                <div className="space-y-3">
                                                    <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm">
                                                        Holnap (<span className="text-zinc-900 dark:text-white font-bold">{tomorrowInfo.date}</span>) az alábbi hulladékokat szállítják:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {tomorrowInfo.blackStreets.length > 0 && (
                                                            <span className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1">
                                                                🗑️ Vegyes ({tomorrowInfo.blackDay})
                                                            </span>
                                                        )}
                                                        {tomorrowInfo.yellowStreets.length > 0 && (
                                                            <span className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold flex items-center gap-1">
                                                                🟡 Szelektív
                                                            </span>
                                                        )}
                                                        {tomorrowInfo.greenStreets.length > 0 && (
                                                            <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1">
                                                                🌿 Zöld
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setShowTomorrowDetails(!showTomorrowDetails)}
                                                        className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                                                    >
                                                        <IoInformationCircleOutline />
                                                        {showTomorrowDetails ? 'Részletes utcalista elrejtése' : 'Melyik utcákban?'}
                                                    </button>

                                                    <AnimatePresence>
                                                        {showTomorrowDetails && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pt-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-2 border-t border-zinc-200 dark:border-white/5 mt-3">
                                                                    {tomorrowInfo.blackStreets.length > 0 && <p><strong className="text-zinc-700 dark:text-zinc-300">Vegyes:</strong> {tomorrowInfo.blackStreets.join(', ')}</p>}
                                                                    {tomorrowInfo.yellowStreets.length > 0 && <p><strong className="text-yellow-600">Szelektív:</strong> {tomorrowInfo.yellowStreets.join(', ')}</p>}
                                                                    {tomorrowInfo.greenStreets.length > 0 && <p><strong className="text-green-600">Zöld:</strong> {tomorrowInfo.greenStreets.join(', ')}</p>}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-zinc-500">
                                                    <IoCheckmarkCircle className="text-xl text-green-500" />
                                                    <span className="text-sm">Holnap nincs tervezett szállítás Kőszegen.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Result Cards (Scrollable) */}
                                <div className="w-full md:w-[45%] md:max-h-[300px] md:overflow-y-auto custom-scrollbar md:pl-2">
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {filteredStreets.map((item, idx) => (
                                                <motion.div
                                                    key={item.street}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="bg-zinc-50 dark:bg-zinc-800/80 rounded-xl p-4 border border-zinc-100 dark:border-white/5"
                                                >
                                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-3 text-lg">{item.street}</h3>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div className="bg-white dark:bg-black/20 rounded-lg p-2 flex flex-col items-center justify-center border border-zinc-100 dark:border-white/5">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Kommunális</span>
                                                            <span className="font-bold text-zinc-700 dark:text-zinc-200">{item.nextBlack}</span>
                                                        </div>
                                                        {(item.nextYellow || item.nextGreen) && (
                                                            <div className={`rounded-lg p-2 flex flex-col items-center justify-center border ${item.nextYellow ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100' : 'bg-green-50 dark:bg-green-900/10 border-green-100'}`}>
                                                                <span className="text-[10px] font-bold opacity-60 uppercase">{item.nextYellow ? 'Szelektív' : 'Zöld'}</span>
                                                                <span className="font-bold">{item.nextYellow || item.nextGreen}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {searchTerm.length >= 2 && filteredStreets.length === 0 && (
                                            <div className="text-center py-8 text-zinc-400">
                                                Nincs találat...
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </FadeUp>

                {/* --- SERVICES GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* NEW: Booking Card moved to grid */}
                    {/* Booking Card - COMING SOON */}
                    <FeatureCard
                        title="Időpontfoglaló"
                        subtitle="HAMAROSAN..."
                        icon={<span>📅</span>}
                        colorFrom="from-gray-500"
                        colorTo="to-zinc-600"
                        delay={0.15}
                        onClick={() => {
                            toast('🚧 A foglalási rendszer fejlesztés alatt!', {
                                icon: '📅',
                                style: {
                                    borderRadius: '20px',
                                    background: '#333',
                                    color: '#fff',
                                },
                            });
                        }}
                    />

                    <FeatureCard
                        title="Orvosi Rendelők"
                        subtitle="Háziorvosok, szakrendelések és ügyeleti információk"
                        icon={<span>🏥</span>}
                        colorFrom="from-red-400"
                        colorTo="to-pink-600"
                        delay={0.2}
                        onClick={() => setShowDoctorsModal(true)}
                    />


                    <FeatureCard
                        title="Templomok & Hitélet"
                        subtitle="Miserendek és egyházi hírek"
                        icon={<span>⛪</span>}
                        colorFrom="from-orange-400"
                        colorTo="to-amber-600"
                        delay={0.25}
                        onClick={() => setShowMassModal(true)}
                    />

                    <FeatureCard
                        title="Boltok & Üzletek"
                        subtitle="Nyitvatartások, elérhetőségek és helyi vállalkozások"
                        icon={<span>🛒</span>}
                        colorFrom="from-yellow-400"
                        colorTo="to-orange-500"
                        delay={0.3}
                        onClick={() => setShowShopsModal(true)}
                    />

                    <FeatureCard
                        title="Városi Szolgáltatások"
                        subtitle="Posta, Kormányablak, Piac és egyéb hivatalok"
                        icon={<span>🏙️</span>}
                        colorFrom="from-purple-400"
                        colorTo="to-indigo-600"
                        delay={0.4}
                        onClick={() => setShowCityServicesModal(true)}
                    />

                    <FeatureCard
                        title="Menetrendek"
                        subtitle="Busz és vonat indulások, helyi közlekedés"
                        icon={<span>🚌</span>}
                        colorFrom="from-green-400"
                        colorTo="to-emerald-600"
                        delay={0.5}
                        onClick={() => setShowTransportModal(true)}
                    />
                </div>

                {/* --- NEWS FEED --- */}
                <FadeUp delay={0.6} className="pb-8">
                    <motion.div
                        className="bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 p-8 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center dark:bg-blue-400/10 dark:text-blue-400">
                                    <IoInformationCircleOutline className="text-2xl" />
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Friss Hírek</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {newsData && newsData.items ? newsData.items.slice(0, 3).map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block group bg-white dark:bg-black/20 rounded-2xl p-5 border border-zinc-100 dark:border-white/5 hover:border-blue-500/30 transition-colors"
                                >
                                    <span className="text-[10px] font-bold text-blue-500 mb-2 block">{item.date}</span>
                                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-500 transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>
                                </a>
                            )) : (
                                <p className="text-zinc-500 text-sm">Nincsenek friss hírek.</p>
                            )}
                        </div>
                    </motion.div>
                </FadeUp>

            </div>

            {/* Modals */}
            <DoctorsModal isOpen={showDoctorsModal} onClose={() => setShowDoctorsModal(false)} />
            <CityServicesModal isOpen={showCityServicesModal} onClose={() => setShowCityServicesModal(false)} />
            <ShopsModal isOpen={showShopsModal} onClose={() => setShowShopsModal(false)} />
            <TransportModal isOpen={showTransportModal} onClose={() => setShowTransportModal(false)} />
            <MassScheduleModal isOpen={showMassModal} onClose={() => setShowMassModal(false)} />

            {/* Providers Selection Modal */}
            <AnimatePresence>
                {isProvidersModalOpen && (
                    <ProvidersModal
                        isOpen={isProvidersModalOpen}
                        onClose={() => setIsProvidersModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <UserBookingsRibbon />
            <UserMessageRibbon />
        </div >
    );
}
