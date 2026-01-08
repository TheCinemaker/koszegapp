import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import servicesData from '../data/cityServices.json';

export default function ShopsModal({ isOpen, onClose }) {

    if (!isOpen) return null;

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
                            <span className="text-3xl">🛒</span> Boltok & Üzletek
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
                        {ServicesDataHasShops(servicesData) ? (
                            <div className="space-y-4">
                                {servicesData.shops.map((shop, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{shop.name}</h3>

                                        <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 mb-3">
                                            <IoLocationOutline className="text-lg shrink-0 mt-0.5" />
                                            <span>{shop.address}</span>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                <IoTimeOutline /> Nyitvatartás
                                            </div>
                                            <ul className="space-y-1 text-sm">
                                                {shop.hours.map((h, i) => (
                                                    <li key={i} className="flex justify-between">
                                                        <span>{h.split(':')[0]}</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{h.split(':').slice(1).join(':')}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-gray-500">
                                Nincs elérhető bolt információ.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 text-center">
                        <p className="text-xs text-gray-400">
                            Az adatok tájékoztató jellegűek. Utolsó ellenőrzés: 2026.01.08.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function ServicesDataHasShops(data) {
    return data && data.shops && Array.isArray(data.shops) && data.shops.length > 0;
}
