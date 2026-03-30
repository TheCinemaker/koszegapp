import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCalendar, IoTime, IoCheckmark, IoArrowForward } from 'react-icons/io5';
import { format, addDays, startOfToday, addMinutes, isAfter, isBefore, set, isSameDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function BookingModal({ isOpen, onClose, provider }) {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [cancellingSlot, setCancellingSlot] = useState(null);
    const [cancelNotes, setCancelNotes] = useState('');

    useEffect(() => {
        if (isOpen && provider) {
            fetchSlots(selectedDate);

            // Realtime subscription to update slots immediately if Provider deletes/adds booking
            const subscription = supabase
                .channel(`booking-modal-${provider.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bookings',
                        filter: `provider_id=eq.${provider.id}`
                    },
                    (payload) => {
                        console.log("Slot update detected:", payload);
                        fetchSlots(selectedDate);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [isOpen, provider, selectedDate, user]);

    const fetchSlots = async (date) => {
        setLoading(true);
        setAvailableSlots([]);

        try {
            // 1. Fetch fresh Provider settings (to avoid stale props)
            const { data: latestProvider } = await supabase
                .from('providers')
                .select('schedule_settings, opening_start, opening_end, slot_duration_min')
                .eq('id', provider.id)
                .single();

            const liveProvider = latestProvider || provider;
            const schedule = liveProvider.schedule_settings || {};

            const dayOfWeek = selectedDate.getDay().toString(); // 0 = Sunday, 1 = Monday
            const dayConfig = schedule[dayOfWeek];

            // If no config or closed, return empty
            if (!dayConfig || !dayConfig.active) {
                setAvailableSlots([]);
                setLoading(false);
                return;
            }

            const startStr = dayConfig.start || liveProvider.opening_start || '09:00';
            const endStr = dayConfig.end || liveProvider.opening_end || '17:00';
            const duration = liveProvider.slot_duration_min || 30;

            const [startHour, startMin] = startStr.split(':').map(Number);
            const [endHour, endMin] = endStr.split(':').map(Number);

            const dayStart = set(date, { hours: startHour, minutes: startMin, seconds: 0 });
            const dayEnd = set(date, { hours: endHour, minutes: endMin, seconds: 0 });

            // Lunch setup
            let lunchStart = null;
            let lunchEnd = null;
            if (dayConfig.hasLunch) {
                const lStartStr = dayConfig.lunchStart || "12:00";
                const lEndStr = dayConfig.lunchEnd || "12:30";

                const [lStartH, lStartM] = lStartStr.split(':').map(Number);
                const [lEndH, lEndM] = lEndStr.split(':').map(Number);

                lunchStart = set(date, { hours: lStartH, minutes: lStartM, seconds: 0 });
                lunchEnd = set(date, { hours: lEndH, minutes: lEndM, seconds: 0 });
            }

            // 2. Fetch existing bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id, start_time, end_time, client_id, type') // Added id and type
                .eq('provider_id', provider.id)
                .neq('status', 'cancelled')
                .lt('start_time', dayEnd.toISOString())
                .gt('end_time', dayStart.toISOString());

            // 3. Generate slots
            const slots = [];
            let current = dayStart;
            const now = new Date();

            while (isBefore(current, dayEnd)) {
                const slotEnd = addMinutes(current, duration);

                // Stop if slot goes beyond closing time
                if (isAfter(slotEnd, dayEnd)) break;

                // Check past
                if (isBefore(current, now)) {
                    current = addMinutes(current, duration);
                    continue;
                }

                // Check Lunch Collision
                if (lunchStart && lunchEnd) {
                    // Overlap check: (StartA < EndB) and (EndA > StartB)
                    if (current < lunchEnd && slotEnd > lunchStart) {
                        current = addMinutes(current, duration);
                        continue; // Skip this slot
                    }
                }

                // Check Booking Collision
                const booking = bookings?.find(b => {
                    const bStart = new Date(b.start_time);
                    const bEnd = new Date(b.end_time);
                    return (current < bEnd && slotEnd > bStart);
                });

                let status = 'available';
                let currentBookingId = null;
                if (booking) {
                    if (user && booking.client_id === user.id) {
                        status = 'own';
                        currentBookingId = booking.id;
                    } else if (booking.type === 'blocked') {
                        status = 'booked'; // Treat blocked as booked
                    } else {
                        status = 'booked';
                    }
                }

                slots.push({
                    date: new Date(current),
                    status: status,
                    bookingId: currentBookingId
                });

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

    const handleCancelBooking = async () => {
        if (!cancellingSlot) return;
        
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled', notes: cancelNotes ? `[Lemondva]: ${cancelNotes} ${notes}` : undefined })
                .eq('id', cancellingSlot.bookingId)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("A lemondás nem sikerült, valószínűleg nincs rá jogosultságod (RLS)!");
            
            toast.success('Foglalás sikeresen lemondva! ✨');
            fetchSlots(selectedDate);
            if (selectedSlot && selectedSlot.bookingId === cancellingSlot.bookingId) {
                setSelectedSlot(null);
            }
            setCancellingSlot(null);
            setCancelNotes('');
        } catch (err) {
            console.error(err);
            toast.error("Hiba a lemondás során: " + err.message);
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
            const endTime = addMinutes(selectedSlot.date, provider.slot_duration_min || 30);

            const clientName = user?.user_metadata?.full_name || 'Névtelen';
            const { error } = await supabase.from('bookings').insert({
                provider_id: provider.id,
                client_id: user.id, // Authenticated user
                start_time: selectedSlot.date.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                notes: `[Foglaló: ${clientName}] ${notes}` // Use the state variable
            });

            if (error) throw error;

            toast.success('Foglalás sikeresen rögzítve! 🎉');
            // Refresh slots to show the new status immediately
            // Instead of closing, we might want to let them see it became Yellow
            fetchSlots(selectedDate);
            setSelectedSlot(null);
            setNotes(''); // Clear notes

        } catch (err) {
            console.error(err);
            toast.error("Hiba a foglalás során: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
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
                    h-[93vh] max-h-[93vh] flex flex-col
                "
            >
                {/* Header with Provider Info */}
                <div className="relative p-5 bg-white dark:bg-zinc-800 z-10 shadow-sm shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 text-white font-black">
                            {provider.business_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-[8px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-300">
                                    {provider.category}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{provider.business_name}</h2>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-700/50 rounded-full hover:bg-zinc-200 transition-colors">
                        <IoClose className="text-lg text-zinc-500" />
                    </button>
                </div>

                {/* Date Selection Strip */}
                <div className="relative p-3 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md shrink-0 border-b border-zinc-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1 relative">
                        
                        {/* Fix Naptár választó ikon */}
                        <div className="sticky left-0 z-10 shrink-0">
                            <label className="flex flex-col items-center justify-center min-w-[3.5rem] py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl cursor-pointer shadow-sm border border-indigo-200 dark:border-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
                                <IoCalendar className="text-xl mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-tighter">Választ</span>
                                <input 
                                    type="date" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    min={format(startOfToday(), 'yyyy-MM-dd')}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            setSelectedDate(newDate);
                                            setSelectedSlot(null);
                                        }
                                    }}
                                />
                            </label>
                            {/* Fade Edge */}
                            <div className="absolute top-0 -right-4 w-4 h-full bg-gradient-to-r from-white/90 dark:from-zinc-900/90 to-transparent pointer-events-none" />
                        </div>

                        {(()=>{
                            // Generate 90 days ahead
                            let datesToShow = [...Array(90)].map((_, i) => addDays(startOfToday(), i));
                            
                            // If user picked a date beyond 90 days, prepend it so it's visible
                            if (!datesToShow.some(d => isSameDay(d, selectedDate)) && isAfter(selectedDate, startOfToday())) {
                                datesToShow = [selectedDate, ...datesToShow];
                            }

                            return datesToShow.map((date, i) => {
                                const isSelected = isSameDay(date, selectedDate);
                                const isToday = isSameDay(date, startOfToday());
                                
                                return (
                                    <motion.button
                                        key={i}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                        className={`
                                            flex-shrink-0 flex-1 min-w-[3.5rem] py-2 rounded-xl flex flex-col items-center justify-center transition-all duration-300
                                            ${isSelected
                                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 scale-105'
                                                : 'bg-white dark:bg-zinc-800/40 text-zinc-500 border border-zinc-200/50 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'}
                                        `}
                                    >
                                        <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5 ${isSelected ? 'opacity-70' : 'text-zinc-400'}`}>
                                            {format(date, 'MMM', { locale: hu })}
                                        </span>
                                        <span className="text-base font-black tracking-tight leading-none">{format(date, 'd')}</span>
                                        <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'opacity-70' : 'text-zinc-400'}`}>
                                            {isToday ? 'Ma' : format(date, 'EEE', { locale: hu })}
                                        </span>
                                    </motion.button>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="mb-4 flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Szabad időpontok</h3>
                        {availableSlots.length > 0 && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{availableSlots.length} elérhető</span>}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Időpontok keresése...</p>
                        </div>
                    ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {availableSlots.map((slot, i) => {
                                const isSelected = selectedSlot && slot.date.getTime() === selectedSlot.date.getTime();

                                let statusClasses = '';
                                if (slot.status === 'own') {
                                    statusClasses = 'bg-amber-500/10 text-amber-600 border border-amber-500/20 cursor-default';
                                } else if (slot.status === 'booked') {
                                    statusClasses = 'bg-red-50 dark:bg-red-500/5 text-red-400 dark:text-red-500/50 border border-red-200 dark:border-red-500/20 opacity-60 cursor-not-allowed';
                                } else {
                                    // Available
                                    statusClasses = isSelected
                                        ? 'bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black shadow-lg shadow-black/10 ring-4 ring-zinc-900/10 dark:ring-white/10'
                                        : 'bg-green-50/50 dark:bg-green-500/5 border border-green-300/50 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/10';
                                }

                                return (
                                    <motion.button
                                        key={i}
                                        whileHover={slot.status === 'available' ? { scale: 1.02, y: -2 } : {}}
                                        whileTap={slot.status === 'available' ? { scale: 0.98 } : {}}
                                        onClick={() => {
                                            if (slot.status === 'available') setSelectedSlot(slot);
                                            else if (slot.status === 'own') setCancellingSlot(slot);
                                        }}
                                        disabled={slot.status === 'booked'}
                                        className={`
                                            relative py-4 rounded-2xl text-xs font-black border transition-all duration-200
                                            ${statusClasses}
                                            flex flex-col items-center justify-center gap-0.5
                                        `}
                                    >
                                        {format(slot.date, 'HH:mm')}
                                        {slot.status === 'own' && <span className="text-[8px] uppercase tracking-tighter">Sajátod</span>}
                                        {isSelected && <motion.div layoutId="slot-check" className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border-2 border-white dark:border-zinc-900"><IoCheckmark /></motion.div>}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                            <div className="text-4xl mb-4 opacity-20 filter grayscale">📅</div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Nincs szabad időpont</h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">Sajnos erre a napra minden hely elkelt, vagy a szolgáltató nem fogad vendégeket.</p>
                        </div>
                    )}
                </div>
                {/* Notes Input */}
                <div className="px-5 py-2 shrink-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-2 mb-1 block">
                        Megjegyzés
                    </label>
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pl. Hosszú hajam van..."
                        className="
                            w-full h-11 px-4 resize-none
                            bg-[#f2f2f7] dark:bg-black/30 
                            border-0 rounded-2xl
                            text-sm font-medium text-zinc-900 dark:text-white 
                            placeholder-zinc-400 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                            shadow-inner
                        "
                    />
                </div>

                {/* Footer Action */}
                <div className="p-5 bg-white dark:bg-zinc-800 border-t border-zinc-100 dark:border-white/5 shrink-0 safe-area-bottom">
                    {user ? (
                        <button
                            onClick={handleBook}
                            disabled={!selectedSlot || loading}
                            className="
                                w-full h-12 rounded-full 
                                bg-zinc-900 dark:bg-white 
                                text-white dark:text-black font-black text-xs uppercase tracking-widest
                                shadow-lg shadow-black/10 
                                flex items-center justify-center gap-2
                                disabled:opacity-50 disabled:grayscale transition-all
                                active:scale-95 hover:scale-[1.02]
                            "
                        >
                            {loading ? 'Folyamatban...' : 'Foglalás Véglegesítése'}
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Foglaláshoz bejelentkezés szükséges</span>
                            <button
                                onClick={() => {
                                    const redirectUri = encodeURIComponent(`/idopontfoglalas?openProvider=${provider.id}`);
                                    navigate(`/pass/register?redirectTo=${redirectUri}`);
                                }}
                                className="
                                    w-full h-12 rounded-full 
                                    bg-indigo-600 text-white 
                                    font-black text-xs uppercase tracking-widest
                                    shadow-lg flex items-center justify-center gap-2
                                    active:scale-95 hover:scale-[1.02] transition-transform
                                "
                            >
                                Belépés ITT <IoArrowForward className="text-lg" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Cancel Confirmation Overlay */}
                <AnimatePresence>
                    {cancellingSlot && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 bg-[#f2f2f7]/95 dark:bg-zinc-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                        >
                            <div className="bg-white dark:bg-zinc-800/80 p-6 rounded-[2rem] shadow-2xl w-full max-w-sm border border-zinc-200/50 dark:border-white/10 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400"></div>
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-red-100 dark:border-red-500/20">
                                    <IoClose />
                                </div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Lemondod az időpontot?</h3>
                                <p className="text-sm font-bold text-zinc-500 mb-6 bg-zinc-50 dark:bg-black/20 py-2 rounded-xl border border-zinc-100 dark:border-white/5">
                                    {format(cancellingSlot.date, 'yyyy. MMM d., HH:mm', { locale: hu })}
                                </p>
                                
                                <div className="text-left mb-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-2 mb-1 block">
                                        Megjegyzés (Opcionális)
                                    </label>
                                    <input
                                        type="text"
                                        value={cancelNotes}
                                        onChange={(e) => setCancelNotes(e.target.value)}
                                        placeholder="Pl. Közbejött valami..."
                                        className="
                                            w-full h-11 px-4 
                                            bg-[#f2f2f7] dark:bg-black/30 
                                            border-0 rounded-2xl
                                            text-sm font-medium text-zinc-900 dark:text-white 
                                            placeholder-zinc-400 
                                            focus:outline-none focus:ring-2 focus:ring-red-500/30
                                            shadow-inner transition-shadow
                                        "
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={loading}
                                        className="w-full h-12 rounded-[1.25rem] bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {loading ? 'Folyamatban...' : 'Igen, Lemondom'}
                                    </button>
                                    <button
                                        onClick={() => { setCancellingSlot(null); setCancelNotes(''); }}
                                        disabled={loading}
                                        className="w-full h-12 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-widest active:scale-95 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                                    >
                                        Mégsem
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>,
        document.body
    );
}

// Helper icon
function IoCacheOutline(props) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M448 360a48 48 0 11-48-48 48.05 48.05 0 0148 48zM110 360a48 48 0 11-48-48 48.05 48.05 0 0148 48zM432 264V127a32.09 32.09 0 00-32-32H112a32.09 32.09 0 00-32 32v137M399.16 360H112.84M256 95V48M256 360v-48" strokeLinecap="round" strokeLinejoin="round"></path></svg>
}
