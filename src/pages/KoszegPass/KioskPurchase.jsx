import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    IoCard, 
    IoAlertCircle, 
    IoRibbonOutline, 
    IoWalletOutline, 
    IoCloseOutline, 
    IoArrowForward, 
    IoQrCodeOutline,
    IoSunnyOutline,
    IoMoonOutline,
    IoInformationCircleOutline
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
    const [showInfoModal, setShowInfoModal] = useState(false);
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
                    background: '#1a1c2e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            });
        }, 5000);
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
        <div className="h-screen w-screen text-slate-900 dark:text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden bg-transparent select-none box-border pt-20">
            {/* Ambient glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

            {/* Premium Custom Header (Matches main app header style 100%) */}
            <header className="fixed top-4 left-4 right-4 h-14 z-40 flex justify-center">
                <div className="
                    w-full max-w-5xl
                    h-full
                    flex items-center justify-between px-4 sm:px-6
                    bg-white/75 dark:bg-[#1a1c2e]/40 
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
                        <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-indigo-700 to-indigo-900 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tighter uppercase">
                            Kőszeg
                        </span>
                    </div>

                    {/* Right side: Dark Mode Switch & Inscription */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase hidden sm:inline">
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
                <div className="max-w-4xl mx-auto w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-2 flex items-center gap-3 text-red-700 dark:text-red-200 text-xs z-10 shrink-0">
                    <IoAlertCircle className="text-lg shrink-0 text-red-500 dark:text-red-400" />
                    <div className="flex-1 text-[11px] leading-tight">
                        <strong>Nincs beállítva recepció azonosító (Hotel Source)!</strong> A kártyaértékesítések így nem lesznek szállodához rendelve. A beállításhoz a recepciós tartsa nyomva a bal felső <strong>visitKőszeg</strong> logót 5 másodpercig.
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto w-full z-10 flex-1 flex flex-col justify-center overflow-hidden py-2 sm:py-4">
                
                {/* 2-Column Responsive Card (Matches Home Page cards styling 100% - No Gold) */}
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-[30px] backdrop-saturate-[1.6] border border-white/60 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                        RECEPCIÓS VÁSÁRLÁS
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Left Column: Info & Benefits */}
                        <div className="md:col-span-6 text-left space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-900/[0.06] dark:bg-white/10 text-gray-800 dark:text-gray-100 flex items-center justify-center shrink-0">
                                    <IoQrCodeOutline size={26} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                                        KőszegPass
                                    </h1>
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-blue-200/50 uppercase tracking-widest leading-none">
                                        Digitális Városkártya
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
                                Vásárolja meg digitális kedvezménykártyáját a recepción, fizessen biztonságosan bankkártyával, majd szkennelje be a QR-kódot a kártya letöltéséhez közvetlenül a telefonjára!
                            </p>

                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-white/5">
                                <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-300 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <IoRibbonOutline className="text-indigo-600 dark:text-indigo-400 text-sm shrink-0" />
                                        <span>Múzeumi és éttermi kedvezmények</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <IoWalletOutline className="text-indigo-600 dark:text-indigo-400 text-sm shrink-0" />
                                        <span>Apple & Google Wallet támogatás</span>
                                    </div>
                                </div>
                                
                                {/* Info Button Modal Trigger */}
                                <button 
                                    onClick={() => { setShowInfoModal(true); triggerHaptic(); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors mt-2 text-left self-start"
                                    type="button"
                                >
                                    <IoInformationCircleOutline size={16} />
                                    <span>Mire használható a KőszegPass?</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Pricing & CTA (Enlarged and Emphasized) */}
                        <div className="md:col-span-6 flex flex-col gap-4">
                            {/* Pricing selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/15 rounded-2xl p-5 text-center shadow-sm">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">Egyéni Kártya</h4>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 my-1.5 leading-none">4 000 Ft</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">/ 1 év érvényesség</p>
                                </div>
                                <div className="bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/15 rounded-2xl p-5 text-center shadow-sm">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">Családi Kártya</h4>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 my-1.5 leading-none">10 000 Ft</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">/ 1 év érvényesség</p>
                                </div>
                            </div>

                            {/* Big CTA Button */}
                            <button
                                onClick={handleStartPurchase}
                                className="w-full h-15 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base mt-2 active:scale-95 py-4"
                            >
                                <IoCard size={20} />
                                <span>Vásárlás indítása</span>
                                <IoArrowForward size={18} />
                            </button>
                        </div>

                    </div>

                </div>
            </div>

            {/* Bottom area: Hotel Badge */}
            <div className="flex justify-between items-center max-w-4xl mx-auto w-full z-10 border-t border-gray-200 dark:border-white/5 pt-2 shrink-0">
                <div className="text-left">
                    {hotelSource ? (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-lg px-2.5 py-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold inline-block">
                            📍 Recepció: {hotelSource.toUpperCase()}
                        </div>
                    ) : (
                        <span className="text-red-500 dark:text-red-400 text-[10px] font-semibold">⚠️ Recepció nincs konfigurálva</span>
                    )}
                </div>
                <div className="text-[9px] text-gray-400 dark:text-zinc-500">
                    visitkoszeg.hu | minden jog fenntartva
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
                            className="bg-[#1a1c2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl text-left text-white"
                        >
                            <button
                                onClick={() => setShowSettings(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-full"
                            >
                                <IoCloseOutline size={22} />
                            </button>

                            <h3 className="text-base font-black text-white mb-1 flex items-center gap-1.5">
                                <IoSunnyOutline className="text-indigo-400" /> Kioszk Beállítások
                            </h3>
                            <p className="text-xs text-gray-300 mb-4">
                                Állítsa be a recepcióhoz tartozó kódot (pl. `irottko` vagy `szarvas`). Ez a kód mentésre kerül ezen a tableten.
                            </p>

                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        Hotel Source Kód (Kisbetűs, ékezetek nélkül)
                                    </label>
                                    <input
                                        type="text"
                                        value={hotelSourceInput}
                                        onChange={e => setHotelSourceInput(e.target.value)}
                                        placeholder="pl. irottko"
                                        className="w-full h-10 bg-black/35 border border-white/10 rounded-xl px-3 text-xs text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl text-xs transition-colors"
                                >
                                    Mentés és bezárás
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Info Modal / Partner List explaining what the pass is for */}
            <AnimatePresence>
                {showInfoModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative shadow-2xl text-left text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                            >
                                <IoCloseOutline size={22} />
                            </button>

                            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                                <IoInformationCircleOutline className="text-indigo-600 dark:text-indigo-400" />
                                Mire használható a KőszegPass?
                            </h3>
                            
                            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">🎟️ Azonnali Kedvezmények</h4>
                                    <p>
                                        Mutassa fel a kártyát a partnereknél a kedvezmények igénybevételéhez. Nem kell jegyeket keresgélnie, a telefonján lévő QR-kód elegendő!
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">🏛️ Kiemelt Elfogadóhelyek</h4>
                                    <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600 dark:text-gray-300">
                                        <li><strong>Múzeumok:</strong> Tábornokház, Hősök Tornya, Arany Egyszarvú Patikamúzeum</li>
                                        <li><strong>Várszínház:</strong> Kedvezmények a nyári színházi előadások jegyáraiból</li>
                                        <li><strong>Gasztronómia:</strong> Kijelölt helyi éttermek, kávézók és borászatok kedvezményei</li>
                                        <li><strong>Látnivalók & Szabadidő:</strong> Helyi túrák, kerékpárkölcsönzés és ajándékboltok</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">🗓️ Hosszú Érvényesség</h4>
                                    <p>
                                        A kártya a vásárlás pillanatától kezdve **1 naptári évig érvényes**, így akár többszöri látogatás során is használható.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">👨‍👩‍👧 Családi Megtakarítás</h4>
                                    <p>
                                        A Családi Pass 2 felnőtt és gyermekeik számára biztosít teljes körű kedvezményes hozzáférést a városi programokhoz.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl text-xs transition-colors"
                            >
                                Értem, köszönöm
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
