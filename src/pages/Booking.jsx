import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt, FaUsers, FaSearch, FaRegHospital } from 'react-icons/fa';
import { IoBedOutline, IoSparklesOutline, IoShieldCheckmarkOutline, IoMapOutline, IoLocationOutline } from 'react-icons/io5';
import { getDynamicDestination } from '../utils/bookingUtils';
import { LocationContext } from '../contexts/LocationContext';
import { useContext } from 'react';
import { FadeUp } from '../components/AppleMotion';
import toast from 'react-hot-toast';

export default function Booking() {
    const { t } = useTranslation('booking');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { location } = useContext(LocationContext);

    // CJ Affiliate / Booking.com IDs
    // User mentioned: 7885594
    const CJ_PID = "7885594";
    const BOOKING_AID = "7885594"; // Using CJ PID for consistency as requested

    // Default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const [checkIn, setCheckIn] = useState(searchParams.get('checkin') || tomorrow.toISOString().split('T')[0]);
    const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || dayAfter.toISOString().split('T')[0]);
    const [guests, setGuests] = useState(2);
    const [showResults, setShowResults] = useState(false);
    const [searchUrl, setSearchUrl] = useState("");

    const handleSearch = (e) => {
        if (e) e.preventDefault();

        if (new Date(checkOut) <= new Date(checkIn)) {
            toast.error(t('errorInvalidDates'));
            return;
        }

        const destination = getDynamicDestination(location?.lat, location?.lng);
        const baseUrl = "https://www.booking.com/searchresults.html";
        const params = new URLSearchParams({
            ss: destination,
            checkin: checkIn,
            checkout: checkOut,
            group_adults: guests,
            no_rooms: 1,
            aid: BOOKING_AID,
            label: `cj-${CJ_PID}`,
            utm_source: "cj",
            utm_medium: "affiliate",
            utm_campaign: CJ_PID,
            utm_content: "searchbox",
            map: "1"
        });

        const fullUrl = `${baseUrl}?${params.toString()}`;
        setSearchUrl(fullUrl);
        setShowResults(true);

        // Professional New Tab Redirect
        setTimeout(() => {
            window.open(fullUrl, "_blank", "noopener,noreferrer");
            toast.success(t('redirecting'));
        }, 800);
    };

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden bg-[#fbfbfd] dark:bg-[#000000]">

            {/* --- PREMIUM BACKGROUND ELEMENTS --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto px-4 pt-3">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => showResults ? setShowResults(false) : navigate('/')}
                        className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-sm flex items-center justify-center transition-all"
                    >
                        <FaArrowLeft className="text-gray-800 dark:text-white text-sm" />
                    </motion.button>

                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                        {showResults ? "Találatok" : t('title')}
                    </h1>

                    <div className="w-10" />
                </div>

                <AnimatePresence mode="wait">
                    {!showResults ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white/40 dark:bg-gray-900/30 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden"
                        >
                            <div className="p-6 text-center border-b border-gray-100 dark:border-white/5 relative">
                                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-500/30 transform rotate-3">
                                    <IoBedOutline className="text-xl text-white" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                    {t('heroTitle')}
                                </h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                                    {t('heroSubtitle')}
                                </p>
                            </div>

                            {/* Slim Form */}
                            <form onSubmit={handleSearch} className="p-5 space-y-3">

                                {/* Destination - Input Style */}
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">
                                        {t('labelDestination')}
                                    </label>
                                    <div className="w-full h-11 bg-gray-100/50 dark:bg-black/40 border border-transparent rounded-2xl flex items-center px-4 font-bold text-gray-700 dark:text-gray-300 text-sm">
                                        <IoMapOutline className="mr-2 text-blue-500" />
                                        Kőszeg
                                    </div>
                                </div>

                                {/* Dates Row - More compact */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">
                                            {t('labelCheckIn')}
                                        </label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            min={today.toISOString().split('T')[0]}
                                            className="w-full h-11 bg-white/60 dark:bg-black/60 border border-white dark:border-white/10 rounded-2xl px-4 text-[11px] font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">
                                            {t('labelCheckOut')}
                                        </label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            min={checkIn}
                                            className="w-full h-11 bg-white/60 dark:bg-black/60 border border-white dark:border-white/10 rounded-2xl px-4 text-[11px] font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Guests - Compact dynamic feel */}
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">
                                        {t('labelGuests')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={guests}
                                            onChange={(e) => setGuests(parseInt(e.target.value))}
                                            className="w-full h-11 bg-white/60 dark:bg-black/60 border border-white dark:border-white/10 rounded-2xl px-4 text-xs font-black text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none transition-all"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n} className="bg-white dark:bg-gray-800">{n} {t('personCount')}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px]">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Premium CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="submit"
                                    className="w-full h-13 bg-[#007AFF] text-white rounded-2xl font-semibold text-base shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <FaSearch className="text-xs opacity-80" />
                                    {t('btnSearch')}
                                </motion.button>

                                <p className="text-[9px] text-gray-400 text-center font-bold opacity-60 leading-tight uppercase tracking-tighter">
                                    {t('disclaimer')}
                                </p>
                            </form>
                        </motion.div>
                    ) : (
                        /* --- REDIRECTING STATE --- */
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white/40 dark:bg-gray-900/30 backdrop-blur-3xl rounded-[2.5rem] p-12 text-center border border-white/20"
                        >
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                            <h2 className="text-xl font-bold dark:text-white mb-2">Átirányítás a Booking.com-ra...</h2>
                            <p className="text-gray-500 text-sm mb-8">A foglalás egy biztonságos új lapon nyílik meg.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.open(searchUrl, "_blank")}
                                    className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold"
                                >
                                    Ha nem nyílt meg, kattints ide
                                </button>
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="text-gray-500 font-bold py-2"
                                >
                                    ← Vissza a módosításhoz
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
