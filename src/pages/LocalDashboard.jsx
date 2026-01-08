import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IoTrashOutline, IoWarningOutline, IoArrowBack, IoArrowForward } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter, isSameDay, addDays, getDay, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import scheduleData from '../data/wasteSchedule.json';
import newsData from '../data/news.json';
import DoctorsModal from '../components/DoctorsModal';
import CityServicesModal from '../components/CityServicesModal';
import ShopsModal from '../components/ShopsModal';
import TransportModal from '../components/TransportModal';

const DAY_MAP_HU = {
    'Vasárnap': 0,
    'Hétfő': 1,
    'Kedd': 2,
    'Szerda': 3,
    'Csütörtök': 4,
    'Péntek': 5,
    'Szombat': 6
};

export default function LocalDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showTomorrowDetails, setShowTomorrowDetails] = useState(false);
    const [showDoctorsModal, setShowDoctorsModal] = useState(false);
    const [showCityServicesModal, setShowCityServicesModal] = useState(false);
    const [showShopsModal, setShowShopsModal] = useState(false);
    const [showTransportModal, setShowTransportModal] = useState(false);

    const getNextDayOfWeek = (dayName) => {
        if (!dayName) return '-';
        // Use fixed date for 2026 simulation if needed, but app is live so use real date?
        // User provided 2026 PDF. If we are in 2025, we can't really use "today".
        // BUT the user wants to use it NOW.
        // The PDF is for 2026.
        // If I use `new Date()`, it will look for 2025 dates which are not in the JSON (keys are 2026-...).
        // I should probably simulate "today" as being in 2026 matching current month/day?
        // OR just tell the user "This is for 2026".
        // User conversation implies they want to use it.
        // However, if I use `new Date()` (2025), `isAfter` will work for 2026 dates.
        // BUT `getNextDayOfWeek` uses `addDays` on `today`. 
        // If today is Tuesday, it finds next Tuesday.
        // The black bin schedule is just "Tuesday". That is valid in 2025 too.
        // The DATE specific schedule (Yellow/Green) is 2026.
        // So "Next Yellow" will always be in 2026.
        // That's fine.

        // For "Tomorrow's Pickup" logic:
        // If today is 2025-01-08, tomorrow is 2025-01-09.
        // The schedule keys are 2026-01-09.
        // So looking up `schedule['2025-01-09']` will fail.
        // Hack: We should map current date to 2026 for lookup if we want to test "Current day" logic with 2026 data.
        // Or just be honest that it shows 2026 data.
        // But the user asked "Ma hol kell kitenni?".
        // I'll assume for the "Current Status" card I should project the current MM-DD to 2026 to show what *would* happen.

        const today = startOfDay(new Date());
        const targetDay = DAY_MAP_HU[dayName];
        if (targetDay === undefined) return dayName;

        for (let i = 0; i < 14; i++) {
            const d = addDays(today, i);
            if (getDay(d) === targetDay) {
                return d;
            }
        }
        return null;
    };

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

    // --- Tomorrow's Schedule Logic ---
    const tomorrowInfo = useMemo(() => {
        // For demo purposes, we might need to "fake" looking at 2026 if we want to see hits.
        // But `days` (Black bin) work on actual day of week.
        // Let's use real dates.

        const now = new Date();
        const tomorrow = addDays(now, 1);
        const tomorrowDoW = format(tomorrow, 'EEEE', { locale: hu }); // e.g. "Szerda"

        // Black Bin: Streets where black == tomorrowDoW
        // We define it by Day Name.
        const blackDay = tomorrowDoW.charAt(0).toUpperCase() + tomorrowDoW.slice(1);

        // Selective/Green: Look up exact date string in schedule
        // ISSUE: Schedule is 2026. Real time is 2025 or 2026.
        // If we are in 2025, looking up 2025 date returns nothing.
        // I will check BOTH real tomorrow AND (tomorrow + 1 year) to be helpful?
        // Or just check 2026 equivalent of tomorrow.
        const tomorrow2026 = new Date(tomorrow);
        tomorrow2026.setFullYear(2026);
        const dateStr = format(tomorrow2026, 'yyyy-MM-dd');

        const scheduleCodes = scheduleData.schedule[dateStr] || [];

        // Collect which types are active
        const activeYellow = scheduleCodes.filter(z => z.startsWith('SZ'));
        const activeGreen = scheduleCodes.filter(z => z.startsWith('Z') || z.startsWith('K')); // K is also green sometimes? Z1/Z2 refers to Green.

        // Collect Streets
        const blackStreets = [];
        const yellowStreets = [];
        const greenStreets = [];

        Object.entries(scheduleData.streets).forEach(([street, codes]) => {
            // Check Black
            if (codes.black === blackDay) {
                blackStreets.push(street);
            }
            // Check Yellow
            if (codes.yellow && activeYellow.includes(codes.yellow)) {
                yellowStreets.push(street);
            }
            // Check Green
            if (codes.green && activeGreen.includes(codes.green)) {
                greenStreets.push(street);
            }
        });

        const hasPickup = blackStreets.length > 0 || yellowStreets.length > 0 || greenStreets.length > 0;

        return {
            date: formatDate(tomorrow2026), // Show the 2026 date we are checking
            blackDay: blackDay,
            yellowZones: activeYellow,
            greenZones: activeGreen,
            blackStreets: blackStreets.sort(),
            yellowStreets: yellowStreets.sort(),
            greenStreets: greenStreets.sort(),
            hasPickup
        };
    }, []);



    const filteredStreets = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];

        const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Convert streets object to array
        const entries = Object.entries(scheduleData.streets);

        return entries
            .filter(([name]) => {
                const normName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return normName.includes(term);
            })
            .slice(0, 50) // Limit to 50 results to avoid lag
            .map(([name, codes]) => {
                const nextBlack = getNextDayOfWeek(codes.black);
                const nextYellow = getNextDateForZone(codes.yellow);
                const nextGreen = getNextDateForZone(codes.green);

                return {
                    street: name,
                    nextBlack: formatDate(nextBlack),
                    nextYellow: formatDate(nextYellow),
                    nextGreen: formatDate(nextGreen),
                    yellowCode: codes.yellow,
                    greenCode: codes.green,
                    blackDay: codes.black
                };
            });
    }, [searchTerm]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-10 pb-24 px-4 min-h-screen"
        >
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all">
                        <IoArrowBack className="text-2xl text-gray-800 dark:text-white" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                            KőszegInfo
                        </h1>
                    </div>
                </div>

                {/* Waste Schedule Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                        relative overflow-hidden
                        bg-white/40 dark:bg-[#1a1c2e]/40
                        backdrop-blur-[25px] saturate-[1.8]
                        rounded-[2rem]
                        border border-white/50 dark:border-white/10
                        shadow-xl
                        p-6 sm:p-8
                    "
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl shadow-lg">
                            <IoTrashOutline />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">SzemetesAPP</h2>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Utca neve (kezdj el gépelni)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="
                                w-full h-12 pl-4 pr-4 rounded-xl
                                bg-white/50 dark:bg-black/20
                                border-2 border-gray-300 dark:border-gray-600
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none
                                transition-all
                                text-gray-900 dark:text-white
                                placeholder-gray-500 dark:placeholder-gray-400
                            "
                        />
                    </div>

                    {/* Tomorrow Info - Subtle & Clean */}
                    <div className="mt-4 mb-6">
                        <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-white/20">
                            <div className="flex flex-row items-center gap-2 mb-1 flex-nowrap overflow-x-auto">
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide flex items-center gap-2 whitespace-nowrap">
                                    <IoWarningOutline className="text-lg text-blue-500 shrink-0" />
                                    Holnap itt viszik el
                                </div>
                                {tomorrowInfo.hasPickup && (
                                    <button
                                        onClick={() => setShowTomorrowDetails(!showTomorrowDetails)}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
                                    >
                                        {showTomorrowDetails ? 'elrejt' : 'mutasd'}
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Street List */}
                            <motion.div
                                initial={false}
                                animate={{ height: showTomorrowDetails ? 'auto' : 0, opacity: showTomorrowDetails ? 1 : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-xs space-y-4">
                                    {tomorrowInfo.blackStreets.length > 0 && (
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white mb-1">KOMMUNÁLIS ({tomorrowInfo.blackDay}):</div>
                                            <div className="text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                                {tomorrowInfo.blackStreets.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {tomorrowInfo.yellowStreets.length > 0 && (
                                        <div>
                                            <div className="font-bold text-yellow-700 dark:text-yellow-400 mb-1">SZELEKTÍV ({tomorrowInfo.yellowZones.join(', ')}):</div>
                                            <div className="text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                                {tomorrowInfo.yellowStreets.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {tomorrowInfo.greenStreets.length > 0 && (
                                        <div>
                                            <div className="font-bold text-green-700 dark:text-green-400 mb-1">ZÖLD ({tomorrowInfo.greenZones.join(', ')}):</div>
                                            <div className="text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                                {tomorrowInfo.greenStreets.join(', ')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="space-y-4">
                        {searchTerm.length > 0 && searchTerm.length < 2 && (
                            <div className="p-4 text-center text-gray-500 bg-white/20 rounded-xl">
                                Gépelj be legalább 2 karaktert...
                            </div>
                        )}

                        {searchTerm.length >= 2 && filteredStreets.length === 0 && (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white/20 rounded-xl">
                                Nincs találat erre az utcára.
                            </div>
                        )}

                        {filteredStreets.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="
                            bg-white/60 dark:bg-[#1a1c2e]/80
                            backdrop-blur-md
                            rounded-2xl p-5
                            border border-white/40 dark:border-white/5
                            shadow-sm hover:shadow-md transition-shadow
                            "
                            >
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-white/10 pb-2">
                                    {item.street}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Black Bin */}
                                    <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-3 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-2 md:flex-col">
                                            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm shadow-md">K</div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Kommunális</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-center">
                                            {item.nextBlack || '-'}
                                        </span>
                                    </div>

                                    {/* Yellow Bin */}
                                    <div className={`rounded-xl p-3 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border ${item.yellowCode ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                                        <div className="flex items-center gap-2 md:flex-col">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${item.yellowCode ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-400'}`}>SZ</div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Szelektív {item.yellowCode ? `(${item.yellowCode})` : ''}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-center">
                                            {item.nextYellow || '-'}
                                        </span>
                                    </div>

                                    {/* Green Bin */}
                                    <div className={`rounded-xl p-3 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border ${item.greenCode ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                                        <div className="flex items-center gap-2 md:flex-col">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${item.greenCode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Z</div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Zöld {item.greenCode ? `(${item.greenCode})` : ''}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white text-center">
                                            {item.nextGreen || '-'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Info Alert */}
                    <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 text-sm">
                        <IoWarningOutline className="text-lg shrink-0 mt-0.5" />
                        <p>
                            A hulladékot a szállítási napon reggel 6:00-ig kell kihelyezni.
                        </p>
                    </div>

                </motion.div>

                {/* Placeholder for other local info */}
                {/* News Feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Health / Doctors - Replaces News in the grid */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDoctorsModal(true)}
                        className="cursor-pointer bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-[25px] rounded-[2rem] border border-white/50 dark:border-white/10 shadow-xl p-6 sm:p-8 flex flex-col justify-between group h-full"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                                <span>🏥</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">Orvosi Rendelők</h2>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ügyelet, Gyógyszertár, Doki</p>
                            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                <IoArrowForward className="text-xl" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Shops Card - Inserted here */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowShopsModal(true)}
                        className="cursor-pointer bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-[25px] rounded-[2rem] border border-white/50 dark:border-white/10 shadow-xl p-6 sm:p-8 flex flex-col justify-between group h-full"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                                <span>🛒</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">Boltok & Üzletek</h2>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tesco, Spar, Penny, Coop</p>
                            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <IoArrowForward className="text-xl" />
                            </div>
                        </div>
                    </motion.div>

                    {/* City Services & Utility */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCityServicesModal(true)}
                        className="cursor-pointer bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-[25px] rounded-[2rem] border border-white/50 dark:border-white/10 shadow-xl p-6 sm:p-8 flex flex-col justify-between group h-full"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                                <span>🏙️</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">Hasznos Infók</h2>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Posta, Kormányablak, Piac</p>
                            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                <IoArrowForward className="text-xl" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Transport Card - Moved to grid as 4th item */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowTransportModal(true)}
                        className="cursor-pointer bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-[25px] rounded-[2rem] border border-white/50 dark:border-white/10 shadow-xl p-6 sm:p-8 flex flex-col justify-between group h-full"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                                <span>🚌</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">Menetrendek</h2>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">MÁV, Volán, Helyi busz</p>
                            <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                                <IoArrowForward className="text-xl" />
                            </div>
                        </div>
                    </motion.div>
                </div>



                {/* News Feed - Moved to bottom (full width) */}
                <div className="bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-[25px] rounded-[2rem] border border-white/50 dark:border-white/10 shadow-xl p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
                            <span>📰</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Önkormányzati hírek</h2>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {newsData && newsData.items && newsData.items.length > 0 ? (
                            newsData.items.map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group"
                                >
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.date}</div>
                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {item.title}
                                    </div>
                                </a>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">Nincsenek friss hírek.</p>
                        )}
                    </div>
                </div>

            </div>

            <DoctorsModal isOpen={showDoctorsModal} onClose={() => setShowDoctorsModal(false)} />
            <CityServicesModal isOpen={showCityServicesModal} onClose={() => setShowCityServicesModal(false)} />
            <ShopsModal isOpen={showShopsModal} onClose={() => setShowShopsModal(false)} />
            <TransportModal isOpen={showTransportModal} onClose={() => setShowTransportModal(false)} />
        </motion.div>
    );
}
