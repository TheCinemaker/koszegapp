import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    IoCard, 
    IoSparkles, 
    IoAlertCircle, 
    IoRibbonOutline, 
    IoWalletOutline, 
    IoCloseOutline, 
    IoArrowForward, 
    IoQrCodeOutline,
    IoSunnyOutline,
    IoMoonOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DarkModeContext } from '../../contexts/DarkModeContext';
import { triggerHaptic } from '../../utils/haptics';

export default function KioskPurchase() {
    const navigate = useNavigate();
    const { dark, toggleDark } = useContext(DarkModeContext);

    // Set kiosk mode to true on mount so success screen knows we are a tablet
    useEffect(() => {
        localStorage.setItem('kiosk_mode', 'true');
    }, []);

    // Hotel Source configuration state (for receptionist)
    const [showSettings, setShowSettings] = useState(false);
    const [hotelSourceInput, setHotelSourceInput] = useState(() => {
        return localStorage.getItem('kiosk_hotel_source') || '';
    });
    const [hotelSource, setHotelSource] = useState(() => {
        return localStorage.getItem('kiosk_hotel_source') || '';
    });

    // Press-and-hold timer for hidden settings access (5 seconds)
    const [pressTimer, setPressTimer] = useState(null);

    const handlePressStart = () => {
        const timer = setTimeout(() => {
            triggerHaptic();
            setShowSettings(true);
            toast.success('Rendszerbeállítások feloldva! ⚙️', {
                style: {
                    background: '#0e2042',
                    color: '#fff',
                    border: '1px solid rgba(200,175,100,0.3)'
                }
            });
        }, 5000); // 5000 milliseconds = 5 seconds
        setPressTimer(timer);
    };

    const handlePressEnd = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    // Save hotel source settings
    const handleSaveSettings = (e) => {
        e.preventDefault();
        const trimmed = hotelSourceInput.trim().toLowerCase();
        localStorage.setItem('kiosk_hotel_source', trimmed);
        setHotelSource(trimmed);
        setShowSettings(false);
        toast.success(`Recepció sikeresen beállítva: ${trimmed || 'Nincs megadva (Általános)'}`);
    };

    const handleStartPurchase = () => {
        localStorage.setItem('kiosk_mode', 'true');
        const target = hotelSource 
            ? `/pass/register?hotel=${encodeURIComponent(hotelSource)}` 
            : '/pass/register';
        navigate(target);
    };

    return (
        <div className="min-h-screen text-gray-900 dark:text-white p-6 sm:p-12 relative overflow-hidden flex flex-col justify-between pt-28 bg-transparent">
            {/* Custom Header (Same style as main App header, includes dark-light switch) */}
            <header className="fixed top-4 left-4 right-4 h-14 z-40 flex justify-center">
                <div className="
                    w-full max-w-5xl
                    h-full
                    flex items-center justify-between px-4 sm:px-6
                    bg-white/70 dark:bg-[#1a1c2e]/40 
                    backdrop-blur-[25px] 
                    backdrop-saturate-[1.8]
                    rounded-2xl 
                    border border-white/60 dark:border-white/20 
                    shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                    relative
                ">
                    <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />

                    {/* Hidden Settings Access Behind the Logo (5s Long Press) */}
                    <div 
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        className="flex items-center cursor-pointer whitespace-nowrap select-none active:scale-95 transition-all duration-300 group"
                        title="Beállítások megnyitásához tartsa nyomva 5 másodpercig"
                    >
                        <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                            visit
                        </span>
                        <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-indigo-700 to-indigo-900 dark:from-[#C8AF64] dark:to-[#e4cc7d] bg-clip-text text-transparent tracking-tighter uppercase">
                            Kőszeg
                        </span>
                    </div>

                    {/* Right side: Dark Mode Switch & Inscription */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-[#C8AF64] tracking-widest uppercase hidden sm:inline">
                            KőszegPass Vásárlás
                        </span>
                        
                        <button
                            onClick={() => { toggleDark(); triggerHaptic(); }}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full
                                bg-gray-100 dark:bg-black/20
                                text-gray-700 dark:text-gray-200
                                border border-gray-200 dark:border-white/20
                                hover:bg-gray-200 dark:hover:bg-black/40
                                transition-all duration-300 hover:scale-105 active:scale-95"
                            title={dark ? 'Világos mód' : 'Sötét mód'}
                        >
                            {dark ? (
                                <IoSunnyOutline className="text-lg text-yellow-400" />
                            ) : (
                                <IoMoonOutline className="text-lg text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Warning if hotel source is not configured (Static design) */}
            {!hotelSource && (
                <div className="max-w-4xl mx-auto w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-700 dark:text-red-200 text-xs sm:text-sm z-10">
                    <IoAlertCircle className="text-xl shrink-0 text-red-500 dark:text-red-400" />
                    <div className="flex-1">
                        <strong>Nincs beállítva recepció azonosító (Hotel Source)!</strong> A kártyaértékesítések így nem lesznek szállodához rendelve. A beállításhoz a recepciós tartsa nyomva a bal felső <strong>visitKőszeg</strong> logót 5 másodpercig.
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto w-full z-10 flex-1 flex flex-col justify-center py-6">
                
                {/* Main Card container (Matches Home Page cards styling) */}
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-[30px] backdrop-saturate-[1.6] border border-white/60 dark:border-white/10 text-gray-900 dark:text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl text-center relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 bg-[#C8AF64] text-[#0C234B] text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                        RECEPCIÓS VÁSÁRLÁS
                    </div>

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#C8AF64] to-[#e4cc7d] flex items-center justify-center text-[#0C234B] shadow-xl shadow-[#C8AF64]/10">
                            <IoQrCodeOutline size={44} />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-gray-900 via-[#C8AF64] to-gray-900 dark:from-white dark:via-[#C8AF64] dark:to-white bg-clip-text text-transparent tracking-tight mb-4">
                        KőszegPass Vásárlás
                    </h1>
                    
                    <p className="text-gray-600 dark:text-blue-200/70 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-10">
                        Vásárolja meg digitális kedvezménykártyáját a recepción, fizessen biztonságosan bankkártyával, majd szkennelje be a QR-kódot a kártya letöltéséhez közvetlenül a telefonjára!
                    </p>

                    {/* Pricing presentation */}
                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
                        <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-center">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1">Egyéni Pass</h4>
                            <p className="text-[10px] text-gray-500 dark:text-blue-200/50 mb-3">Egy személy részére</p>
                            <p className="text-2xl font-black text-[#C8AF64]">4 000 Ft</p>
                            <p className="text-[9px] text-gray-400 dark:text-blue-100/40 mt-0.5">/ 1 év érvényesség</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-[#C8AF64]/25 rounded-2xl p-5 text-center relative">
                            <div className="absolute top-0 right-0 bg-[#C8AF64]/20 text-[#C8AF64] text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                                Családi opció
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1">Családi Pass</h4>
                            <p className="text-[10px] text-gray-500 dark:text-blue-200/50 mb-3">2 felnőtt + gyermekek részére</p>
                            <p className="text-2xl font-black text-[#C8AF64]">10 000 Ft</p>
                            <p className="text-[9px] text-gray-400 dark:text-blue-100/40 mt-0.5">/ 1 év érvényesség</p>
                        </div>
                    </div>

                    {/* Big CTA Button */}
                    <button
                        onClick={handleStartPurchase}
                        className="w-full max-w-lg mx-auto h-16 bg-gradient-to-r from-[#C8AF64] to-[#e4cc7d] hover:scale-[1.02] active:scale-95 text-[#0C234B] font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
                    >
                        <IoCard size={22} />
                        <span>Vásárlás indítása</span>
                        <IoArrowForward size={20} />
                    </button>

                    {/* Quick Benefits list */}
                    <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-blue-200/60 font-medium">
                        <span className="flex items-center gap-1.5"><IoRibbonOutline className="text-[#C8AF64] text-sm" /> Múzeumi és éttermi kedvezmények</span>
                        <span className="flex items-center gap-1.5"><IoWalletOutline className="text-[#C8AF64] text-sm" /> Apple & Google Wallet támogatás</span>
                    </div>

                </div>
            </div>

            {/* Bottom area: Hotel Badge (No settings button) */}
            <div className="flex justify-start items-center max-w-4xl mx-auto w-full z-10 border-t border-gray-200 dark:border-white/5 pt-4">
                <div>
                    {hotelSource ? (
                        <div className="bg-[#C8AF64]/10 border border-[#C8AF64]/20 rounded-xl px-3 py-1.5 text-xs text-[#C8AF64] font-bold inline-block">
                            📍 Recepció: {hotelSource.toUpperCase()}
                        </div>
                    ) : (
                        <span className="text-red-500 dark:text-red-400 text-xs font-semibold">⚠️ Recepció nincs konfigurálva</span>
                    )}
                </div>
            </div>

            {/* Settings Modal (only for receptionist) */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0e2042] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-left text-white"
                        >
                            <button
                                onClick={() => setShowSettings(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-full"
                            >
                                <IoCloseOutline size={22} />
                            </button>

                            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-1.5">
                                <IoSunnyOutline className="text-[#C8AF64]" /> Kioszk Beállítások
                            </h3>
                            <p className="text-xs text-blue-200/60 mb-6">
                                Állítsa be a recepcióhoz tartozó kódot (pl. `irottko` vagy `szarvas`). Ez a kód mentésre kerül ezen a tableten.
                            </p>

                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-blue-200/50">
                                        Hotel Source Kód (Kisbetűs, ékezetek nélkül)
                                    </label>
                                    <input
                                        type="text"
                                        value={hotelSourceInput}
                                        onChange={e => setHotelSourceInput(e.target.value)}
                                        placeholder="pl. irottko"
                                        className="w-full h-11 bg-black/35 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-[#C8AF64]/50 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] font-black h-11 rounded-xl text-xs transition-colors"
                                >
                                    Mentés és bezárás
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
