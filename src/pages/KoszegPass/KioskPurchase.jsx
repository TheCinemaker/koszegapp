import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    IoCard, 
    IoCheckmarkCircle, 
    IoBusiness, 
    IoPerson, 
    IoMail, 
    IoPhonePortrait, 
    IoMap, 
    IoSettingsOutline,
    IoSparkles,
    IoAlertCircle,
    IoRibbonOutline,
    IoWalletOutline,
    IoCloseOutline
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

    // Form fields
    const [passType, setPassType] = useState('individual'); // 'individual' | 'family'
    const [holderName, setHolderName] = useState('');
    const [holderEmail, setHolderEmail] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [phone, setPhone] = useState('');
    
    // Stats fields
    const [stayDuration, setStayDuration] = useState('2-3');
    const [travelMethod, setTravelMethod] = useState('auto');

    // Billing fields
    const [billingZip, setBillingZip] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingAddress, setBillingAddress] = useState('');

    const [purchasing, setPurchasing] = useState(false);

    // Auto-fill billing zip when origin zip is typed (convenient default)
    const handleOriginZipChange = (val) => {
        setOriginZip(val);
        setBillingZip(val);
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

    const handleCheckout = async (e) => {
        e.preventDefault();

        if (!holderName.trim() || !holderEmail.trim()) {
            toast.error('Kérjük, add meg a kártyatulajdonos nevét és email címét!');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(holderEmail.trim())) {
            toast.error('Érvényes e-mail címet adj meg!');
            return;
        }

        if (!billingZip.trim() || !billingCity.trim() || !billingAddress.trim()) {
            toast.error('A számla kiállításához a teljes számlázási cím kitöltése kötelező!');
            return;
        }

        setPurchasing(true);
        const loadToast = toast.loading('Kapcsolódás a fizetési rendszerhez...');

        const compiledExtra = `stay:${stayDuration}|travel:${travelMethod}`;

        try {
            const response = await fetch('/.netlify/functions/koszeg-pass-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passType,
                    holderName: holderName.trim(),
                    holderEmail: holderEmail.trim(),
                    zip: billingZip.trim(),
                    city: billingCity.trim(),
                    address: billingAddress.trim(),
                    hotelSource: hotelSource || '',
                    originZip: originZip.trim(),
                    phone: phone.trim(),
                    extraInfo: compiledExtra
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Hiba történt a fizetés kezdeményezésekor');
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Nincs checkout URL a szerver válaszában');
            }

        } catch (error) {
            console.error('Kiosk checkout error:', error);
            toast.error(error.message || 'Sikertelen kapcsolódás a fizetési szolgáltatóhoz');
        } finally {
            toast.dismiss(loadToast);
            setPurchasing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0C234B] text-white p-4 sm:p-8 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Warning if hotel source is not configured */}
            {!hotelSource && (
                <div className="max-w-4xl mx-auto w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-200 text-xs sm:text-sm animate-pulse z-10">
                    <IoAlertCircle className="text-xl shrink-0 text-red-400" />
                    <div className="flex-1">
                        <strong>Nincs beállítva recepció azonosító (Hotel Source)!</strong> A kártyaértékesítések így nem lesznek szállodához rendelve. Kattints az oldal alján lévő fogaskerékre a beállításhoz!
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto w-full z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-stretch">
                
                {/* Left side: Premium info column */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-[#C8AF64]/10 border border-[#C8AF64]/30 text-[#C8AF64] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                Recepciós Kioszk Portal
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-[#C8AF64] to-white bg-clip-text text-transparent tracking-tight mb-3">
                            Vásároljon KőszegPass-t!
                        </h1>
                        <p className="text-blue-200/60 text-sm leading-relaxed mb-8">
                            A KőszegPass a Te személyes digitális kártyád, amellyel azonnali kedvezményekben részesülsz a város múzeumaiban, éttermeiben és látnivalóinál.
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                    <IoRibbonOutline size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Azonnali Kedvezmények</h4>
                                    <p className="text-xs text-blue-100/50">Mutassa fel a QR-kódot a helyszíneken.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                                    <IoWalletOutline size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Apple & Google Wallet</h4>
                                    <p className="text-xs text-blue-100/50">Mentés közvetlenül a telefon gyári tárcájába.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                    <IoSparkles size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Biztonságos Vásárlás</h4>
                                    <p className="text-xs text-blue-100/50">A fizetés után azonnal letölthető QR-kóddal.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        {hotelSource && (
                            <div className="bg-[#C8AF64]/10 border border-[#C8AF64]/20 rounded-xl p-3 text-center text-xs text-[#C8AF64] font-bold">
                                📍 ÉRTÉKESÍTŐ HELY: {hotelSource.toUpperCase()}
                            </div>
                        )}
                        <p className="text-[10px] text-blue-200/40 text-center mt-3">
                            Kőszegi Turisztikai Egyesület | visitkoszeg.hu
                        </p>
                    </div>
                </div>

                {/* Right side: Detailed combined registration & purchase form */}
                <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleCheckout} className="space-y-6">
                        
                        {/* Step 1: Pass Type */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-200/50 mb-3 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#C8AF64] text-[#0C234B] flex items-center justify-center font-bold text-[10px] pt-0.5">1</span>
                                Válasszon Kártyatípust
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Individual Pass */}
                                <div
                                    onClick={() => setPassType('individual')}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 relative ${
                                        passType === 'individual' 
                                            ? 'bg-white/10 border-[#C8AF64] shadow-md shadow-[#C8AF64]/5' 
                                            : 'bg-black/20 border-white/10 hover:bg-black/30'
                                    }`}
                                >
                                    <div>
                                        <h4 className="font-bold text-sm text-white flex items-center justify-between">
                                            <span>Egyéni Pass</span>
                                            {passType === 'individual' && <IoCheckmarkCircle className="text-[#C8AF64] text-lg" />}
                                        </h4>
                                        <p className="text-[9px] text-blue-100/50 mt-0.5">Egy személy részére</p>
                                    </div>
                                    <p className="text-lg font-black text-[#C8AF64]">4 000 Ft <span className="text-[10px] font-normal text-blue-200/50">/ év</span></p>
                                </div>

                                {/* Family Pass */}
                                <div
                                    onClick={() => setPassType('family')}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-24 relative ${
                                        passType === 'family' 
                                            ? 'bg-white/10 border-[#C8AF64] shadow-md shadow-[#C8AF64]/5' 
                                            : 'bg-black/20 border-white/10 hover:bg-black/30'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 bg-[#C8AF64] text-[#0C234B] text-[8px] font-black px-2 py-0.5 rounded-tr-xl rounded-bl-xl uppercase tracking-wider">
                                        Családi
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white flex items-center justify-between pr-8">
                                            <span>Családi Pass</span>
                                            {passType === 'family' && <IoCheckmarkCircle className="text-[#C8AF64] text-lg" />}
                                        </h4>
                                        <p className="text-[9px] text-blue-100/50 mt-0.5">2 felnőtt + gyermekek</p>
                                    </div>
                                    <p className="text-lg font-black text-[#C8AF64]">10 000 Ft <span className="text-[10px] font-normal text-blue-200/50">/ év</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Guest details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-200/50 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#C8AF64] text-[#0C234B] flex items-center justify-center font-bold text-[10px] pt-0.5">2</span>
                                Kártyabirtokos Adatai
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider ml-1">Név *</label>
                                    <div className="relative">
                                        <IoPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200/40" />
                                        <input
                                            type="text"
                                            required
                                            value={holderName}
                                            onChange={e => setHolderName(e.target.value)}
                                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                            placeholder="Kovács István"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider ml-1">Email cím (pass kézbesítéséhez) *</label>
                                    <div className="relative">
                                        <IoMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200/40" />
                                        <input
                                            type="email"
                                            required
                                            value={holderEmail}
                                            onChange={e => setHolderEmail(e.target.value)}
                                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                            placeholder="pl. kovacs@gmail.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider ml-1">Honnan érkezett? (Irányítószám)</label>
                                    <div className="relative">
                                        <IoMap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200/40" />
                                        <input
                                            type="text"
                                            value={originZip}
                                            onChange={e => handleOriginZipChange(e.target.value)}
                                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                            placeholder="Pl. 9700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider ml-1">Telefonszám (Opcionális)</label>
                                    <div className="relative">
                                        <IoPhonePortrait className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200/40" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                            placeholder="+36 30 123 4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase text-blue-200/40 tracking-wider">Hány napra jött?</label>
                                    <select
                                        value={stayDuration}
                                        onChange={e => setStayDuration(e.target.value)}
                                        className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40"
                                    >
                                        <option className="bg-[#0C234B]" value="1">1 nap (átutazó)</option>
                                        <option className="bg-[#0C234B]" value="2-3">2-3 nap (hétvége)</option>
                                        <option className="bg-[#0C234B]" value="4-7">4-7 nap</option>
                                        <option className="bg-[#0C234B]" value="8+">Több mint egy hét</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase text-blue-200/40 tracking-wider">Utazási mód</label>
                                    <select
                                        value={travelMethod}
                                        onChange={e => setTravelMethod(e.target.value)}
                                        className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40"
                                    >
                                        <option className="bg-[#0C234B]" value="auto">Autó</option>
                                        <option className="bg-[#0C234B]" value="vonat">Vonat / Busz</option>
                                        <option className="bg-[#0C234B]" value="kerekpar">Kerékpár</option>
                                        <option className="bg-[#0C234B]" value="egyeb">Egyéb</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Billing details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-blue-200/50 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#C8AF64] text-[#0C234B] flex items-center justify-center font-bold text-[10px] pt-0.5">3</span>
                                Számlázási Cím (Számla kiállításához)
                            </h3>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[8px] font-bold uppercase text-blue-200/40 tracking-wider ml-1">Irányítószám *</label>
                                    <input
                                        type="text"
                                        required
                                        value={billingZip}
                                        onChange={e => setBillingZip(e.target.value)}
                                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                        placeholder="9700"
                                    />
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <label className="text-[8px] font-bold uppercase text-blue-200/40 tracking-wider ml-1">Település *</label>
                                    <input
                                        type="text"
                                        required
                                        value={billingCity}
                                        onChange={e => setBillingCity(e.target.value)}
                                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                        placeholder="Kőszeg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase text-blue-200/40 tracking-wider ml-1">Cím (utca, házszám) *</label>
                                <input
                                    type="text"
                                    required
                                    value={billingAddress}
                                    onChange={e => setBillingAddress(e.target.value)}
                                    className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40 transition-all placeholder:text-blue-200/20"
                                    placeholder="Jurisics tér 1."
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={purchasing}
                                className="w-full h-14 bg-gradient-to-r from-[#C8AF64] to-[#e4cc7d] hover:scale-[1.01] active:scale-95 text-[#0C234B] font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IoCard size={20} />
                                <span>{purchasing ? 'Fizetési kapu betöltése...' : 'Fizetés bankkártyával (Stripe)'}</span>
                            </button>
                            <p className="text-center text-[9px] text-blue-200/30 mt-2">
                                A tranzakció sikere után a számlát a Billingo rendszere automatikusan megküldi a megadott e-mail címre.
                            </p>
                        </div>

                    </form>
                </div>
            </div>

            {/* Footer with settings cog (unobtrusive) */}
            <div className="flex justify-end p-2 mt-4 z-10 relative">
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
