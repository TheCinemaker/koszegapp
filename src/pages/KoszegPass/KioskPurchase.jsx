import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    IoCard, 
    IoSettingsOutline,
    IoSparkles,
    IoAlertCircle,
    IoRibbonOutline,
    IoWalletOutline,
    IoCloseOutline,
    IoArrowForward,
    IoQrCodeOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function KioskPurchase() {
    const navigate = useNavigate();

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
        // Ensure kiosk mode flag is set
        localStorage.setItem('kiosk_mode', 'true');
        
        // Build navigation target with hotel source if configured
        const target = hotelSource 
            ? `/pass/register?hotel=${encodeURIComponent(hotelSource)}` 
            : '/pass/register';
        
        navigate(target);
    };

    return (
        <div className="min-h-screen bg-[#0C234B] text-white p-6 sm:p-12 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

            {/* Warning if hotel source is not configured */}
            {!hotelSource && (
                <div className="max-w-4xl mx-auto w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-200 text-xs sm:text-sm animate-pulse z-10">
                    <IoAlertCircle className="text-xl shrink-0 text-red-400" />
                    <div className="flex-1">
                        <strong>Nincs beállítva recepció azonosító (Hotel Source)!</strong> A kártyaértékesítések így nem lesznek szállodához rendelve. Kattints az oldal alján lévő fogaskerékre a beállításhoz!
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto w-full z-10 flex-1 flex flex-col justify-center py-8">
                
                {/* Main Card container */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 bg-[#C8AF64] text-[#0C234B] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                        RECEPCIÓS VÁSÁRLÁS
                    </div>

                    {/* Logo / Header */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#C8AF64] to-[#e4cc7d] flex items-center justify-center text-[#0C234B] shadow-xl shadow-[#C8AF64]/10">
                            <IoQrCodeOutline size={44} className="animate-pulse" />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-[#C8AF64] to-white bg-clip-text text-transparent tracking-tight mb-4">
                        KőszegPass Vásárlás
                    </h1>
                    
                    <p className="text-blue-200/70 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-10">
                        Vásárolja meg digitális kedvezménykártyáját a recepción, fizessen biztonságosan bankkártyával, majd szkennelje be a QR-kódot a kártya letöltéséhez közvetlenül a telefonjára!
                    </p>

                    {/* Pricing presentation */}
                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                            <h4 className="font-bold text-white text-base mb-1">Egyéni Pass</h4>
                            <p className="text-[10px] text-blue-200/50 mb-3">Egy személy részére</p>
                            <p className="text-2xl font-black text-[#C8AF64]">4 000 Ft</p>
                            <p className="text-[9px] text-blue-100/40 mt-0.5">/ 1 év érvényesség</p>
                        </div>
                        <div className="bg-white/5 border border-[#C8AF64]/20 rounded-2xl p-5 text-center relative">
                            <div className="absolute top-0 right-0 bg-[#C8AF64]/20 text-[#C8AF64] text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                                Családi opció
                            </div>
                            <h4 className="font-bold text-white text-base mb-1">Családi Pass</h4>
                            <p className="text-[10px] text-blue-200/50 mb-3">2 felnőtt + gyermekek részére</p>
                            <p className="text-2xl font-black text-[#C8AF64]">10 000 Ft</p>
                            <p className="text-[9px] text-blue-100/40 mt-0.5">/ 1 év érvényesség</p>
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
                    <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-white/5 text-xs text-blue-200/60 font-medium">
                        <span className="flex items-center gap-1.5"><IoRibbonOutline className="text-[#C8AF64] text-sm" /> Múzeumi és éttermi kedvezmények</span>
                        <span className="flex items-center gap-1.5"><IoWalletOutline className="text-[#C8AF64] text-sm" /> Apple & Google Wallet támogatás</span>
                    </div>

                </div>
            </div>

            {/* Bottom area: Hotel Badge & Settings Gear */}
            <div className="flex justify-between items-center max-w-4xl mx-auto w-full z-10 border-t border-white/5 pt-4">
                <div className="text-left">
                    {hotelSource ? (
                        <div className="bg-[#C8AF64]/10 border border-[#C8AF64]/20 rounded-xl px-3 py-1.5 text-xs text-[#C8AF64] font-bold inline-block">
                            📍 Recepció: {hotelSource.toUpperCase()}
                        </div>
                    ) : (
                        <span className="text-red-400 text-xs font-semibold">⚠️ Recepció nincs konfigurálva</span>
                    )}
                </div>

                <button
                    onClick={() => {
                        setHotelSourceInput(hotelSource);
                        setShowSettings(true);
                    }}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-blue-200/50 hover:text-white"
                    title="Kioszk beállítások"
                >
                    <IoSettingsOutline size={20} />
                </button>
            </div>

            {/* Settings Modal (only for receptionist) */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0e2042] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-left"
                        >
                            <button
                                onClick={() => setShowSettings(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-full"
                            >
                                <IoCloseOutline size={22} />
                            </button>

                            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-1.5">
                                <IoSettingsOutline className="text-[#C8AF64]" /> Kioszk Beállítások
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
