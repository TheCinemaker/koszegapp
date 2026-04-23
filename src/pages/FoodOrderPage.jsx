import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { IoBasket, IoRestaurant, IoClose, IoAdd, IoRemove, IoArrowBack, IoTime, IoLocation, IoReceipt, IoHome, IoGift, IoPerson, IoWallet, IoArrowForward, IoSearchOutline, IoNotifications, IoBicycle, IoStorefront, IoStar, IoWarning, IoArrowUp } from 'react-icons/io5';
import { useCart } from '../hooks/useCart';
import { getMenu, placeOrder } from '../api/foodService';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import KoszegPassProfile from './KoszegPassProfile';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

// --- HELPER FUNCTIONS ---
const getOrderStatusText = (status) => {
    const map = {
        'new': 'Rendelés leadva',
        'pending': 'Függőben',
        'accepted': 'Elfogadva',
        'preparing': 'Készül',
        'ready': 'Futár úton 🛵 / Kész',
        'delivering': 'Futár úton 🛵',
        'delivered': 'Kiszállítva / Átvéve ✅',
        'rejected': 'Elutasítva ❌',
        'cancelled': 'Törölve ❌'
    };
    return map[status] || status;
};

const isRestaurantOpen = (restaurant) => {
    return restaurant?.is_open === true;
};

