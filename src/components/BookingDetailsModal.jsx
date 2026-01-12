import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { IoClose, IoCalendar, IoTime, IoTrash, IoLocation, IoAlertCircle } from 'react-icons/io5';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function BookingDetailsModal({ booking, onClose, onUpdate }) {
    console.log("BookingDetailsModal rendering with booking:", booking);
    const [loading, setLoading] = useState(false);

    if (!booking) return null;

    const start = parseISO(booking.start_time);
    const end = parseISO(booking.end_time);

    const handleCancel = async () => {
        if (!window.confirm("Biztosan lemondod ezt az időpontot?")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', booking.id);

            if (error) throw error;

            toast.success("Időpont sikeresen törölve.");
            onUpdate?.(); // Refresh the list
            onClose();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast.error("Hiba történt a törléskor.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="
                    relative w-full max-w-sm 
                    bg-white dark:bg-zinc-900 
                    rounded-[2rem] shadow-2xl 
                    overflow-hidden border border-zinc-100 dark:border-white/10
                "
            >
                {/* Header Image/Gradient */}
                <div className="h-24 bg-gradient-to-br from-purple-500 to-indigo-600 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <IoClose />
                    </button>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center text-3xl">
                        {booking.provider?.category === 'fodraszat' ? '💇' :
                            booking.provider?.category === 'kormos' ? '💅' : '✨'}
                    </div>
                </div>

                <div className="pt-10 pb-6 px-6 text-center">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">
                        {booking.provider?.business_name}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex items-center justify-center gap-1">
                        <IoLocation /> {booking.provider?.location_address || 'Kőszeg'}
                    </p>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6 space-y-3 text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                                <IoCalendar />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase font-bold">Dátum</p>
                                <p className="font-semibold text-zinc-900 dark:text-white">
                                    {format(start, 'yyyy. MMMM d.', { locale: hu })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg">
                                <IoTime />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase font-bold">Időpont</p>
                                <p className="font-semibold text-zinc-900 dark:text-white">
                                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <IoTrash />}
                            Időpont Lemondása
                        </button>

                        <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                            <IoAlertCircle /> Módosításhoz mondd le, és foglalj újat!
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
