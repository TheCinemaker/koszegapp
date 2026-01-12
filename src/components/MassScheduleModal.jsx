import React from 'react';
import { motion } from 'framer-motion';
import { IoClose, IoLocationOutline, IoTimeOutline, IoInformationCircleOutline } from 'react-icons/io5';
import massData from '../data/massSchedule.json';

export default function MassScheduleModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ y: "100%", scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: "100%", scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="
                    relative w-full max-w-lg 
                    bg-[#f5f5f7] dark:bg-zinc-900 
                    rounded-t-[2rem] sm:rounded-[2rem] 
                    shadow-2xl overflow-hidden 
                    pointer-events-auto
                    h-[85vh] flex flex-col
                "
            >
                {/* Header */}
                <div className="relative p-6 bg-white dark:bg-zinc-800 shrink-0 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <span className="text-xl">⛪</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-none">Miserend</h2>
                            <p className="text-xs text-zinc-500 font-medium">Kőszegi templomok</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors text-zinc-500">
                        <IoClose className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
                    {massData.churches.map((church, i) => (
                        <motion.div
                            key={church.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-white/5"
                        >
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">{church.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                                <IoLocationOutline />
                                {church.address}
                            </div>

                            {/* Schedule Grid */}
                            <div className="space-y-3">
                                {church.schedule.map((dayItem, idx) => (
                                    <div key={idx} className="flex gap-4 border-b border-zinc-50 dark:border-white/5 last:border-0 pb-3 last:pb-0">
                                        <div className="w-20 shrink-0 font-bold text-zinc-400 text-sm py-1">
                                            {dayItem.day}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {dayItem.times.map((t, tIdx) => (
                                                <div key={tIdx} className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md font-bold text-sm">
                                                        {t.time}
                                                    </span>
                                                    {t.note && (
                                                        <span className="text-xs text-zinc-500 italic">
                                                            {t.note}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Info Note */}
                            {church.info && (
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex gap-2">
                                    <IoInformationCircleOutline className="shrink-0 text-orange-500 mt-0.5" />
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {church.info}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
