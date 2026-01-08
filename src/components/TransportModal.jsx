import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoBusOutline, IoTrainOutline, IoCalendarOutline, IoArrowForward } from "react-icons/io5";

export default function TransportModal({ isOpen, onClose }) {

    if (!isOpen) return null;

    const links = [
        {
            title: "MÁV (Vonat)",
            subtitle: "Szombathely - Kőszeg vonal",
            icon: <IoTrainOutline className="text-2xl" />,
            url: "https://jegy.mav.hu/",
            color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        },
        {
            title: "Utas.hu (Busz)",
            subtitle: "Helyi és távolsági buszok",
            icon: <IoBusOutline className="text-2xl" />,
            url: "https://utas.hu/",
            color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        },
        {
            title: "Volánbusz.hu",
            subtitle: "Hivatalos menetrend",
            icon: <IoCalendarOutline className="text-2xl" />,
            url: "https://www.volanbusz.hu/hu",
            color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-[#1a1c2e] rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-3xl">🚌</span> Menetrendek
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <IoClose className="text-2xl text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="space-y-4">
                            {links.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${link.color}`}>
                                            {link.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{link.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{link.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <IoArrowForward className="text-xl" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 text-center">
                        <p className="text-xs text-gray-400">
                            A linkek külső oldalakra mutatnak.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
