
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { format, startOfToday, addDays, isSameDay, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCalendar, IoTime, IoPerson, IoAdd, IoLogOut } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function BusinessDashboard() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [providerProfile, setProviderProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [selectedDate, setSelectedDate] = useState(startOfToday());

    useEffect(() => {
        if (user) fetchProviderData();
    }, [user]);

    const fetchProviderData = async () => {
        try {
            // 1. Get Provider Details
            const { data: provider, error: prodError } = await supabase
                .from('providers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (prodError && prodError.code !== 'PGRST116') throw prodError;

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

    if (loading) return <div className="min-h-screen flex items-center justify-center p-6 text-zinc-500">Betöltés...</div>;

    if (!providerProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Üdvözöllek, {user?.user_metadata?.full_name || 'Partner'}! 👋</h1>
                <p className="max-w-md text-zinc-500 mb-8">Úgy tűnik, még nincs létrehozva vállalkozói profilod. Kérlek vedd fel a kapcsolatot az adminisztrátorral, vagy aktiváld a fiókod.</p>
                <button onClick={logout} className="text-blue-600 font-bold hover:underline">Kijelentkezés</button>
            </div>
        );
    }

    // Group bookings by date is tricky in list view, let's just show Today + Upcoming for now
    const todayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), selectedDate));

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{providerProfile.business_name}</h1>
                        <p className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Élő Foglalási Rendszer
                        </p>
                    </div>
                    <button onClick={logout} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors">
                        <IoLogOut className="text-xl text-zinc-600 dark:text-zinc-300" />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">

                {/* Date Selector (Simple strips) */}
                <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                        const date = addDays(new Date(), i);
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all ${isSelected
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105'
                                        : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                                    }`}
                            >
                                <span className="text-xs font-bold uppercase">{format(date, 'MMM', { locale: hu })}</span>
                                <span className="text-xl font-bold">{format(date, 'd')}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Agenda View */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <IoCalendar className="text-blue-500" />
                    <span>{format(selectedDate, 'yyyy. MMMM d.', { locale: hu })}</span>
                    <span className="text-zinc-400 text-sm font-normal">({todayBookings.length} időpont)</span>
                </h2>

                <div className="space-y-3">
                    {todayBookings.length > 0 ? todayBookings.map(booking => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-4 relative overflow-hidden group"
                        >
                            {/* Time Strip */}
                            <div className="w-16 flex flex-col items-center justify-center border-r border-zinc-100 dark:border-white/5 pr-4">
                                <span className="text-lg font-black text-zinc-900 dark:text-white">{format(parseISO(booking.start_time), 'HH:mm')}</span>
                                <span className="text-xs text-zinc-400 font-medium">{booking.services?.duration_min} perc</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">
                                    {booking.manual_client_name || booking.profiles?.nickname || booking.profiles?.full_name || 'Ismeretlen Vendég'}
                                </h3>
                                <p className="text-zinc-500 text-sm flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">{booking.services?.name}</span>
                                    {booking.notes && <span>📝 {booking.notes}</span>}
                                </p>
                            </div>

                            {/* Status Indicator */}
                            <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${booking.status === 'confirmed' ? 'bg-green-500' : 'bg-zinc-300'
                                }`} />

                        </motion.div>
                    )) : (
                        <div className="text-center py-12 bg-white/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-zinc-400 font-medium">Nincs foglalás erre a napra.</p>
                            <button className="mt-4 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-full">
                                + Kézi rögzítés
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Action FAB */}
            <button className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50">
                <IoAdd className="text-3xl" />
            </button>
        </div>
    );
}
