import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfToday, addDays, isSameDay, parseISO, addMinutes } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCalendar, IoTime, IoPerson, IoAdd, IoLogOut, IoPencil, IoTrash, IoMail, IoSettings, IoPause, IoBriefcase } from 'react-icons/io5';
import toast from 'react-hot-toast';
import NewBookingNotification from '../components/NewBookingNotification';
import MessageModal from '../components/MessageModal';
import ScheduleSettingsModal from '../components/ScheduleSettingsModal';

export default function BusinessDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [providerProfile, setProviderProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [viewDate, setViewDate] = useState(startOfToday());
    const [notificationQueue, setNotificationQueue] = useState([]); // Notification Bundle

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [manualName, setManualName] = useState('');
    const [manualTime, setManualTime] = useState('12:00');
    const [manualEndTime, setManualEndTime] = useState('12:30');
    const [manualEndDate, setManualEndDate] = useState(null); // New State for multi-day
    const [manualNotes, setManualNotes] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);

    // Redirect if Pending
    useEffect(() => {
        if (!loading && user?.providerStatus === 'pending') {
            navigate('/business/setup', { replace: true });
        }
    }, [user, loading, navigate]);

    const fetchData = async () => {
        try {
            const { data: profile } = await supabase.from('providers').select('*').eq('user_id', user.id).single();
            if (profile) {
                setProviderProfile(profile);
                fetchBookings(profile.id);
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchBookings = async (providerId) => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, services(name, duration_min), profiles(full_name, phone, nickname)')
                .eq('provider_id', providerId)
                .neq('status', 'cancelled')
                .order('start_time', { ascending: true });

            if (error) throw error;
            setBookings(data || []);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            toast.error("Hiba a foglalások betöltésekor");
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        if (!user) return;
        fetchData();

        // Subscription for real-time updates
        const subscription = supabase
            .channel('public:bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                if (payload.new && payload.new.provider_id === user.id) {
                    // If it's a NEW booking (INSERT), add to notification queue
                    if (payload.eventType === 'INSERT' && payload.new.type !== 'blocked') {
                        fetchData(); // Refresh calendar
                        setNotificationQueue(prev => [...prev, payload.new]); // Add to queue
                    } else {
                        fetchData(); // Just refresh for updates/deletes
                    }
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);
    const openModal = (booking = null) => {
        if (booking) {
            setEditingBooking(booking);
            setManualName(booking.manual_client_name || booking.profiles?.full_name || '');
            setManualNotes(booking.notes || '');
            setManualTime(format(parseISO(booking.start_time), 'HH:mm'));
            setManualEndTime(format(parseISO(booking.end_time), 'HH:mm'));
            // Set End Date if multi-day or just for safety
            setManualEndDate(format(parseISO(booking.end_time), 'yyyy-MM-dd'));
            setIsBlocked(booking.type === 'blocked');
        } else {
            setEditingBooking(null);
            setManualName('');
            setManualNotes('');
            const now = new Date();
            now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
            const startStr = format(now, 'HH:mm');
            setManualTime(startStr);
            // Default end time: +30 mins
            const end = addMinutes(now, providerProfile?.slot_duration_min || 30);
            setManualEndTime(format(end, 'HH:mm'));
            setManualEndDate(null); // Reset end date
            setIsBlocked(false);
        }
        setShowModal(true);
    };

    // ... (keep existing code)

    const handleManualBooking = async (e) => {
        e.preventDefault();
        try {
            const [hours, minutes] = manualTime.split(':');
            const startTime = new Date(selectedDate);
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            let endTime;

            // Determine End Date base
            let baseEndDate = selectedDate;
            if (manualEndDate) {
                baseEndDate = parseISO(manualEndDate);
            }

            if (manualEndTime) {
                const [endH, endM] = manualEndTime.split(':');
                endTime = new Date(baseEndDate);
                endTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

                // If user set end date same as start, check time
                if (isSameDay(startTime, endTime) && endTime <= startTime) {
                    // Auto-correct for same day error
                    endTime = new Date(startTime.getTime() + (providerProfile.slot_duration_min || 30) * 60000);
                }
            } else {
                endTime = new Date(startTime.getTime() + (providerProfile.slot_duration_min || 30) * 60000);
            }

            const bookingData = {
                provider_id: providerProfile.id,
                client_id: null,
                manual_client_name: isBlocked ? 'SZÜNET' : manualName,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                notes: manualNotes,
                type: isBlocked ? 'blocked' : 'appointment'
            };

            // Simplified collision check for manual override
            let collisionQuery = supabase
                .from('bookings')
                .select('id, start_time, end_time')
                .eq('provider_id', providerProfile.id)
                .lt('start_time', bookingData.end_time)
                .gt('end_time', bookingData.start_time);

            if (editingBooking) {
                collisionQuery = collisionQuery.neq('id', editingBooking.id);
            }

            const { data: collisions, error: checkError } = await collisionQuery;

            if (collisions && collisions.length > 0) {
                if (!window.confirm(`⚠️ FIGYELEM!\n\nEz az időpont ütközik ${collisions.length} másik foglalással!\n\nBiztosan rögzíteni szeretnéd így is?`)) {
                    return;
                }
            }

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

            toast.success(isBlocked ? 'Időszak blokkolva!' : (editingBooking ? 'Foglalás módosítva!' : 'Foglalás rögzítve!'));
            setShowModal(false);

            // Reset form
            setManualName('');
            setManualNotes('');
            setEditingBooking(null);
            setIsBlocked(false);
            setManualEndTime(null);
            setManualEndDate(null);

            fetchBookings(providerProfile.id);
        } catch (error) {
            console.error("Booking error:", error);
            toast.error('Hiba a mentéskor: ' + error.message);
        }
    };

    // ... (JSX render) ...

    <div className="flex gap-3">
        <div className="flex-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Kezdési Idő</label>
            <input
                type="time"
                value={manualTime}
                onChange={e => {
                    setManualTime(e.target.value);
                    // Auto-update end time if needed, logic optional
                }}
                className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                required
            />
        </div>
        <div className="flex-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Vége</label>
            <input
                type="time"
                value={manualEndTime}
                onChange={e => setManualEndTime(e.target.value)}
                className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                required
            />
        </div>
    </div>

    // Message Modal State
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageRecipient, setMessageRecipient] = useState(null);

    // Schedule Settings Modal State
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const datePickerRef = React.useRef(null);

    // Initial Data Load
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const { data: provider, error } = await supabase
                    .from('providers')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                if (provider) {
                    setProviderProfile(provider);
                    fetchBookings(provider.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading provider:", err);
                toast.error("Hiba a betöltéskor");
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Keep bookings ref updated to avoid stale closures in subscription
    const bookingsRef = React.useRef(bookings);
    useEffect(() => {
        bookingsRef.current = bookings;
    }, [bookings]);

    // Separate effect for Realtime Subscription
    useEffect(() => {
        if (!providerProfile) return;

        const channel = supabase
            .channel(`bookings:provider:${providerProfile.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                    // Removing server-side filter to ensure we catch DELETEs where provider_id might be missing
                    // We will filter client-side instead
                },
                (payload) => {
                    // Update Calendar regardless of event type
                    // Ideally we should verify if it affects us, but fetching safe-guards that
                    fetchBookings(providerProfile.id);

                    // If it's a NEW booking (INSERT)
                    if (payload.eventType === 'INSERT') {
                        if (payload.new.provider_id === providerProfile.id) {
                            console.log("New booking incoming!", payload.new);
                            fetchNewBookingDetails(payload.new.id, 'booking');
                        }
                    }

                    // If it's a CANCELLATION via UPDATE (Soft Delete)
                    if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled') {
                        console.log("Booking cancelled (Soft UPDATE)!", payload.new);
                        fetchNewBookingDetails(payload.new.id, 'cancelled');
                    }

                    // If it's a CANCELLATION (DELETE)
                    if (payload.eventType === 'DELETE') {
                        console.log("Booking deleted!", payload.old);
                        // Check if the deleted ID belongs to one of OUR current bookings
                        const deletedBooking = bookingsRef.current.find(b => b.id === payload.old.id);

                        if (deletedBooking) {
                            console.log("Found deleted booking in local state:", deletedBooking);
                            // We have the full data locally! Use it directly.
                            setNotificationQueue(prev => [...prev, { ...deletedBooking, type: 'cancelled' }]);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [providerProfile]);

    const handleNotificationClose = async (notification) => {
        setNotificationQueue(prev => prev.slice(1));

        // If it was a cancellation notification, perform the HARD DELETE from DB now
        // This ensures "No Trace" but only after the provider has been notified.
        if (notification.type === 'cancelled') {
            try {
                await supabase.from('bookings').delete().eq('id', notification.id);
                console.log("Performed deferred hard delete for:", notification.id);
            } catch (err) {
                console.error("Error performing deferred hard delete:", err);
            }
        }
    };

    const fetchNewBookingDetails = async (bookingId, type = 'booking') => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, services(name, duration_min), profiles(full_name, phone, nickname)')
                .eq('id', bookingId)
                .single();

            if (error) throw error;
            if (data) {
                setNotificationQueue(prev => [...prev, { ...data, type }]);
            }
        } catch (err) {
            console.error("Error fetching new booking details:", err);
        }
    };

    const fetchDeletedBookingDetails = async (oldBooking) => {
        try {
            // Reconstruct booking object from old payload + fetching relations
            let clientName = 'Ismeretlen Vendég';
            let serviceName = 'Törölt szolgáltatás';
            let phone = '';

            // 1. Fetch Client Profile if exists
            if (oldBooking.client_id) {
                const { data: profile } = await supabase.from('profiles').select('full_name, nickname, phone').eq('id', oldBooking.client_id).single();
                if (profile) {
                    clientName = profile.full_name || profile.nickname;
                    phone = profile.phone;
                }
            } else if (oldBooking.manual_client_name) {
                clientName = oldBooking.manual_client_name;
            }

            // 2. Fetch Service if exists
            if (oldBooking.service_id) {
                const { data: service } = await supabase.from('services').select('name').eq('id', oldBooking.service_id).single();
                if (service) serviceName = service.name;
            }

            const reconstructedBooking = {
                ...oldBooking,
                profiles: { full_name: clientName, phone },
                services: { name: serviceName, duration_min: 0 }, // Duration might be lost if not in payload, but acceptable
                type: 'cancelled'
            };

            setNotificationQueue(prev => [...prev, reconstructedBooking]);

        } catch (err) {
            console.error("Error fetching deleted details:", err);
        }
    };



    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

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



    const openMessageModal = (booking) => {
        if (!booking.client_id) return;
        setMessageRecipient({
            id: booking.client_id,
            name: booking.profiles?.nickname || booking.profiles?.full_name || 'Vendég',
            bookingId: booking.id
        });
        setShowMessageModal(true);
    };

    const [deletingBookingId, setDeletingBookingId] = useState(null);

    const handleDelete = (id) => {
        setDeletingBookingId(id);
    };

    const confirmDelete = async () => {
        if (!deletingBookingId) return;
        try {
            const { error } = await supabase.from('bookings').delete().eq('id', deletingBookingId);
            if (error) throw error;
            toast.success('Foglalás törölve!');
            fetchBookings(providerProfile.id);
        } catch (error) {
            console.error(error);
            toast.error('Hiba a törléskor.');
        } finally {
            setDeletingBookingId(null);
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

    const todayBookings = bookings.filter(b => {
        const bStart = parseISO(b.start_time);
        const bEnd = parseISO(b.end_time);
        const dayStart = selectedDate; // 00:00
        const dayEnd = addDays(selectedDate, 1); // Next day 00:00

        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return bStart < dayEnd && bEnd > dayStart;
    });

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
                        <button onClick={() => setShowScheduleModal(true)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors" title="Munkarend Beállítása">
                            <IoSettings className="text-xl text-zinc-600 dark:text-zinc-300" />
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
                {/* Date Selector */}
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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <IoCalendar className="text-blue-500" />
                        <span>{format(selectedDate, 'yyyy. MMMM d., EEEE', { locale: hu })}</span>
                        <span className="text-zinc-400 text-sm font-normal">({todayBookings.length} időpont)</span>
                    </h2>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <IoAdd className="text-lg" />
                        <span className="hidden sm:inline">Új foglalás</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {todayBookings.length > 0 ? todayBookings.map(booking => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                rounded-2xl p-4 border shadow-sm flex items-center gap-4 relative overflow-hidden group transition-colors
                                ${booking.type === 'blocked'
                                    ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 opacity-80'
                                    : 'bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800'}
                            `}
                        >
                            <div className="w-16 flex flex-col items-center justify-center border-r border-zinc-100 dark:border-white/5 pr-4">
                                <span className="text-lg font-black text-zinc-900 dark:text-white">{format(parseISO(booking.start_time), 'HH:mm')}</span>
                                {/* For multi-day, maybe show date? simplified for now */}
                                {!isSameDay(parseISO(booking.start_time), parseISO(booking.end_time)) && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Több napos</span>
                                )}
                                <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                                    {booking.type === 'blocked' && !isSameDay(parseISO(booking.start_time), parseISO(booking.end_time))
                                        ? `${format(parseISO(booking.end_time), 'MM.dd.')}-ig`
                                        : `${booking.services?.duration_min || providerProfile?.slot_duration_min || 30} p`}
                                </span>
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-bold text-lg mb-1 ${booking.type === 'blocked' ? 'text-zinc-500 italic' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {booking.type === 'blocked' ? 'SZÜNET / BLOKKOLVA' : (booking.manual_client_name || booking.profiles?.nickname || booking.profiles?.full_name || 'Ismeretlen Vendég')}
                                </h3>
                                <p className="text-zinc-500 text-sm flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                                        {booking.type === 'blocked' ? 'Blokkolva' : (booking.services?.name || 'Kézi rögzítés')}
                                    </span>
                                    {booking.notes && <span>📝 {booking.notes}</span>}
                                </p>
                            </div>

                            <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${booking.type === 'blocked' ? 'bg-zinc-400 pattern-diagonal-stripes' :
                                (booking.status === 'confirmed' ? 'bg-green-500' : 'bg-zinc-300')
                                }`} />

                            <div className="flex items-center gap-2">
                                {booking.client_id && booking.type !== 'blocked' && (
                                    <button
                                        onClick={() => openMessageModal(booking)}
                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 active:scale-95 transition-transform"
                                        title="Üzenet küldése"
                                    >
                                        <IoMail className="text-lg" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(booking.id)}
                                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:scale-110 active:scale-95 transition-transform"
                                    title="Lemondás"
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

            <button
                onClick={() => openModal()}
                className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 pointer-events-auto cursor-pointer"
            >
                <IoAdd className="text-3xl" />
            </button>

            {/* Manual Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                    >
                        <h3 className="text-xl font-bold mb-4">{editingBooking ? 'Módosítás' : 'Új bejegyzés'}</h3>
                        <form onSubmit={handleManualBooking} className="space-y-4">

                            {/* Toggle Blocked */}
                            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <IoPause className={`text-xl ${isBlocked ? 'text-orange-500' : 'text-zinc-400'}`} />
                                    <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Szünet / Blokkolás</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isBlocked} onChange={(e) => setIsBlocked(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {!isBlocked && (
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Vendég neve</label>
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={e => setManualName(e.target.value)}
                                        className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                        placeholder="Pl. Kovács Anna"
                                        required={!isBlocked}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Kezdési Idő</label>
                                    {isBlocked && (
                                        <input
                                            type="date"
                                            value={format(selectedDate, 'yyyy-MM-dd')}
                                            disabled
                                            className="w-full h-8 mb-1 px-2 text-xs bg-transparent border-0 text-zinc-500"
                                        />
                                    )}
                                    <input
                                        type="time"
                                        value={manualTime}
                                        onChange={e => setManualTime(e.target.value)}
                                        className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Vége</label>
                                    {isBlocked && (
                                        <input
                                            type="date"
                                            value={manualEndDate ? manualEndDate : format(selectedDate, 'yyyy-MM-dd')}
                                            onChange={e => setManualEndDate(e.target.value)}
                                            className="w-full h-8 mb-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                                        />
                                    )}
                                    <input
                                        type="time"
                                        value={manualEndTime}
                                        onChange={e => setManualEndTime(e.target.value)}
                                        className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Megjegyzés</label>
                                <input
                                    type="text"
                                    value={manualNotes}
                                    onChange={e => setManualNotes(e.target.value)}
                                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:border-blue-500"
                                    placeholder={isBlocked ? "Pl. Nyaralás" : "Pl. Melír, rövid haj..."}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-400">Mégse</button>
                                <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${isBlocked ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                                    {isBlocked ? 'Blokkolás' : 'Mentés'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingBookingId && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
                                <IoTrash />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Biztosan törlöd?</h3>
                            <p className="text-zinc-500 mb-6 text-sm">
                                Ez a művelet nem visszavonható. A foglalás véglegesen törlődik a naptárból.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingBookingId(null)}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"
                                >
                                    Mégse
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    Törlés
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {notificationQueue.length > 0 && (
                    <NewBookingNotification
                        key={notificationQueue[0].id}
                        booking={notificationQueue[0]}
                        type={notificationQueue[0].type || 'booking'} // Pass type
                        onClose={() => handleNotificationClose(notificationQueue[0])}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showMessageModal && messageRecipient && (
                    <MessageModal
                        isOpen={showMessageModal}
                        onClose={() => setShowMessageModal(false)}
                        recipientId={messageRecipient.id}
                        recipientName={messageRecipient.name}
                        senderId={user.id}
                        bookingId={messageRecipient.bookingId}
                    />
                )}
            </AnimatePresence>

            {/* Schedule Settings Modal */}
            <AnimatePresence>
                {showScheduleModal && providerProfile && (
                    <ScheduleSettingsModal
                        isOpen={showScheduleModal}
                        onClose={() => setShowScheduleModal(false)}
                        providerId={providerProfile.id}
                        currentSettings={providerProfile.schedule_settings}
                        onUpdate={(newSettings) => setProviderProfile(prev => ({ ...prev, schedule_settings: newSettings }))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
