import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoPerson, IoMail, IoPhonePortrait, IoMap, IoStatsChart, IoArrowForward } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PassRegister() {
    const navigate = useNavigate();
    
    // Parse URL params
    const searchParams = new URLSearchParams(window.location.search);
    const urlHotel = searchParams.get('hotel') || searchParams.get('hotel_source') || '';

    const [form, setForm] = useState({
        holderName: '',
        holderEmail: '',
        originZip: '',
        phone: '',
        extraInfo: '', // "Mivel utazott?", "Hány éjszakát tölt?", stb.
        hotelSource: urlHotel
    });

    const [stayDuration, setStayDuration] = useState('2-3'); // Stay duration options
    const [travelMethod, setTravelMethod] = useState('auto'); // Travel method options

    useEffect(() => {
        if (urlHotel) {
            // Save to session storage in case they refresh or go back/forth
            sessionStorage.setItem('kp_hotel_source', urlHotel);
        } else {
            const saved = sessionStorage.getItem('kp_hotel_source');
            if (saved) {
                setForm(f => ({ ...f, hotelSource: saved }));
            }
        }
    }, [urlHotel]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.holderName.trim() || !form.holderEmail.trim()) {
            toast.error('Kérjük, add meg a nevedet és email címedet!');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.holderEmail)) {
            toast.error('Kérjük, érvényes email címet adj meg!');
            return;
        }

        // Compile extra stats into extraInfo
        const compiledExtra = `stay:${stayDuration}|travel:${travelMethod}`;
        
        const registrationData = {
            ...form,
            extraInfo: compiledExtra
        };

        // Navigate to purchase page with registration data in router state
        navigate('/pass/buy', { state: { registrationData } });
    };

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-lg z-10"
            >
                {/* Back button */}
                <button 
                    onClick={() => navigate(localStorage.getItem('kiosk_mode') === 'true' ? '/buy-pass' : '/pass')} 
                    className="p-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-full transition-colors mb-6 flex items-center justify-center w-10 h-10 shadow-sm"
                >
                    <IoArrowBack size={20} className="text-gray-600 dark:text-gray-300" />
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-brand dark:text-white">
                        Turisztikai Regisztráció
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">
                        Kérjük, add meg az adataidat a KőszegPass kiállításához és statisztikai elemzésekhez.
                    </p>
                </div>

                {form.hotelSource && (
                    <div className="bg-brand/10 dark:bg-indigo-500/10 border border-brand/20 dark:border-indigo-500/20 rounded-xl p-3 mb-6 text-center text-xs text-brand dark:text-indigo-400 font-semibold">
                        📍 Szálláshelyed: {form.hotelSource.toUpperCase()}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Holder Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Kártyatulajdonos Neve *</label>
                        <div className="relative">
                            <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={form.holderName}
                                onChange={e => setForm({ ...form, holderName: e.target.value })}
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl pl-12 pr-4 focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white text-sm"
                                placeholder="Pl. Kovács István"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Email cím (pass kézbesítéséhez) *</label>
                        <div className="relative">
                            <IoMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={form.holderEmail}
                                onChange={e => setForm({ ...form, holderEmail: e.target.value })}
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl pl-12 pr-4 focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white text-sm"
                                placeholder="kovacs.istvan@gmail.com"
                            />
                        </div>
                    </div>

                    {/* Origin Zip Code */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Honnan érkeztél? (Irányítószám)</label>
                        <div className="relative">
                            <IoMap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                maxLength={8}
                                value={form.originZip}
                                onChange={e => setForm({ ...form, originZip: e.target.value })}
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl pl-12 pr-4 focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white text-sm"
                                placeholder="Pl. 9700"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Telefonszám (Opcionális)</label>
                        <div className="relative">
                            <IoPhonePortrait className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-xl pl-12 pr-4 focus:border-brand dark:focus:border-indigo-500 focus:ring-1 focus:ring-brand dark:focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white text-sm"
                                placeholder="+36 30 123 4567"
                            />
                        </div>
                    </div>

                    {/* Stat fields */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">Hány napra jöttél?</label>
                            <select
                                value={stayDuration}
                                onChange={e => setStayDuration(e.target.value)}
                                className="w-full h-11 bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl px-3 outline-none text-xs text-gray-900 dark:text-white focus:border-brand dark:focus:border-indigo-500"
                            >
                                <option className="bg-white dark:bg-zinc-800" value="1">1 nap (átutazó)</option>
                                <option className="bg-white dark:bg-zinc-800" value="2-3">2-3 nap (hétvége)</option>
                                <option className="bg-white dark:bg-zinc-800" value="4-7">4-7 nap</option>
                                <option className="bg-white dark:bg-zinc-800" value="8+">Több mint egy hét</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">Utazási mód</label>
                            <select
                                value={travelMethod}
                                onChange={e => setTravelMethod(e.target.value)}
                                className="w-full h-11 bg-white/50 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-xl px-3 outline-none text-xs text-gray-900 dark:text-white focus:border-brand dark:focus:border-indigo-500"
                            >
                                <option className="bg-white dark:bg-zinc-800" value="auto">Autó</option>
                                <option className="bg-white dark:bg-zinc-800" value="vonat">Vonat / Busz</option>
                                <option className="bg-white dark:bg-zinc-800" value="kerekpar">Kerékpár</option>
                                <option className="bg-white dark:bg-zinc-800" value="egyeb">Egyéb</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full h-14 bg-brand dark:bg-indigo-500 hover:opacity-90 active:scale-95 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 pt-1 mt-4"
                    >
                        <span>Tovább a vásárláshoz</span>
                        <IoArrowForward size={18} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
