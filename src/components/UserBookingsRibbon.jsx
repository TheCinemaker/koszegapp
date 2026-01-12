import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCalendar, IoTime } from 'react-icons/io5';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import BookingDetailsModal from './BookingDetailsModal';

export default function UserBookingsRibbon() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const fetchMyBookings = useCallback(async () => {
        if (!user) {
            setBookings([]);
            return;
        }

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                start_time,
                end_time,
                provider:providers (
                    business_name,
                    category,
                    location_address
                )
            `)
            .eq('client_id', user.id)
            .neq('status', 'cancelled') // Hide cancelled bookings
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(5);

        if (error) console.error("Error fetching my bookings:", error);
        else setBookings(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchMyBookings();

        // Subscribe to realtime changes on my bookings
        const subscription = supabase
            .channel('my-bookings-ribbon')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${user?.id}`
                },
                () => fetchMyBookings()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${user?.id}`
                },
                () => fetchMyBookings()
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'bookings'
                },
                () => {
                    // Trigger refresh on ANY delete to ensure we catch removal of our own bookings
                    fetchMyBookings();
                }
            )
            .subscribe();

        return () => subscription.unsubscribe();

    }, [user, fetchMyBookings]);

    if (!user || bookings.length === 0) return null;

    return (
        <>
            {/* Positioned exactly like the navbar but higher up */}
            <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[70] w-full max-w-[95vw] sm:max-w-md pointer-events-none flex justify-center">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="pointer-events-auto w-full"
                >
                    <div className="
                        bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(20,20,20,0.85)]
                        backdrop-blur-[25px] saturate-[1.8] backdrop-brightness-[1.1]
                        rounded-[24px]
                        shadow-[0_8px_20px_rgba(0,0,0,0.12)]
                        border border-white/50 dark:border-white/20
                        overflow-hidden
                        flex flex-col
                        pb-1.5 pt-1
                    ">
                        {/* Top Thin Header Strip */}
                        <div className="flex items-center justify-center pb-1 border-b border-black/5 dark:border-white/5 mb-1">
                            <div className="flex items-center gap-1.5 opacity-60">
                                <IoCalendar className="text-[10px]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] leading-none">Foglalások</span>
                            </div>
                        </div>

                        {/* Scrolling Booking List - Full Width */}
                        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x items-center px-3">
                            {bookings.map((booking, index) => {
                                const start = parseISO(booking.start_time);
                                return (
                                    <div
                                        key={booking.id}
                                        onClick={() => {
                                            console.log("Ribbon item clicked:", booking);
                                            setSelectedBooking(booking);
                                        }}
                                        className="
                                            min-w-[170px] snap-center flex items-center gap-2.5
                                            cursor-pointer group select-none
                                            bg-white/40 dark:bg-white/5 rounded-xl
                                            px-2 py-1.5
                                            border border-black/5 dark:border-white/5
                                            active:scale-[0.98] transition-all
                                        "
                                    >
                                        {/* Minimal Circle Icon */}
                                        <div className="w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-xs shrink-0">
                                            {booking.provider?.category === 'fodraszat' ? '💇' :
                                                booking.provider?.category === 'kormos' ? '💅' : '✨'}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="font-semibold text-[12px] text-zinc-900 dark:text-white truncate leading-tight">
                                                {booking.provider?.business_name}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                <span className={`${isToday(start) ? 'text-[#007AFF] font-bold' : ''}`}>
                                                    {isToday(start) ? 'Ma' : isTomorrow(start) ? 'Holnap' : format(start, 'MMM d.', { locale: hu })}
                                                </span>
                                                <span className="opacity-40">•</span>
                                                <span>{format(start, 'HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modal remains unchanged */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    isOpen={!!selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onUpdate={fetchMyBookings}
                />
            )}
        </>
    );
}
