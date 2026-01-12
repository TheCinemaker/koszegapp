
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { format, startOfToday, addDays, isSameDay, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCalendar, IoTime, IoPerson, IoAdd, IoLogOut, IoPencil, IoTrash } from 'react-icons/io5';

import toast from 'react-hot-toast';

export default function BusinessDashboard() {
    const { user, logout } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [manualName, setManualName] = useState('');
    const [manualTime, setManualTime] = useState('12:00');
    const [manualNotes, setManualNotes] = useState('');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [providerProfile, setProviderProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [viewDate, setViewDate] = useState(startOfToday());
    const datePickerRef = React.useRef(null);

    const handleDateChange = (e) => {
        const newDate = parseISO(e.target.value);
        if (!isNaN(newDate)) {
            setSelectedDate(newDate);
            setViewDate(newDate);
        }
    };

    const jumpToToday = () => {
        const today = startOfToday();
        setSelectedDate(today);
        setViewDate(today);
    };

    useEffect(() => {
        if (user) fetchProviderData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    const fetchProviderData = async () => {
        try {
            // 1. Get Provider Details
            const { data: provider, error: prodError } = await supabase
                .from('providers')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (prodError) throw prodError;

            if (!provider) {
                // User is logged in but not a provider yet
                setLoading(false);
                return;
            }

            setProviderProfile(provider);

            // 2. Subscribe to Realtime Bookings for this provider
            const subscription = supabase
                .channel('public:bookings')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `provider_id=eq.${provider.id}` }, (payload) => {
                    console.log('Realtime update:', payload);
                    fetchBookings(provider.id); // Refresh on change
                })
                .subscribe();

            // 3. Initial Fetch
            await fetchBookings(provider.id);

            return () => {
                supabase.removeChannel(subscription);
            };

        } catch (error) {
            console.error('Error fetching business data:', error);
            toast.error('Hiba az adatok betöltésekor.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async (providerId) => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, services(name, duration_min), profiles(full_name, phone, nickname)') // Fetch connected client profile
            .eq('provider_id', providerId)
            .gte('start_time', startOfToday().toISOString()) // Only future/today
            .order('start_time', { ascending: true });

        if (error) console.error(error);
        else setBookings(data || []);
    };

    const openModal = (booking = null) => {
        if (booking) {
            setEditingBooking(booking);
            setManualName(booking.manual_client_name || booking.profiles?.full_name || '');
            setManualNotes(booking.notes || '');
            setManualTime(format(parseISO(booking.start_time), 'HH:mm'));
        } else {
            setEditingBooking(null);
            setManualName('');
            setManualNotes('');
            setManualTime('12:00');
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a foglalást?')) return;

        try {
            const { error } = await supabase.from('bookings').delete().eq('id', id);
            if (error) throw error;
            toast.success('Foglalás törölve!');
            fetchBookings(providerProfile.id);
        } catch (error) {
            console.error(error);
            toast.error('Hiba a törléskor.');
        }
    };

    const handleManualBooking = async (e) => {
        e.preventDefault();
        try {
            // Construct timestamp from selectedDate + manualTime
            const [hours, minutes] = manualTime.split(':');
            const startTime = new Date(selectedDate);
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const bookingData = {
                provider_id: providerProfile.id,
                client_id: null,
                manual_client_name: manualName,
                start_time: startTime.toISOString(),
                end_time: new Date(startTime.getTime() + (providerProfile.slot_duration_min || 30) * 60000).toISOString(),
                status: 'confirmed',
                notes: manualNotes
            };

            let error;
            if (editingBooking) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update(bookingData)
                    .eq('id', editingBooking.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('bookings')
                    .insert(bookingData);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingBooking ? 'Foglalás módosítva!' : 'Foglalás rögzítve!');
            setShowModal(false);
            setManualName('');
            setManualNotes('');
            setEditingBooking(null);

            // Immediate refresh for the user
            fetchBookings(providerProfile.id);
        } catch (error) {
            console.error("Booking error:", error);
            toast.error('Hiba a mentéskor: ' + error.message);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center p-6 text-zinc-500">Betöltés...</div>;

    if (!providerProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Üdvözöllek, {user?.user_metadata?.full_name || 'Partner'}! 👋</h1>
                <p className="max-w-md text-zinc-500 mb-8">Már majdnem kész vagy! A vállalkozói profilod létrehozásához kattints az alábbi gombra.</p>
                <div className="flex flex-col gap-3">
                    <a href="/provider-setup" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                        Vállalkozás Beállítása 🚀
                    </a>
                    <button onClick={handleLogout} className="text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-200">Kijelentkezés</button>
                </div>
            </div>
        );
    }

    // Group bookings by date is tricky in list view, let's just show Today + Upcoming for now
    const todayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), selectedDate));

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 pb-24 relative">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{providerProfile?.business_name}</h1>
                        <p className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Élő Foglalási Rendszer
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={jumpToToday} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors">
                            Ma
                        </button>
                        <div className="relative">
                            <button onClick={() => datePickerRef.current?.showPicker()} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors">
                                <IoCalendar className="text-xl text-zinc-600 dark:text-zinc-300" />
                            </button>
                            <input
                                type="date"
                                ref={datePickerRef}
                                onChange={handleDateChange}
                                className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                            />
                        </div>
                        <button onClick={handleLogout} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors">
                            <IoLogOut className="text-xl text-zinc-600 dark:text-zinc-300" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">

                {/* Date Selector (Scrollable Strip) */}
                <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                    {[...Array(14)].map((_, i) => {
                        const date = addDays(viewDate, i);
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center border transition-all ${isSelected
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                                    }`}
                            >
                                <span className="text-xs font-bold uppercase mb-1">{format(date, 'EEEE', { locale: hu })}</span>
                                <span className="text-2xl font-bold">{format(date, 'd')}</span>
                                <span className="text-[10px] uppercase font-bold text-zinc-400">{format(date, 'MMM', { locale: hu })}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Agenda View */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <IoCalendar className="text-blue-500" />
                    <span>{format(selectedDate, 'yyyy. MMMM d., EEEE', { locale: hu })}</span>
                    <span className="text-zinc-400 text-sm font-normal">({todayBookings.length} időpont)</span>
                </h2>

                <div className="space-y-3">
                    {todayBookings.length > 0 ? todayBookings.map(booking => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => openModal(booking)}
                            className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {/* Time Strip */}
                            <div className="w-16 flex flex-col items-center justify-center border-r border-zinc-100 dark:border-white/5 pr-4">
                                <span className="text-lg font-black text-zinc-900 dark:text-white">{format(parseISO(booking.start_time), 'HH:mm')}</span>
                                <span className="text-xs text-zinc-400 font-medium">{booking.services?.duration_min || providerProfile?.slot_duration_min || 30} perc</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">
                                    {booking.manual_client_name || booking.profiles?.nickname || booking.profiles?.full_name || 'Ismeretlen Vendég'}
                                </h3>
                                <p className="text-zinc-500 text-sm flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">{booking.services?.name || 'Kézi rögzítés'}</span>
                                    {booking.notes && <span>📝 {booking.notes}</span>}
                                </p>
                            </div>

                            {/* Status Indicator */}
                            <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${booking.status === 'confirmed' ? 'bg-green-500' : 'bg-zinc-300'
                                }`} />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModal(booking); }}
                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 active:scale-95 transition-transform"
                                    title="Szerkesztés"
                                >
                                    <IoPencil className="text-lg" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); }}
                                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:scale-110 active:scale-95 transition-transform"
                                    title="Törlés"
                                >
                                    <IoTrash className="text-lg" />
                                </button>
                            </div>

                        </motion.div>
                    )) : (
                        <div className="text-center py-12 bg-white/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-zinc-400 font-medium">Nincs foglalás erre a napra.</p>
                            <button onClick={() => openModal()} className="mt-4 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-full hover:scale-105 transition-transform">
                                + Kézi rögzítés
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Action FAB */}
            <button
                onClick={() => openModal()}
                className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 pointer-events-auto cursor-pointer"
            >
                <IoAdd className="text-3xl" />
            </button>

            {/* MANUAL BOOKING MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                    >
                        <h3 className="text-xl font-bold mb-4">{editingBooking ? 'Foglalás módosítása' : 'Új foglalás rögzítése'}</h3>
                        <form onSubmit={handleManualBooking} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Vendég neve</label>
                                <input
                                    type="text"
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                    placeholder="Pl. Kovács Anna"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Időpont</label>
                                <input
                                    type="time"
                                    value={manualTime}
                                    onChange={e => setManualTime(e.target.value)}
                                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Megjegyzés</label>
                                <input
                                    type="text"
                                    value={manualNotes}
                                    onChange={e => setManualNotes(e.target.value)}
                                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                    placeholder="Pl. melír, rövid haj..."
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-400">Mégse</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Mentés</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
