import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCalendar, IoTime, IoCheckmark } from 'react-icons/io5';
import { format, addDays, startOfToday, addMinutes, isAfter, isBefore, set } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function BookingModal({ isOpen, onClose, provider }) {
    const { user, login } = useAuth();
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);

    // Manual login state for checking
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    useEffect(() => {
        if (isOpen && provider) {
            fetchSlots(selectedDate);
            if (user?.user_metadata?.full_name) {
                setGuestName(user.user_metadata.full_name);
            }
        }
    }, [isOpen, provider, selectedDate, user]);

    const fetchSlots = async (date) => {
        setLoading(true);
        setAvailableSlots([]);

        try {
            // 1. Get Provider's constraints
            // Default to 9-17 if not set
            const startStr = provider.opening_start || '09:00';
            const endStr = provider.opening_end || '17:00';
            const duration = provider.slot_duration_min || 30;

            const [startHour, startMin] = startStr.split(':').map(Number);
            const [endHour, endMin] = endStr.split(':').map(Number);

            const dayStart = set(date, { hours: startHour, minutes: startMin, seconds: 0 });
            const dayEnd = set(date, { hours: endHour, minutes: endMin, seconds: 0 });

            // 2. Fetch existing bookings for this provider on this date
            const { data: bookings } = await supabase
                .from('bookings')
                .select('start_time, end_time')
                .eq('provider_id', provider.id)
                .gte('start_time', dayStart.toISOString())
                .lte('start_time', dayEnd.toISOString());

            // 3. Generate slots
            const slots = [];
            let current = dayStart;
            const now = new Date();

            while (isBefore(current, dayEnd)) {
                // Check if slot is in the past (for today)
                if (isBefore(current, now)) {
                    current = addMinutes(current, duration);
                    continue;
                }

                const slotEnd = addMinutes(current, duration);

                // Check collision
                const isTaken = bookings?.some(b => {
                    const bStart = new Date(b.start_time);
                    const bEnd = new Date(b.end_time);
                    // Simple overlap check
                    return (current < bEnd && slotEnd > bStart);
                });

                if (!isTaken) {
                    slots.push(new Date(current));
                }

                current = addMinutes(current, duration);
            }

            setAvailableSlots(slots);

        } catch (error) {
            console.error("Error fetching slots:", error);
            toast.error("Nem sikerült betölteni az időpontokat.");
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot) return;
        if (!user) {
            toast.error("Kérlek jelentkezz be a foglaláshoz!");
            // Optionally navigate('/auth');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Booking
            const endTime = addMinutes(selectedSlot, provider.slot_duration_min || 30);

            const { error } = await supabase.from('bookings').insert({
                provider_id: provider.id,
                client_id: user.id, // Authenticated user
                start_time: selectedSlot.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                notes: `Vendég: ${guestName || user.email}`
            });

            if (error) throw error;

            toast.success('Foglalás sikeresen rögzítve! 🎉');
            onClose();

        } catch (err) {
            console.error(err);
            toast.error("Hiba a foglalás során: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="
                    relative w-full max-w-lg 
                    bg-[#f2f2f7] dark:bg-zinc-900 
                    rounded-t-[2rem] sm:rounded-[2rem] 
                    shadow-2xl overflow-hidden 
                    pointer-events-auto
                    max-h-[90vh] flex flex-col
                "
            >
                {/* Header with Provider Info */}
                <div className="relative p-6 bg-white dark:bg-zinc-800 z-10 shadow-sm shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-700 rounded-full hover:bg-zinc-200 transition-colors">
                        <IoClose className="text-xl text-zinc-500" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 text-white">
                            {provider.category === 'fodraszat' ? '💇' : '✨'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                                    {provider.category}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{provider.business_name}</h2>
                            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                <IoCacheOutline className="inline" />
                                {provider.location_address || 'Kőszeg'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Selection Strip */}
                <div className="p-4 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md shrink-0 border-b border-zinc-200 dark:border-white/5">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {[...Array(14)].map((_, i) => {
                            const date = addDays(startOfToday(), i);
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <button
                                    key={i}
                                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                    className={`
                                        flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all
                                        ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg scale-105 border-transparent'
                                            : 'bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'}
                                    `}
                                >
                                    <span className="text-[10px] font-bold uppercase">{format(date, 'MMM', { locale: hu })}</span>
                                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                                    <span className="text-[10px] opacity-80">{format(date, 'EEE', { locale: hu })}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin w-8 h-8 set-zinc-400 border-2 border-zinc-300 border-t-blue-500 rounded-full" />
                        </div>
                    ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableSlots.map((slot, i) => {
                                const isSelected = selectedSlot && slot.getTime() === selectedSlot.getTime();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`
                                            py-3 rounded-xl text-sm font-bold border transition-all
                                            ${isSelected
                                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-300'}
                                        `}
                                    >
                                        {format(slot, 'HH:mm')}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-zinc-400">
                            <p>Nincs elérhető időpont erre a napra. 😔</p>
                            <p className="text-xs mt-1">Próbálj másik napot választani!</p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white dark:bg-zinc-800 border-t border-zinc-100 dark:border-white/5 shrink-0 safe-area-bottom">
                    <button
                        onClick={handleBook}
                        disabled={!selectedSlot || loading}
                        className="
                            w-full h-14 rounded-2xl 
                            bg-gradient-to-r from-blue-600 to-indigo-600 
                            text-white font-bold text-lg 
                            shadow-xl shadow-blue-500/30 
                            flex items-center justify-center gap-2
                            disabled:opacity-50 disabled:grayscale transition-all
                            active:scale-95
                        "
                    >
                        {loading ? 'Foglalás...' : (
                            <>
                                Foglalás Véglegesítése <IoCheckmark className="text-2xl" />
                            </>
                        )}
                    </button>
                    {!user && (
                        <p className="text-center text-xs text-red-500 mt-2 font-bold">
                            ⚠️ A foglaláshoz be kell jelentkezned!
                        </p>
                    )}
                </div>

            </motion.div>
        </div>
    );
}

// Helper icon
function IoCacheOutline(props) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M448 360a48 48 0 11-48-48 48.05 48.05 0 0148 48zM110 360a48 48 0 11-48-48 48.05 48.05 0 0148 48zM432 264V127a32.09 32.09 0 00-32-32H112a32.09 32.09 0 00-32 32v137M399.16 360H112.84M256 95V48M256 360v-48" strokeLinecap="round" strokeLinejoin="round"></path></svg>
}