// --- RESTAURANT CARD (Same as good version) ---
const RestaurantCard = ({ restaurant, onClick, index }) => {
    const isOpen = isRestaurantOpen(restaurant);
    
    return (
    <FadeUp delay={index * 0.05}>
        <motion.div
            layoutId={`restaurant-${restaurant.id}`}
            whileHover={isOpen ? { scale: 1.01 } : {}}
            whileTap={isOpen ? { scale: 0.98 } : {}}
            onClick={() => {
                if (isOpen) {
                    onClick();
                } else {
                    toast.error("Jelenleg zárva tart.");
                }
            }}
            className={`
                cursor-pointer 
                relative overflow-hidden
                bg-white/60 dark:bg-[#1a1c2e]/60 
                backdrop-blur-[30px] saturate-150
                rounded-[2rem] 
                border border-white/60 dark:border-white/10 
                shadow-[0_4px_20px_0_rgba(31,38,135,0.05)]
                group
                flex flex-col
                ${!isOpen ? 'opacity-60 grayscale' : ''}
            `}
        >
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-600 opacity-10 blur-[40px] rounded-full ${isOpen ? 'group-hover:opacity-20 transition-opacity duration-500' : ''}`} />
            <div className="h-40 relative overflow-hidden rounded-t-[2rem] m-1.5 mb-0">
                {restaurant.image_url ? <ParallaxImage src={restaurant.image_url} className="w-full h-full" /> : <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900" />}
                
                {/* ZÁRVA Overlay */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <span className="font-black text-2xl tracking-[0.2em] text-white rotate-[-10deg] shadow-black drop-shadow-xl border-4 border-white/60 px-4 py-2 rounded-xl backdrop-blur-md">ZÁRVA</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                    {restaurant.has_delivery === false ? (
                        <div className="bg-black/70 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 border border-white/10"><IoLocation className="text-amber-500" /><span>CSAK ELVITEL</span></div>
                    ) : (
                        <div className="bg-white/80 dark:bg-black/60 text-gray-900 dark:text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1"><IoTime className="text-amber-500" /><span>{restaurant.delivery_time || '30-40 p'}</span></div>
                    )}
                </div>
            </div>
            <div className="p-4 relative z-10 flex-1 flex flex-col">
                {/* MARKETING BADGES (Deactivated per user request) */}
                <div className="flex flex-col gap-1 items-start mb-2">
                    {restaurant.mystery_box?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1 border border-indigo-400">
                            🎁 Ételmentés
                        </span>
                    )}
                    {restaurant.flash_sale?.active && (
                        <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1 border border-red-400">
                            ⚡ Villámakció: {restaurant.flash_sale.discount}
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{restaurant.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[20px]">
                    {restaurant.daily_menu && <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-blue-100 dark:border-blue-900/30"><IoRestaurant className="text-[10px]" /> Napi Menü</span>}
                    {restaurant.news && <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-amber-100 dark:border-amber-900/30"><IoNotifications className="text-[10px]" /> <span className="truncate max-w-[100px]">{restaurant.news}</span></span>}
                    {(!restaurant.daily_menu && !restaurant.news && restaurant.tags) && restaurant.tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-md">{tag}</span>)}
                </div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 leading-relaxed">{restaurant.description}</p>
            </div>
        </motion.div>
    </FadeUp>
    );
};

// --- WEEKLY MENU DISPLAY ---
function WeeklyMenuDisplay({ restaurant, onAddToCart }) {
    const dailyMenuStr = restaurant?.daily_menu;
    const dailyPrice = restaurant?.display_settings?.daily_menu_price ? parseInt(restaurant.display_settings.daily_menu_price) : null;
    const showDaily = restaurant?.display_settings?.show_daily_menu;

    const constantMenuStr = restaurant?.promotions;
    const constantPrice = restaurant?.display_settings?.constant_menu_price ? parseInt(restaurant.display_settings.constant_menu_price) : null;
    const showConstant = restaurant?.display_settings?.show_constant_menu;

    const [mainExpanded, setMainExpanded] = useState(false);
    const [weekExpanded, setWeekExpanded] = useState(false);

    // Calculate if we're within the allowed time range for daily menu
    const isDailyWithinTime = useMemo(() => {
        if (!restaurant?.display_settings?.show_daily_menu) return false;
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [sh, sm] = (restaurant.display_settings.daily_menu_start || '11:00').split(':').map(Number);
        const [eh, em] = (restaurant.display_settings.daily_menu_end || '14:00').split(':').map(Number);
        
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }, [restaurant.display_settings]);

    if (!dailyMenuStr && !constantMenuStr) return null;
    
    let weeklyMenu = null;
    let isOldFormat = false;
    
    if (dailyMenuStr) {
        try {
            const obj = JSON.parse(dailyMenuStr);
            if (typeof obj === 'object' && obj !== null) {
                weeklyMenu = obj;
            } else {
                isOldFormat = true;
            }
        } catch {
            isOldFormat = true;
        }
    }

    const todayDay = new Date().getDay(); // 0 is Sunday, 1 is Monday
    const todayLabelMap = { 1: 'Hétfő', 2: 'Kedd', 3: 'Szerda', 4: 'Csütörtök', 5: 'Péntek', 6: 'Szombat', 0: 'Vasárnap' };
    const orderedDays = [1, 2, 3, 4, 5, 6, 0];
    
    const todayData = weeklyMenu ? (weeklyMenu[todayDay] || null) : null;
    const todayContent = typeof todayData === 'string' ? todayData : (todayData ? [todayData.A, todayData.B, todayData.C].filter(Boolean).join('\n') : '-');

    // Logic Adjustment: Constant menu ONLY shows if Daily Menu is active for the day AND we are in time
    const hasTodayDailyData = !!(todayData?.A || todayData?.B || todayData?.C);
    const hasVisibleDaily = showDaily && dailyMenuStr && isDailyWithinTime && hasTodayDailyData;
    const hasVisibleConstant = showConstant && showDaily && constantMenuStr && isDailyWithinTime && hasTodayDailyData;
    
    if (!hasVisibleDaily && !hasVisibleConstant) return null;

    return (
        <div className="mt-4 mb-2">
            <button 
                onClick={() => setMainExpanded(!mainExpanded)}
                className="w-full relative overflow-hidden group rounded-2xl border border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-[#1a1c2e] active:scale-[0.98] transition-all flex items-center justify-between shadow-sm hover:border-amber-500/50"
            >
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                       <IoRestaurant className="text-amber-600 dark:text-amber-400 text-sm" />
                   </div>
                   <div className="text-left leading-tight">
                       <span className="block font-black text-[13px] text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">Napi és Állandó Menük</span>
                       <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{mainExpanded ? 'Bezárás' : 'Kattints a megtekintéshez'}</span>
                   </div>
               </div>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${mainExpanded ? 'rotate-[-90deg]' : 'rotate-90'}`}>
                   <IoArrowForward className="text-sm" />
               </div>
            </button>

            <AnimatePresence>
                {mainExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 pt-2 pb-2">

                            {/* UNIFIED DAILY / WEEKLY / CONSTANT MENU */}
                            {(hasVisibleDaily || hasVisibleConstant) && (
                                <div className={`mt-3 border rounded-2xl relative overflow-hidden shadow-sm ${restaurant.display_settings?.is_daily_menu_available !== false ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-red-50 dark:bg-red-900/5 border-red-200 dark:border-red-900/20 opacity-80'}`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${restaurant.display_settings?.is_daily_menu_available !== false ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                    
                                    <div className="p-4 pb-3">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <h3 className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${restaurant.display_settings?.is_daily_menu_available !== false ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                                                <IoRestaurant className="text-base" />
                                                {`Mai Menü: ${todayLabelMap[todayDay]}`}
                                                {restaurant.display_settings?.is_daily_menu_available === false && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">ELFOGYOTT</span>}
                                            </h3>
                                        </div>

                                        {/* Soup Display */}
                                        {todayData?.soup && (
                                            <div className="mb-3 p-2 bg-white/40 dark:bg-black/20 rounded-xl border border-blue-100/30">
                                                <p className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">🥣 Ma a levesünk:</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{todayData.soup}</p>
                                            </div>
                                        )}

                                        {/* A/B/C Options */}
                                        <div className="space-y-3 mb-4">
                                            {['A', 'B', 'C'].map(m => {
                                                const menuText = todayData?.[m];
                                                if (!menuText) return null;
                                                const isSoldOut = todayData?.[`soldOut${m}`] || restaurant.display_settings?.is_daily_menu_available === false;
                                                const noSoupPrice = restaurant?.display_settings?.daily_menu_no_soup_price ? parseInt(restaurant.display_settings.daily_menu_no_soup_price) : null;

                                                return (
                                                    <div key={m} className={`relative p-3 rounded-2xl border transition-all ${!isSoldOut ? 'bg-white/80 dark:bg-black/30 border-blue-100/50 dark:border-blue-900/30 shadow-sm' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-70 grayscale'}`}>
                                                        {isSoldOut && (
                                                            <div className="absolute top-0 right-0 z-10">
                                                                <div className="bg-red-600 text-white text-[7px] font-black py-0.5 px-6 translate-x-[18px] translate-y-[8px] rotate-45 shadow-sm uppercase tracking-tighter">ELFOGYOTT</div>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex-1">
                                                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{m} Menü</span>
                                                                <p className={`text-sm font-medium leading-relaxed ${isSoldOut ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{menuText}</p>
                                                            </div>
                                                        </div>

                                                        {!isSoldOut && (
                                                            <div className="mt-3 pt-3 border-t border-blue-50 dark:border-blue-900/20 flex flex-wrap gap-2">
                                                                {dailyPrice && (
                                                                    <button 
                                                                        onClick={() => onAddToCart({
                                                                            id: `daily-menu-${restaurant.id}-${todayDay}-${m}-full`,
                                                                            name: `${m} Menü (+ Leves: ${todayData.soup})`,
                                                                            price: dailyPrice,
                                                                            image_url: null,
                                                                            restaurant_id: restaurant.id,
                                                                            description: menuText
                                                                        })}
                                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center justify-between shadow-md"
                                                                    >
                                                                        <span>Levessel</span>
                                                                        <span>{dailyPrice} Ft</span>
                                                                    </button>
                                                                )}
                                                                {noSoupPrice && (
                                                                    <button 
                                                                        onClick={() => onAddToCart({
                                                                            id: `daily-menu-${restaurant.id}-${todayDay}-${m}-nosoup`,
                                                                            name: `${m} Menü (Leves nélkül)`,
                                                                            price: noSoupPrice,
                                                                            image_url: null,
                                                                            restaurant_id: restaurant.id,
                                                                            description: menuText
                                                                        })}
                                                                        className="flex-1 bg-white dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center justify-between shadow-sm"
                                                                    >
                                                                        <span>Leves nélkül</span>
                                                                        <span>{noSoupPrice} Ft</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Integrated Constant Menu */}
                                            {hasVisibleConstant && (
                                                <div className={`relative p-3 rounded-2xl border transition-all ${restaurant.display_settings?.is_constant_menu_available !== false ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-900/30 shadow-sm' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-70 grayscale'}`}>
                                                   <div className="flex justify-between items-start gap-3">
                                                       <div className="flex-1">
                                                           <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                               <IoStar /> Állandó Ajánlat
                                                           </span>
                                                           <p className={`text-sm font-medium leading-relaxed ${restaurant.display_settings?.is_constant_menu_available === false ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{constantMenuStr}</p>
                                                       </div>
                                                   </div>
                                                   {restaurant.display_settings?.is_constant_menu_available !== false && constantPrice && (
                                                       <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/20">
                                                           <button 
                                                               onClick={() => onAddToCart({
                                                                   id: `constant-menu-${restaurant.id}`,
                                                                   name: `Állandó Menü`,
                                                                   price: constantPrice,
                                                                   image_url: null,
                                                                   restaurant_id: restaurant.id,
                                                                   description: constantMenuStr
                                                               })}
                                                               className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center justify-between shadow-md"
                                                           >
                                                               <span>Rendelés</span>
                                                               <span>{constantPrice} Ft</span>
                                                           </button>
                                                       </div>
                                                   )}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => setWeekExpanded(!weekExpanded)}
                                            className="w-full flex items-center justify-between px-3 py-2 bg-white/60 dark:bg-black/20 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-300 backdrop-blur-sm border border-blue-100/50 dark:border-blue-800/20 active:scale-[0.98] transition-all"
                                        >
                                            <span>Egész heti menü / Ajánlatok</span>
                                            <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-md text-blue-800 dark:text-blue-200">{weekExpanded ? 'Elrejtés' : 'Mutat'} ▼</span>
                                        </button>
                                    </div>

                                    {!isOldFormat && (
                                        <AnimatePresence>
                                            {weekExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white/30 dark:bg-black/10 mx-2 mb-2 rounded-xl backdrop-blur-md"
                                                >
                                                    <div className="p-3 space-y-3">
                                                        {orderedDays.map(day => {
                                                            const dayVal = weeklyMenu[day];
                                                            if (!dayVal || day === todayDay) return null;
                                                            
                                                            const isComplex = typeof dayVal === 'object' && dayVal !== null;
                                                            const soup = isComplex ? dayVal.soup : '';
                                                            const menus = isComplex ? [
                                                                dayVal.A && `A: ${dayVal.A}`,
                                                                dayVal.B && `B: ${dayVal.B}`,
                                                                dayVal.C && `C: ${dayVal.C}`
                                                            ].filter(Boolean).join('\n') : dayVal;

                                                            return (
                                                                <div key={day} className="border-l-2 border-blue-300 dark:border-blue-700 pl-2">
                                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-0.5">{todayLabelMap[day]}</span>
                                                                    {soup && <p className="text-[10px] font-bold text-gray-500 italic">Leves: {soup}</p>}
                                                                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{menus}</p>
                                                                </div>
                                                            );
                                                        })}
                                                        {orderedDays.filter(day => day !== todayDay && weeklyMenu[day]).length === 0 && (
                                                            <p className="text-[11px] text-gray-500 italic text-center py-2">Nincs megadva további ajánlat a hétre.</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SIMPLE POINTS DISPLAY (Lightweight) ---
function SimplePointsDisplay({ user }) {
    const [pointsData, setPointsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const fetchPoints = async () => {
            const { data, error } = await supabase.from('koszegpass_users').select('points, card_type').eq('id', user.id).single();
            if (data) setPointsData(data);
            setLoading(false);
        };
        fetchPoints();
        // Realtime update
        const chan = supabase.channel('simple-points-watch').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'koszegpass_users', filter: `id=eq.${user.id}` }, (payload) => {
            setPointsData(payload.new);
        }).subscribe();
        return () => supabase.removeChannel(chan);
    }, [user]);

    if (!user) return (
        <div className="text-center py-20 text-zinc-500">
            <Link to="/pass/register?redirectTo=/eats" className="text-amber-500 font-bold hover:underline">
                Jelentkezz be
            </Link> a pontjaidhoz.
        </div>
    );
    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;

    const points = pointsData?.points || 0;
    const tier = pointsData?.card_type || 'Bronz';

    // Tier Colors & Logic
    const getTierColor = (t) => {
        if (t === 'Diamond' || t === 'Gyémánt') return 'from-cyan-400 to-blue-600';
        if (t === 'Gold' || t === 'Arany') return 'from-amber-300 to-yellow-500';
        if (t === 'Silver' || t === 'Ezüst') return 'from-slate-300 to-slate-500';
        return 'from-orange-400 to-amber-600'; // Bronz
    };

    // Progress Logic (Simple version of profile)
    const max = 20000;
    const percentage = Math.min((points / max) * 100, 100);

    return (
        <div className="px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl"
            >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getTierColor(tier)} opacity-20 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3`} />
                <div className={`absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr ${getTierColor(tier)} opacity-10 blur-[40px] rounded-full -translate-x-1/3 translate-y-1/3`} />

                <div className="relative z-10 flex flex-col items-center text-center">

                    <div className="mb-2 text-zinc-400 text-sm font-bold uppercase tracking-widest">KőszegPass Egyenleg</div>
                    <div className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        {points.toLocaleString()} <span className="text-2xl text-zinc-500">pts</span>
                    </div>

                    <div className={`
                        px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md
                        text-sm font-bold flex items-center gap-2 mb-8
                    `}>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTierColor(tier)}`} />
                        <span className="uppercase">{tier} Szint</span>
                    </div>

                    {/* Simple Progress Bar */}
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${getTierColor(tier)}`}
                        />
                    </div>
                    <div className="flex justify-between w-full text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span>0</span>
                        <span>{max.toLocaleString()}</span>
                    </div>

                    <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 w-full text-left">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">💡</div>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">Mire jó ez?</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Gyűjts pontokat rendelésekkel és használd fel őket kedvezményekre a városi elfogadóhelyeken! (Food rendelésnél: 100 Ft = 1 pont)
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

export default function FoodOrderPage({ appData }) {
    const [activeTab, setActiveTab] = useState('home');
    const [view, setView] = useState('restaurants');
    const [restaurants, setRestaurants] = useState(appData?.restaurants || []);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [realCategories, setRealCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('delivery');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { items, addItem, removeItem, updateQuantity, clearCart, total, count } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const selectedRestaurantRef = useRef(null);
    const { user, loading: authLoading } = useAuth();
    const [activeOrders, setActiveOrders] = useState([]);
    const [dismissedOrderIds, setDismissedOrderIds] = useState(() => {
        const saved = localStorage.getItem('dismissed_orders');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Safety fallback for stuck Auth
    const [showAuthFallback, setShowAuthFallback] = useState(false);
    useEffect(() => {
        if (authLoading) {
            const timer = setTimeout(() => setShowAuthFallback(true), 4000);
            return () => clearTimeout(timer);
        } else {
            setShowAuthFallback(false);
        }
    }, [authLoading]);

    // Safety fallback for stuck Restaurants
    const [showRestaurantFallback, setShowRestaurantFallback] = useState(false);
    useEffect(() => {
        if (view === 'restaurants' && restaurants.length === 0) {
            const timer = setTimeout(() => setShowRestaurantFallback(true), 5000);
            return () => clearTimeout(timer);
        } else {
            setShowRestaurantFallback(false);
        }
    }, [view, restaurants.length]);

    // Save dismissed orders to persists across refreshes
    useEffect(() => {
        localStorage.setItem('dismissed_orders', JSON.stringify([...dismissedOrderIds]));
    }, [dismissedOrderIds]);

    // --- FETCHING LOGIC ---
    const fetchActiveOrders = async () => {
        if (!user) return;
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
            .from('orders')
            .select('*, restaurants(name)')
            .eq('user_id', user.id)
            .gte('created_at', twelveHoursAgo)
            .in('status', ['new', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'rejected', 'cancelled'])
            .order('created_at', { ascending: false });

        if (data) {
            const now = new Date();
            const filtered = data.filter(o => {
                if (dismissedOrderIds.has(o.id)) return false;
                if (['new', 'accepted', 'preparing', 'ready', 'delivering'].includes(o.status)) return true;
                const orderDate = new Date(o.updated_at || o.created_at);
                const diffMinutes = (now - orderDate) / (1000 * 60);
                return diffMinutes < 1; 
            });
            setActiveOrders(filtered);
        }
    };

    const fetchRestaurants = async () => {
        try {
            const { data } = await supabase.from('restaurants').select('*').order('name');
            if (data) {
                setRestaurants(data);
                const allCats = new Set();
                const shopMap = {};
                data.forEach(r => {
                    if (r.tags) {
                        r.tags.forEach(t => {
                            allCats.add(t);
                            if (!shopMap[t]) shopMap[t] = new Set();
                            shopMap[t].add(r.id);
                        });
                    }
                });
                setRealCategories(Array.from(allCats).sort());
                setCategoryMap(shopMap);
            }
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        }
    };

    const fetchMenu = async (restaurantId) => {
        if (!restaurantId) return;
        try {
            const menuData = await getMenu(restaurantId);
            setCategories(menuData);
            setView('menu');
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            toast.error("Hiba a menü betöltésekor.");
        } finally {
            setLoading(false);
        }
    };

    // --- EFFECTS ---

    // 1. Monitor active orders
    useEffect(() => {
        if (!user) return;
        fetchActiveOrders();

        const chan = supabase.channel('active-orders-monitor')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchActiveOrders();
            })
            .subscribe();

        return () => { supabase.removeChannel(chan); };
    }, [user, dismissedOrderIds]);

    // 2. Refresh orders timer
    useEffect(() => {
        if (activeOrders.length === 0) return;
        const interval = setInterval(() => {
            fetchActiveOrders();
        }, 60000);
        return () => clearInterval(interval);
    }, [activeOrders]);

    // 3. Monitor restaurant updates
    useEffect(() => {
        if (restaurants.length === 0) {
            fetchRestaurants();
        }
        selectedRestaurantRef.current = selectedRestaurant;

        const channel = supabase.channel('restaurants-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, (payload) => {
                if (payload.eventType === 'UPDATE') {
                    setRestaurants(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
                    if (payload.new && selectedRestaurantRef.current && payload.new.id === selectedRestaurantRef.current.id) {
                        setSelectedRestaurant(payload.new);
                    }
                } else {
                    fetchRestaurants();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedRestaurant]);

    // 4. Load menu when restaurant selected
    useEffect(() => {
        if (selectedRestaurant) {
            setLoading(true);
            fetchMenu(selectedRestaurant.id);

            const menuChan = supabase.channel(`menu-updates-${selectedRestaurant.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'menu_items',
                    filter: `restaurant_id=eq.${selectedRestaurant.id}`
                }, (payload) => {
                    console.log("[Realtime] Menu Item Change:", payload);
                    setCategories(currentCats => {
                        const newCats = currentCats.map(cat => {
                            // Filter out the item from its current location
                            const itemsWithoutThis = cat.items.filter(item => item.id !== (payload.new?.id || payload.old?.id));
                            
                            if (payload.eventType === 'DELETE') {
                                return { ...cat, items: itemsWithoutThis };
                            }
                            
                            // If it belongs to this category, add/update it and re-sort
                            if (cat.id === payload.new.category_id) {
                                const updatedItems = [...itemsWithoutThis, payload.new];
                                return { 
                                    ...cat, 
                                    items: updatedItems.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) 
                                };
                            }
                            
                            return { ...cat, items: itemsWithoutThis };
                        });
                        return newCats;
                    });
                })
                .subscribe();

            const catsChan = supabase.channel(`menu-cats-updates-${selectedRestaurant.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'menu_categories',
                    filter: `restaurant_id=eq.${selectedRestaurant.id}`
                }, (payload) => {
                    console.log("[Realtime] Category Change:", payload);
                    if (payload.eventType === 'DELETE') {
                        setCategories(currentCats => currentCats.filter(cat => cat.id !== payload.old.id));
                    } else if (payload.eventType === 'INSERT') {
                        setCategories(currentCats => [...currentCats, { ...payload.new, items: [] }].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
                    } else if (payload.eventType === 'UPDATE') {
                        setCategories(currentCats => {
                            const newCats = currentCats.map(cat => 
                                cat.id === payload.new.id ? { ...cat, ...payload.new } : cat
                            );
                            return newCats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                        });
                    }
                })
                .subscribe();
            
            return () => { 
                supabase.removeChannel(menuChan); 
                supabase.removeChannel(catsChan);
            };
        } else {
            setView('restaurants');
            setCategories([]);
        }
    }, [selectedRestaurant]);

    // 5. Visibility Sync (Resume from background)
    useEffect(() => {
        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                fetchRestaurants();
                fetchActiveOrders();
                if (selectedRestaurantRef.current) fetchMenu(selectedRestaurantRef.current.id);
            }
        };
        document.addEventListener('visibilitychange', handleSync);
        window.addEventListener('focus', handleSync);
        return () => {
            document.removeEventListener('visibilitychange', handleSync);
            window.removeEventListener('focus', handleSync);
        };
    }, []);


    // Handle back button
    const handleBack = () => {
        setSelectedRestaurant(null);
        setView('restaurants');
    };

    // A korábbi duplikált 'Watch active orders' blokk innen törölve lett.

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#080808] flex flex-col justify-center items-center gap-4 transition-colors duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 relative z-10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Azonosítás...</p>
                
                {showAuthFallback && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 text-center px-6"
                    >
                        <p className="text-xs text-zinc-500 mb-4">A megszokottnál lassabb a csatlakozás...</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-bold rounded-full shadow-lg active:scale-95 transition-all"
                        >
                            Oldal frissítése
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    // 4. Mystery Box Enforcement & Mutual Exclusivity
    const hasMysteryBox = items.some(i => i.is_mystery_box);

    // Reset filter to delivery if cart becomes empty to prevent getting "stuck" in collection mode
    useEffect(() => {
        if (hasMysteryBox) {
            setFilterType('collection');
            if (isCartOpen) toast("🥡 Mystery Box csak személyes átvétellel kérhető!", { id: 'mb-pickup-toast' });
        } else if (items.length === 0) {
            setFilterType('delivery');
        }
    }, [hasMysteryBox, isCartOpen, items.length]);

    // Custom Add Item handler to enforce rules
    const handleAddItem = (item) => {
        if (!isRestaurantOpen(selectedRestaurant)) {
            toast.error("Az étterem jelenleg zárva tart!", { icon: '🚫' });
            return;
        }

        const isAddingMystery = item.is_mystery_box;
        const hasNormalItems = items.some(i => !i.is_mystery_box);

        // Rule 1: Cannot add Normal item if Mystery Box in cart
        if (!isAddingMystery && hasMysteryBox) {
            toast.error("🥡 Mystery Box mellé nem rendelhető más étel! Kérlek, rendeld meg külön.", { icon: '🚫' });
            return;
        }

        // Rule 2: Cannot add Mystery Box if Normal item in cart
        if (isAddingMystery && hasNormalItems) {
            toast.error("🥡 Mystery Box csak önmagában rendelhető! Kérlek, ürítsd ki a kosarat.", { icon: '🚫' });
            return;
        }

        const flashRule = selectedRestaurant?.flash_sale?.active ? selectedRestaurant.flash_sale.items?.[item.id] : null;

        addItem({ ...item, flashRule });

        if (flashRule?.type === 'gift' && flashRule.giftName) {
            addItem({
                id: `gift-${item.id}-${Date.now()}`,
                name: `AJÁNDÉK: ${flashRule.giftName}`,
                price: 0,
                restaurant_id: item.restaurant_id,
                is_gift: true
            });
            toast.success(`🎁 Ajándék hozzáadva: ${flashRule.giftName}!`, { duration: 4000 });
        } else if (isAddingMystery) {
            toast.success("🎁 Mystery Box a kosárban! (Csak személyes átvétel)", { duration: 4000 });
        } else {
            toast.success("Hozzáadva a kosárhoz! 🛒");
        }
    };


    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden pb-24 font-sans transition-colors duration-300">
            {/* COMPACT FIXED HEADER */}
            <div className="fixed top-2 left-0 right-0 z-[100] px-4 pointer-events-none">
                <div className="
                    mx-auto max-w-5xl
                    bg-white/70 dark:bg-[#1a1c2e]/70 
                    backdrop-blur-xl saturate-150
                    border border-white/50 dark:border-white/10 
                    shadow-lg shadow-black/5
                    rounded-full
                    px-4 py-2
                    flex items-center justify-between
                    pointer-events-auto
                ">
                    {/* Left: Home + Title */}
                    <div className="flex items-center gap-3">
                        {view === 'menu' ? (
                            <button onClick={handleBack} className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                <IoArrowBack className="text-sm text-zinc-900 dark:text-white" />
                            </button>
                        ) : (
                            <Link to="/" className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                <IoHome className="text-sm text-zinc-900 dark:text-white" />
                            </Link>
                        )}

                        <div className="flex flex-col leading-none">
                            <h1 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                                {activeTab === 'home' && (<span>Kőszeg<span className="text-amber-500">Eats</span></span>)}
                                {activeTab === 'orders' && <span>Rendelések</span>}
                                {activeTab === 'rewards' && <span>Pontok & Kedvezmények</span>}
                                {activeTab === 'account' && <span>Fiókom</span>}
                            </h1>
                            {activeTab === 'home' && user && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Szia, {user.user_metadata?.nickname || 'Vendég'}!</p>}
                        </div>
                    </div>

                    {/* Right: Basket Button */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm hover:scale-105 transition-transform"
                    >
                        <IoBasket className="text-base text-zinc-800 dark:text-white" />

                        {/* Status Capsule */}
                        {activeOrders.length > 0 && (
                            <div className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </div>
                        )}

                        {count > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white dark:border-black shadow-sm">
                                {count}
                            </span>
                        )}
                    </button>
                </div>



                <div className="max-w-5xl mx-auto mt-2 flex justify-between items-center pointer-events-auto px-2">
                    {/* LEFT: Status Capsule (if active) */}
                    <div>
                        {activeOrders.length > 0 && (
                            <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap animate-in slide-in-from-top-2 fade-in">
                                {activeOrders.length} aktív rendelés
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Delivery/Collection Slider */}
                    <div className={view === 'restaurants' ? 'block' : 'opacity-0 pointer-events-none'}>
                        <DeliveryCollectionSlider value={filterType} onChange={hasMysteryBox ? () => toast.error("Mystery Box miatt csak elvitel lehetséges!") : setFilterType} disabled={hasMysteryBox} />
                    </div>
                </div>
            </div>

            {/* MAIN (Added top padding for fixed header) */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24">
                {/* ACTIVE ORDER TRACKERS */}
                {activeOrders.length > 0 && (activeTab === 'home' || activeTab === 'orders') && (
                    <div className="space-y-4 mb-6">
                        {activeOrders.map(order => (
                            <FadeUp key={order.id}>
                                <ActiveOrderTracker 
                                    order={order} 
                                    onDismiss={() => setDismissedOrderIds(prev => new Set([...prev, order.id]))} 
                                />
                            </FadeUp>
                        ))}
                    </div>
                )}

                <div className={activeTab === 'home' ? 'block' : 'hidden'}>
                    {view === 'restaurants' && (
                        <>
                            <div className="flex flex-col gap-[5px] mb-[5px] mt-[5px]">
                                {/* Search Bar */}
                                <div className="relative group w-full">
                                    <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors text-lg" />
                                    <SearchBarWithTypewriter value={searchTerm} onChange={setSearchTerm} />
                                </div>
                            </div>
                            {realCategories.length > 0 && (
                                <div className="mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <div className="flex gap-2 min-w-max">
                                        <button onClick={() => setSelectedCategory(null)} className={`flex items-center justify-center px-4 h-8 rounded-full border transition-all duration-300 font-bold text-xs ${selectedCategory === null ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-amber-500/50'}`}>Összes</button>
                                        {realCategories.map(cat => (
                                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex items-center justify-center px-4 h-8 rounded-full border transition-all duration-300 font-bold text-xs ${selectedCategory === cat ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-amber-500/50'}`}>{cat}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
                                {restaurants.length === 0 ? (
                                    <>
                                        <RestaurantSkeleton />
                                        <RestaurantSkeleton />
                                        <RestaurantSkeleton />
                                        
                                        {showRestaurantFallback && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} 
                                                animate={{ opacity: 1 }}
                                                className="col-span-full pt-8 text-center"
                                            >
                                                <p className="text-sm text-zinc-500 mb-4 font-medium">Lassabban érkeznek az adatok...</p>
                                                <button 
                                                    onClick={() => window.location.reload()}
                                                    className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                                >
                                                    🔄 Lista frissítése
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                ) : (
                                    restaurants.filter(r => {
                                        const termMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
                                        const deliveryMatch = filterType === 'delivery' ? (r.has_delivery !== false) : true;
                                        if (!selectedCategory) return termMatch && deliveryMatch;
                                        const categoryMatch = categoryMap[selectedCategory] && categoryMap[selectedCategory].has(r.id);
                                        return termMatch && deliveryMatch && categoryMatch;
                                    }).map((rest, idx) => <RestaurantCard key={rest.id} restaurant={rest} index={idx} onClick={() => setSelectedRestaurant(rest)} />)
                                )}
                            </div>
                        </>
                    )}
                    {view === 'menu' && selectedRestaurant && (
                        <div className="pb-24">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 dark:bg-[#1a1c2e]/60 backdrop-blur-[30px] rounded-[2rem] p-5 border border-white/60 dark:border-white/10 shadow-xl mb-6 relative overflow-hidden">

                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                                
                                {selectedRestaurant.flash_sale?.active && (
                                    <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-1.5 flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">⚡</span>
                                            <span className="text-[11px] font-black uppercase tracking-wider">Flash Sale: {selectedRestaurant.flash_sale.discount}</span>
                                            <span className="text-[11px] font-medium opacity-90 border-l border-white/30 pl-2 ml-1">{selectedRestaurant.flash_sale.message}</span>
                                        </div>
                                        {selectedRestaurant.flash_sale.end_time && (
                                            <div className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                                                Lejár: {new Date(selectedRestaurant.flash_sale.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className={`flex flex-col md:flex-row gap-5 relative z-10 ${selectedRestaurant.flash_sale?.active ? 'pt-8' : ''}`}>
                                    <div className="w-full md:w-32 md:h-32 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0 relative">
                                        {selectedRestaurant.image_url ? <ParallaxImage src={selectedRestaurant.image_url} className="w-full h-full" /> : <div className="w-full h-full bg-zinc-800" />}
                                        {!isRestaurantOpen(selectedRestaurant) && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                                <span className="font-black text-xl tracking-[0.2em] text-white rotate-[-10deg] shadow-black drop-shadow-xl border-4 border-white/60 px-3 py-1.5 rounded-xl backdrop-blur-md">ZÁRVA</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">{selectedRestaurant.name}</h2>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <div className="px-2 py-1 rounded-lg bg-white/50 dark:bg-black/20 text-[10px] font-bold flex items-center gap-1 border border-black/5 dark:border-white/5"><IoLocation className="text-amber-500" /> {selectedRestaurant.address}</div>
                                            <div className="px-2 py-1 rounded-lg bg-white/50 dark:bg-black/20 text-[10px] font-bold flex items-center gap-1 border border-black/5 dark:border-white/5"><IoTime className="text-amber-500" /> {selectedRestaurant.delivery_time || '30-40p'}</div>
                                            {selectedRestaurant.promotions && <div className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-[10px] font-bold flex items-center gap-1 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"><IoGift /> {selectedRestaurant.promotions}</div>}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed max-w-xl">{selectedRestaurant.description}</p>
                                        
                                        {/* Hírek / Közlemények */}
                                        {selectedRestaurant.news && (
                                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                                                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                                    <IoNotifications className="text-white text-xs" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Közlemény</span>
                                                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-100 leading-tight">
                                                        {selectedRestaurant.news}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Napi Menü Kiemelés */}
                                        {/* Napi Menü Kiemelés */}
                                        <WeeklyMenuDisplay restaurant={selectedRestaurant} onAddToCart={(item) => handleAddItem(item)} />
                                    </div>
                                </div>
                            </motion.div>

                            {/* MYSTERY BOX SECTION */}
                            {selectedRestaurant.mystery_box?.length > 0 && (
                                <div className="mb-8 p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-[2rem] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-sm -z-10" />
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">🎁</div>
                                            <div>
                                                <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-sm uppercase tracking-tight">Mystery Box (Ételmentés)</h3>
                                                <p className="text-[10px] text-indigo-700/70 dark:text-indigo-300/50 font-bold uppercase">Korlátozott számban!</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedRestaurant.mystery_box.map(box => (
                                            <div key={box.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm flex justify-between items-center">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h4 className="font-bold text-sm text-indigo-900 dark:text-white truncate">{box.name}</h4>
                                                    <p className="text-[10px] text-indigo-700/60 dark:text-indigo-300/40 line-clamp-1">{box.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{box.discounted_price} Ft</span>
                                                        <span className="text-[10px] text-gray-400 line-through">{box.original_price} Ft</span>
                                                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold">{box.items_left} db maradt</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddItem({
                                                        id: box.id,
                                                        name: box.name,
                                                        price: parseInt(box.discounted_price),
                                                        image_url: null,
                                                        restaurant_id: selectedRestaurant.id,
                                                        is_mystery_box: true,
                                                        description: box.description
                                                    })}
                                                    disabled={box.items_left <= 0}
                                                    className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <IoAdd className="text-xl" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {loading ? <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div></div> : (
                                <>
                                    {/* STICKY QUICK NAVIGATION BAR */}
                                    {categories.length > 1 && (
                                        <div className="sticky top-[80px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#f5f5f7]/80 dark:bg-[#000000]/80 backdrop-blur-md mb-6 border-b border-gray-200/50 dark:border-white/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
                                            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {categories.map(cat => (
                                                    <button 
                                                        key={`nav-${cat.id}`}
                                                        onClick={() => {
                                                            const element = document.getElementById(`cat-${cat.id}`);
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }
                                                        }}
                                                        className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold shadow-sm border border-black/5 dark:border-white/5 hover:border-amber-500 hover:text-amber-500 transition-all active:scale-95"
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-10">
                                        {categories.map((category) => (
                                            <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white pl-1"><span className="w-1 h-6 bg-amber-500 rounded-full"></span>{category.name}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {category.items.map(item => (
                                                        <MenuItemCard 
                                                            key={item.id} 
                                                            item={item} 
                                                            flashRule={selectedRestaurant.flash_sale?.active ? selectedRestaurant.flash_sale.items?.[item.id] : null}
                                                            onAdd={() => handleAddItem({ ...item, restaurant_id: selectedRestaurant.id })} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {categories.length === 0 && <p className="text-center opacity-50 py-10 text-sm">Jelenleg nincs betöltött menü.</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'orders' && (
                    <div className="pb-32 pt-2 px-4 max-w-screen-xl mx-auto">
                        {user ? (
                            <>
                                {activeOrders.length > 0 && (
                                    <div className="space-y-4 mb-6">
                                        {activeOrders.map(order => (
                                            <ActiveOrderTracker 
                                                key={order.id} 
                                                order={order} 
                                                onDismiss={() => setDismissedOrderIds(prev => new Set([...prev, order.id]))} 
                                            />
                                        ))}
                                    </div>
                                )}
                                <MyOrdersList user={user} />
                            </>
                        ) : (
                            <div className="text-center py-20 text-zinc-500">
                                <Link to="/pass/register?redirectTo=/eats" className="text-amber-500 font-bold hover:underline">
                                    Jelentkezz be
                                </Link> a rendeléseidhez.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'rewards' && <div className="pb-32 pt-2"><SimplePointsDisplay user={user} /></div>}
                {activeTab === 'account' && <div className="pb-32 pt-2"><KoszegPassProfile viewMode="settings" /></div>}
            </div>

            {/* FLOATING NAV (UPDATED TO GLASS STYLE) */}
            <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-[95vw] sm:max-w-md pointer-events-none">
                <div className="
                    pointer-events-auto
                    flex items-center justify-between
                    px-6 py-2
                    bg-white/40 dark:bg-[#1a1c2e]/40 
                    backdrop-blur-[25px] 
                    backdrop-saturate-[1.8]
                    backdrop-brightness-[1.1]
                    rounded-[30px] 
                    border border-white/50 dark:border-white/20 
                    shadow-[0_10px_40px_rgba(0,0,0,0.1)] 
                    transition-all duration-300
                ">
                    <NavButton label="Főoldal" icon={IoHome} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavButton label="Rendelések" icon={IoReceipt} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <NavButton label="Pontok" icon={IoWallet} active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} />
                    <NavButton label="Fiók" icon={IoPerson} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                </div>
            </div>

            <AnimatePresence>
                {isCartOpen && <CartDrawer items={items} total={total} onClose={() => setIsCartOpen(false)} onUpdateQty={updateQuantity} onRemove={removeItem} onClear={clearCart} restaurantId={selectedRestaurant?.id} orderType={filterType} user={user} flashSaleConfig={selectedRestaurant?.flash_sale} displaySettings={selectedRestaurant?.display_settings} isRestaurantOpenFlag={selectedRestaurant?.is_open} />}
            </AnimatePresence>

            {/* SCROLL TO TOP BUTTON */}
            <ScrollToTopButton />
        </div>
    );
}

function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-20 right-4 z-40 p-3 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:scale-110 active:scale-95 transition-all outline-none border border-amber-400"
                >
                    <IoArrowUp className="text-xl" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

// --- SKELETON LOADERS ---
function RestaurantSkeleton() {
    return (
        <div className="bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-md rounded-[2rem] border border-white/60 dark:border-white/10 overflow-hidden shadow-sm animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-zinc-800 m-1.5 rounded-t-[2rem]" />
            <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-zinc-900 rounded-lg w-1/2" />
                <div className="h-10 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-full" />
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

// 2. SEARCH BAR WITH TYPEWRITER EFFECT
function SearchBarWithTypewriter({ value, onChange }) {
    const [placeholder, setPlaceholder] = useState('');
    const phrases = ["éttermet...", "ételt...", "italt...", "kedvencedet..."];

    useEffect(() => {
        let currentPhraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let timeout;

        const type = () => {
            const currentPhrase = phrases[currentPhraseIndex];
            if (isDeleting) {
                setPlaceholder(currentPhrase.substring(0, charIndex - 1));
                charIndex--;
            } else {
                setPlaceholder(currentPhrase.substring(0, charIndex + 1));
                charIndex++;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                setTimeout(() => { isDeleting = true; }, 1500);
                timeout = setTimeout(type, 1500);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
                timeout = setTimeout(type, 500);
            } else {
                timeout = setTimeout(type, isDeleting ? 50 : 100);
            }
        };

        timeout = setTimeout(type, 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <input
            type="text"
            placeholder={`Keress ${placeholder}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 pl-12 pr-4 rounded-full bg-white dark:bg-zinc-800/50 border border-transparent focus:border-amber-500/50 text-sm text-zinc-900 dark:text-white font-medium placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
        />
    );
}

// 3. SLIDER TOGGLE (Drag based)
function DeliveryCollectionSlider({ value, onChange, disabled }) {
    // Shrunk dimensions: Container 160px, Handle moves 80px
    const WIDTH = 80;
    const x = useMotionValue(value === "delivery" ? 0 : WIDTH);

    useEffect(() => {
        x.set(value === "delivery" ? 0 : WIDTH);
    }, [value]);

    return (
        <div className={`relative w-[160px] h-8 bg-white dark:bg-zinc-800/60 backdrop-blur-md rounded-full p-1 flex items-center shadow-sm border border-gray-100 dark:border-white/5 mx-auto lg:mx-0 ${disabled ? 'opacity-50 grayscale' : ''}`}>

            {/* Background labels */}
            <div className="absolute inset-0 flex text-[9px] font-bold text-gray-400 uppercase tracking-wider select-none pointer-events-none">
                <div className="w-1/2 flex items-center justify-center gap-1">
                    <IoBicycle className="text-xs opacity-50" />
                </div>
                <div className="w-1/2 flex items-center justify-center gap-1">
                    <IoStorefront className="text-xs opacity-50" />
                </div>
            </div>

            {/* Draggable pill */}
            <motion.div
                drag={disabled ? false : "x"}
                dragConstraints={{ left: 0, right: WIDTH }}
                dragElastic={0.1}
                dragMomentum={false}
                style={{ x }}
                onDragEnd={() => {
                    if (disabled) return;
                    const currentX = x.get();
                    if (currentX > WIDTH / 2) {
                        onChange("collection");
                    } else {
                        onChange("delivery");
                    }
                }}
                onTap={() => { if (!disabled) onChange(value === 'delivery' ? 'collection' : 'delivery') }}
                animate={{ x: value === "delivery" ? 0 : WIDTH }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute w-1/2 h-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full shadow-md flex items-center justify-center gap-1 text-[9px] font-bold cursor-grab active:cursor-grabbing z-10"
            >
                {value === "delivery" ? (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
                        <IoBicycle className="text-xs" /> <span>Futár</span>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
                        <IoStorefront className="text-xs" /> <span>Személyes átvétel</span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

function NavButton({ label, icon: Icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
              relative group flex flex-col items-center justify-center
              h-12 w-12 rounded-[1rem]
              transition-all duration-200 ease-out
              active:scale-90
              ${active
                    ? 'text-amber-600 dark:text-amber-500'
                    : 'text-[#1d1d1f] dark:text-gray-300 hover:text-black dark:hover:text-white'
                }
            `}
        >
            <Icon className={`
                text-[24px] mb-0.5 z-10 transition-transform duration-300
                ${active ? 'scale-110 filter drop-shadow-sm' : 'group-hover:scale-110'}
            `} />
            <span className="text-[9px] font-medium tracking-tight z-10 transition-opacity duration-300 leading-none whitespace-nowrap">
                {label}
            </span>
            {active && <div className="absolute -bottom-1 w-1 h-1 bg-current rounded-full opacity-60" />}
        </button>
    )
}
function MenuItemCard({ item, onAdd, flashRule }) {
    const isAvailable = item.is_available !== false;

    return (
        <FadeUp delay={0.05}>
            <div className={`group relative bg-white/50 dark:bg-[#1a1c2e]/50 rounded-[1.5rem] overflow-hidden shadow-sm transition-all duration-300 border border-white/60 dark:border-white/5 flex items-center gap-3 p-2.5 backdrop-blur-md ${!isAvailable ? 'grayscale opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-black/5 hover:scale-[1.01]'}`}>
                
                {/* SOLD OUT RIBBON (SZALAG) */}
                {!isAvailable && (
                    <div className="absolute top-0 right-0 z-20 pointer-events-none">
                        <div className="bg-red-600 text-white text-[8px] font-black py-1 px-8 translate-x-[25px] translate-y-[10px] rotate-45 shadow-md uppercase tracking-tighter">
                            ELFOGYOTT
                        </div>
                    </div>
                )}

                <div className="w-16 h-16 shrink-0 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden relative">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-110' : ''}`} /> : <div className="flex items-center justify-center h-full text-lg opacity-20">🍽️</div>}
                    
                    {flashRule && isAvailable && (
                        <div className="absolute top-0 left-0 z-10">
                            <div className={`px-1.5 py-0.5 text-[7px] font-black text-white uppercase rounded-br-lg shadow-sm ${flashRule.type === 'percent' ? 'bg-orange-500' : flashRule.type === 'bogo' ? 'bg-indigo-600' : 'bg-green-600'}`}>
                                {flashRule.type === 'percent' ? `-${flashRule.value}%` : flashRule.type === 'bogo' ? '1+1' : 'AJÁNDÉK'}
                            </div>
                        </div>
                    )}
                    
                    {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            {/* Simple overlay if needed, keeping it clean */}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-bold text-sm leading-tight line-clamp-1 ${isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{item.name}</h4>
                        <span className={`font-bold text-xs whitespace-nowrap ${isAvailable ? 'text-amber-600 dark:text-amber-500' : 'text-gray-400'}`}>{item.price} Ft</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                </div>
                {isAvailable ? (
                    <button onClick={onAdd} className="w-8 h-8 shrink-0 bg-white dark:bg-white/10 text-amber-500 rounded-full flex items-center justify-center shadow-sm hover:bg-amber-500 hover:text-white hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-white/10">
                        <IoAdd className="text-lg font-bold" />
                    </button>
                ) : (
                    <div className="w-8 h-8 shrink-0 bg-gray-200 dark:bg-white/5 text-gray-400 rounded-full flex items-center justify-center border border-dashed border-gray-300">
                        <IoClose className="text-base" />
                    </div>
                )}
            </div>
        </FadeUp>
    )
}
function ActiveOrderTracker({ order, onDismiss }) {
    if (!order) return null;

    const statuses = ['new', 'accepted', 'preparing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    const isCollection = order.address === 'Személyes átvétel';
    const isClosed = ['delivered', 'rejected', 'cancelled'].includes(order.status);

    const steps = [
        { id: 'new', label: 'Leadva', icon: IoReceipt },
        { id: 'preparing', label: 'Készül', icon: IoRestaurant },
        { id: 'ready', label: isCollection ? 'Jöhetsz érte!' : 'Futárnál', icon: isCollection ? IoStorefront : IoBicycle },
        { id: 'delivered', label: 'Kész', icon: IoStar }
    ];

    // Determine current logical step index for the simplified UI
    let activeStep = 0;
    if (order.status === 'new') activeStep = 0;
    if (order.status === 'accepted' || order.status === 'preparing') activeStep = 1;
    if (order.status === 'ready' || order.status === 'delivering') activeStep = 2;
    if (order.status === 'delivered') activeStep = 3;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[1.5rem] border border-white dark:border-white/10 shadow-lg mb-3 overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl -mr-12 -mt-12 rounded-full" />
            
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider">
                            {isClosed ? 'Rendelés Befejezve' : 'Élő Követés'}
                        </span>
                    </div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-1">
                        {order.restaurants?.name} <span className="text-gray-400 font-medium ml-1">#{order.id.slice(0, 6)}</span>
                    </div>
                </div>
                {onDismiss && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDismiss(); }} 
                        className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 p-1 rounded-full transition-colors"
                    >
                        <IoClose size={14} />
                    </button>
                )}
            </div>

            <div className="relative pt-1 pb-2 px-1">
                {/* Progress Line */}
                <div className="absolute top-[22px] left-6 right-6 h-0.5 bg-gray-100 dark:bg-white/5" />
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                    className="absolute top-[22px] left-6 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600"
                />

                <div className="flex justify-between relative z-10 px-1">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isPast = idx < activeStep;
                        const isActive = idx === activeStep;
                        
                        return (
                            <div key={idx} className="flex flex-col items-center gap-1.5 w-12">
                                <motion.div 
                                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                    transition={isActive ? { repeat: Infinity, duration: 3 } : {}}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                                        ${isPast ? 'bg-amber-500 text-white shadow-md' : 
                                          isActive ? 'bg-white dark:bg-zinc-800 border-2 border-amber-500 text-amber-500 shadow-lg' : 
                                          'bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600'}
                                    `}
                                >
                                    <Icon size={14} />
                                </motion.div>
                                <span className={`text-[7px] font-black uppercase tracking-tighter text-center leading-none ${isActive ? 'text-amber-600' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

function MyOrdersList({ user }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase.from('orders').select('*, restaurants(name), items:order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();
        const chan = supabase.channel(`my-orders-list-tab-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => { if (payload.new.user_id === user.id) fetchOrders(); }).subscribe();
        return () => supabase.removeChannel(chan);
    }, [user]);

    if (loading) return <div className="text-center opacity-50 text-xs">Töltés...</div>;
    if (orders.length === 0) return <div className="text-center opacity-50 text-xs">Nincs korábbi rendelés.</div>;
    return (
        <div className="space-y-3">
            {orders.map(order => (
                <div key={order.id} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/60 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{order.restaurants?.name}</div>
                        <span className="text-[9px] font-bold uppercase bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-gray-600 dark:text-gray-300">{getOrderStatusText(order.status)}</span>
                    </div>
                    <div className="space-y-0.5 mb-2 opacity-80 text-[11px]">{order.items?.map((item, i) => (<div key={i} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>{item.price * item.quantity} Ft</span></div>))}</div>
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center"><span className="text-[10px] text-gray-500">Összesen</span><span className="font-black text-amber-500 text-sm">{order.total_price} Ft</span></div>
                </div>
            ))}
        </div>
    );
}
function CartDrawer({ items, total, onClose, onUpdateQty, onRemove, onClear, restaurantId, orderType, user, flashSaleConfig, displaySettings, isRestaurantOpenFlag }) {
    const [step, setStep] = useState('cart');
    const [form, setForm] = useState({ name: '', phone: '', address: '', note: '', paymentMethod: 'cash' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate expired flash items
    const expiredItems = items.filter(item => {
        if (!item.flashRule) return false;
        const currentRule = flashSaleConfig?.active ? flashSaleConfig.items?.[item.id] : null;
        return !currentRule;
    });

    // VALIDATE MENU TIME
    const isMenuTimeValid = useMemo(() => {
        if (!displaySettings?.show_daily_menu) return false;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = (displaySettings.daily_menu_start || '11:00').split(':').map(Number);
        const [eh, em] = (displaySettings.daily_menu_end || '14:00').split(':').map(Number);
        return currentMinutes >= (sh * 60 + sm) && currentMinutes <= (eh * 60 + em);
    }, [displaySettings]);

    const invalidMenuItems = items.filter(item => {
        const isMenu = item.id.startsWith('daily-menu-') || item.id.startsWith('constant-menu-');
        if (!isMenu) return false;
        return !isMenuTimeValid;
    });

    // Validáló funkció nyitvatartáshoz.
    const isRestOpen = isRestaurantOpenFlag === true;

    const canSubmit = expiredItems.length === 0 && invalidMenuItems.length === 0 && isRestOpen;

    // Recalculate total based on FRESH config to detect price changes
    const displayTotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const price = item.price || 0;
            const qty = item.quantity || 0;
            const rule = flashSaleConfig?.active ? flashSaleConfig.items?.[item.id] : null;

            if (rule && rule.type === 'percent') {
                const discount = (rule.value || 0) / 100;
                return sum + Math.round(price * (1 - discount) * qty);
            }

            if (rule && rule.type === 'bogo') {
                const paidQty = qty - Math.floor(qty / 2);
                return sum + (price * paidQty);
            }

            return sum + (price * qty);
        }, 0);
    }, [items, flashSaleConfig]);

    const isCollection = orderType === 'collection';

    useEffect(() => {
        if (step === 'checkout' && user) {
            const fetchUserData = async () => {
                const { data } = await supabase.from('koszegpass_users').select('full_name, phone, address').eq('id', user.id).maybeSingle();
                if (data) setForm(prev => ({
                    ...prev,
                    name: data.full_name || prev.name,
                    phone: data.phone || prev.phone,
                    address: data.address || prev.address
                }));
            };
            fetchUserData();
        }
    }, [step, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log("USER:", user);
        // console.log("USER ID:", user?.id, typeof user?.id);
        if (!canSubmit) {
            if (!isRestOpen) {
                toast.error("Az étterem jelenleg zárva tart!");
            } else {
                toast.error("Lejárt tételek vannak a kosaradban!");
            }
            return;
        }
        setIsSubmitting(true);
        try {
            const ordersByRestaurant = items.reduce((acc, item) => {
                if (!acc[item.restaurant_id]) acc[item.restaurant_id] = [];
                acc[item.restaurant_id].push(item);
                return acc;
            }, {});

            await Promise.all(Object.keys(ordersByRestaurant).map(rId =>
                placeOrder({
                    restaurantId: rId,
                    customer: {
                        ...form,
                        userId: user?.id,
                        // If collection, override address
                        address: orderType === 'collection' ? 'Személyes átvétel' : form.address
                    },
                    cartItems: ordersByRestaurant[rId]
                })
            ));

            toast.success("Rendelés elküldve! 🍔 +Pontok jóváírva!");
            onClear();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba történt: ' + (error.message || 'Ismeretlen hiba'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-full max-w-md bg-white/90 dark:bg-[#151515]/95 backdrop-blur-[40px] h-full shadow-2xl pointer-events-auto flex flex-col border-l border-white/20">
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between"><h2 className="text-lg font-black">{step === 'cart' ? 'Kosarad 🛒' : 'Befejezés ✨'}</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:scale-110 transition-transform"><IoClose /></button></div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {items.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400"><IoBasket className="text-5xl mb-3 opacity-20" /><p className="text-sm">Még üres...</p></div> :
                        step === 'cart' ?
                            <div className="space-y-3">
                                {orderType === 'collection' && (
                                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-3 rounded-xl text-center text-xs font-bold border border-amber-200 dark:border-amber-900/50">
                                        🚶 Személyes átvétel kiválasztva
                                    </div>
                                )}
                                {items.map(item => {
                                    const isBogo = item.flashRule?.type === 'bogo';
                                    const isPercent = item.flashRule?.type === 'percent';
                                    const effectivePrice = isPercent ? Math.round(item.price * (1 - (item.flashRule.value || 0) / 100)) : item.price;

                                    return (
                                        <div key={item.id} className="flex gap-3 items-center bg-white/50 dark:bg-white/5 p-2 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden shrink-0">
                                                {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate text-sm text-gray-900 dark:text-white">{item.name}</h4>
                                                <div className="flex items-center gap-1.5 leading-none">
                                                    <p className="text-[10px] text-amber-600 font-bold">
                                                        {isPercent && <span className="line-through opacity-50 mr-1">{item.price}</span>}
                                                        {effectivePrice} Ft
                                                    </p>
                                                    {isBogo && <span className="text-[8px] bg-indigo-600 text-white px-1 py-0.5 rounded font-black leading-none">1+1 AKCIÓ</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white dark:bg-black/40 rounded-full px-2 py-1 shadow-sm">
                                                <button onClick={() => onUpdateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center hover:text-red-500"><IoRemove size={12} /></button>
                                                <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                                                <button onClick={() => onUpdateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center hover:text-green-500"><IoAdd size={12} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center font-black text-lg text-gray-900 dark:text-white">
                                    <span>Összesen:</span>
                                    <span>{displayTotal} Ft</span>
                                </div>
                                <button onClick={() => setStep('checkout')} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/30 mt-4 active:scale-95 transition-transform text-sm tracking-wide">Tovább a fizetéshez</button>
                            </div> :
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <input required type="text" placeholder="Név" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    <input required type="tel" placeholder="Telefonszám" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    {orderType !== 'collection' ? (
                                        <input required type="text" placeholder="Cím" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 text-xs font-bold text-center border border-dashed border-gray-300 dark:border-white/10">
                                            📍 Cím nem szükséges (Személyes átvétel)
                                        </div>
                                    )}
                                    <textarea rows={3} placeholder="Megjegyzés..." className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm resize-none" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                                </div>

                                {/* PAYMENT METHOD SELECTION */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fizetési mód</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, paymentMethod: 'cash' })}
                                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${form.paymentMethod === 'cash' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <IoWallet className="text-xl" />
                                                <span className="text-sm font-bold">Készpénzes fizetés futárnál / átvételkor</span>
                                            </div>
                                        </button>
                                        <p className="text-[10px] text-center text-gray-400 font-medium">Kártyás és online fizetés jelenleg fejlesztés alatt áll.</p>
                                    </div>
                                </div>
                                    {expiredItems.length > 0 && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                                            <div className="flex gap-2 text-left">
                                                <IoWarning className="text-amber-500 shrink-0 text-lg" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-tight">Figyelem! Néhány akció időközben lejárt.</p>
                                                    <p className="text-[9px] text-amber-700/80 dark:text-amber-400/70 mt-0.5">A kosarad frissült az eredeti árakkal. Kérjük, ellenőrizd a végösszeget!</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {invalidMenuItems.length > 0 && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                                            <div className="flex gap-2 text-left">
                                                <IoTime className="text-red-500 shrink-0 text-lg" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-red-800 dark:text-red-400 leading-tight">Lejárt a menüidő! ⏳</p>
                                                    <p className="text-[9px] text-red-700/80 dark:text-red-400/70 mt-0.5">A kosaradban lévő napi menük már nem rendelhetőek. Kérjük, távolítsd el őket a folytatáshoz!</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button type="submit" disabled={isSubmitting || !canSubmit} className={`w-full py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm ${!canSubmit ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none' : 'bg-amber-500 text-white shadow-amber-500/30'}`}>
                                        {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <span>Rendelés leadása</span>}
                                    </button>
                                <button type="button" onClick={() => setStep('cart')} className="w-full py-2 text-zinc-500 text-xs font-bold hover:text-amber-500 transition-colors">Vissza a kosárhoz</button>
                            </form>
                    }
                </div>
            </motion.div>
            {/* Back to Top Button */}
            <BackToTop />
        </div>
    );
}

const BackToTop = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisible = () => setVisible(window.pageYOffset > 500);
        window.addEventListener('scroll', toggleVisible, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisible);
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-5 z-50 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl active:scale-90 transition-all hover:bg-gray-50 dark:hover:bg-zinc-700 group ring-4 ring-black/5"
        >
            <IoArrowUp size={24} className="text-amber-500 group-hover:-translate-y-1 transition-transform" />
        </button>
    );
};
