import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoCalendar, IoTime, IoPerson, IoInformationCircle, IoAlertCircle } from 'react-icons/io5';
import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';


export default function NewBookingNotification({ booking, type = 'booking', onClose, onReply }) { // type: 'booking' | 'cancelled'

    useEffect(() => {
        // No effects
    }, [type]);

    if (!booking) return null;

    const start = parseISO(booking.start_time);
    const clientNameMatch = booking.notes?.match(/\[Foglaló:\s*(.*?)\]/);
    const extractedName = clientNameMatch ? clientNameMatch[1] : null;
    const cleanNotes = booking.notes ? booking.notes.replace(/\[Foglaló:\s*.*?\]\s*/, '') : '';

    const clientName = booking.manual_client_name || extractedName || booking.profiles?.full_name || booking.profiles?.nickname || 'Ismeretlen Vendég';
    const isCancelled = type === 'cancelled';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark Blurred Backdrop - Darker for alerts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 backdrop-blur-md ${isCancelled ? 'bg-black/90' : 'bg-black/80'}`}
            />

            {/* Notification Card */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 100 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 100 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={`
                    relative w-full max-w-lg 
                    bg-white dark:bg-zinc-900 
                    rounded-[2.5rem] shadow-2xl 
                    overflow-hidden border-4 
                    ${isCancelled ? 'border-red-600' : 'border-indigo-500/30'}
                `}
            >
                {/* Header with Animation */}
                <div className={`
                    p-8 text-center relative overflow-hidden
                    ${isCancelled ? 'bg-red-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}
                `}>
                    {!isCancelled && <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 animate-pulse" />}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={`w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg mb-4 ${isCancelled ? 'text-red-600' : 'text-indigo-600'}`}
                    >
                        {isCancelled ? <IoAlertCircle /> : <IoCheckmarkCircle />}
                    </motion.div>
                    <h2 className="text-3xl font-black text-white leading-tight">
                        {isCancelled ? 'IDŐPONT LEMONDVA!' : 'Új Foglalás Érkezett!'}
                    </h2>
                    <p className="text-white/80 font-medium mt-1">
                        {isCancelled ? 'Egy vendég lemondta a foglalását 😢' : 'Valaki bejelentkezett a naptáradba 🎉'}
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                    {/* Client Info */}
                    <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-white/5">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${isCancelled ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <IoPerson />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-zinc-400 mb-1">Vendég Neve</p>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{clientName}</h3>
                            {booking.profiles?.phone && (
                                <p className="text-sm text-zinc-500 mt-1">{booking.profiles.phone}</p>
                            )}
                        </div>
                    </div>

                    {/* Time & Service Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <p className="text-xs font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1"><IoCalendar /> Időpont</p>
                            <p className="font-bold text-zinc-900 dark:text-white text-lg">
                                {format(start, 'MMM d.', { locale: hu })}
                            </p>
                            <p className={`font-black text-xl ${isCancelled ? 'text-red-600' : 'text-indigo-600'}`}>
                                {format(start, 'HH:mm')}
                            </p>
                        </div>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-white/5">
                            <p className="text-xs font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1"><IoInformationCircle /> Szolgáltatás</p>
                            <p className="font-bold text-zinc-900 dark:text-white leading-snug">
                                {booking.services?.name || 'Egyéb szolgáltatás'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                {booking.services?.duration_min || 30} perc
                            </p>
                        </div>
                    </div>

                    {cleanNotes && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/20">
                            <p className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 mb-1">Megjegyzés</p>
                            <p className="text-zinc-700 dark:text-zinc-300 italic">"{cleanNotes}"</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        {booking.client_id && !isCancelled && (
                            <button
                                onClick={onReply}
                                className="flex-1 py-4 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 font-black text-lg rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all border border-indigo-100 dark:border-indigo-900"
                            >
                                Válasz írása ✉️
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`flex-1 py-4 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all
                                ${isCancelled ? 'bg-red-600 hover:bg-red-700 w-full' : 'bg-zinc-900 dark:bg-white dark:text-black'}
                            `}
                        >
                            {isCancelled ? 'Tudomásul vettem' : 'Rendben! 👍'}
                        </button>
                    </div>

                    <p className="text-center text-xs text-zinc-400">
                        {isCancelled ? 'A foglalás törlődött a naptáradból.' : 'A foglalás automatikusan bekerült a naptáradba.'}
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
