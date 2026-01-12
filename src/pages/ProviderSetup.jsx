
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { IoStorefront, IoTime, IoCall, IoMap, IoCheckmark } from 'react-icons/io5';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇' },
    { id: 'kormos', label: 'Körmös', icon: '💅' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨' },
];

export default function ProviderSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('Kőszeg, ');
    const [description, setDescription] = useState('');

    const [slotDuration, setSlotDuration] = useState(30);
    const [openStart, setOpenStart] = useState('09:00');
    const [openEnd, setOpenEnd] = useState('17:00');

    // Initial fetch to pre-fill if data exists
    useEffect(() => {
        if (user) {
            checkExisting();
        }
    }, [user]);

    const checkExisting = async () => {
        // Use maybeSingle to avoid 406 error if row missing
        const { data } = await supabase.from('providers').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
            setBusinessName(data.business_name);
            setCategory(data.category);
            setAddress(data.location_address);
            setDescription(data.description);
            if (data.phone) setPhone(data.phone);
            if (data.slot_duration_min) setSlotDuration(data.slot_duration_min);
            if (data.opening_start) setOpenStart(data.opening_start);
            if (data.opening_end) setOpenEnd(data.opening_end);
        } else if (user?.user_metadata?.full_name) {
            setBusinessName(user.user_metadata.full_name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Upsert provider details
            const updates = {
                user_id: user.id,
                business_name: businessName,
                category,
                location_address: address,
                description: description || `A(z) ${businessName} hivatalos oldala.`,
                phone: phone,
                slot_duration_min: parseInt(slotDuration),
                opening_start: openStart,
                opening_end: openEnd,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('providers')
                .upsert(updates, { onConflict: 'user_id' });

            if (error) throw error;

            toast.success('Sikeres beállítás! Irány a pult! 🚀');
            navigate('/business', { replace: true });

        } catch (error) {
            console.error(error);
            toast.error('Hiba a mentéskor: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl shadow-lg shadow-purple-500/30">
                        🛍️
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Szalon Beállítása</h1>
                    <p className="text-zinc-500">Add meg a vállalkozásod adatait és nyitvatartását.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cégnév / Szalon neve</label>
                            <div className="relative">
                                <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Kategória</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium appearance-none"
                                required
                            >
                                <option value="">Válassz...</option>
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cím</label>
                            <div className="relative">
                                <IoMap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Telefon</label>
                            <div className="relative">
                                <IoCall className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="tel"
                                    placeholder="+36 30 ..."
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* TIME SETTINGS */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <IoTime className="text-purple-500" /> Időpontok és Nyitvatartás
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Időpont hossza (perc)</label>
                                <select
                                    value={slotDuration}
                                    onChange={e => setSlotDuration(e.target.value)}
                                    className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                >
                                    <option value="15">15 perc</option>
                                    <option value="30">30 perc (Normál)</option>
                                    <option value="45">45 perc</option>
                                    <option value="60">60 perc (1 óra)</option>
                                    <option value="90">90 perc</option>
                                    <option value="120">120 perc</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Nyitás</label>
                                <input
                                    type="time"
                                    value={openStart}
                                    onChange={e => setOpenStart(e.target.value)}
                                    className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Zárás</label>
                                <input
                                    type="time"
                                    value={openEnd}
                                    onChange={e => setOpenEnd(e.target.value)}
                                    className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Rövid leírás</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full h-24 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium resize-none"
                            placeholder="Írj pár szót a szolgáltatásaidról..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {loading ? 'Mentés...' : <><IoCheckmark className="text-xl" /> Mentés és Tovább</>}
                    </button>

                </form>
            </motion.div>
        </div>
    );
}
