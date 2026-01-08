import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCallOutline, IoTimeOutline, IoLocationOutline } from 'react-icons/io5';
import doctorsData from '../data/doctors.json';

export default function DoctorsModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('gps'); // gps, pediatrics, dentists, onCall

    const tabs = [
        { id: 'gps', label: 'Háziorvos', icon: '👨‍⚕️' },
        { id: 'pediatrics', label: 'Gyermek', icon: '👶' },
        { id: 'dentists', label: 'Fogorvos', icon: '🦷' },
        { id: 'pharmacies', label: 'Gyógyszertár', icon: '💊' },
        { id: 'onCall', label: 'Ügyelet', icon: '🚨' },
    ];

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
                            <span className="text-3xl">🏥</span> Orvosi Rendelők
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <IoClose className="text-2xl text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-2 gap-2 bg-gray-50 dark:bg-black/20 overflow-x-auto shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id
                                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'}
                `}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                        {/* On Call Special View */}
                        {activeTab === 'onCall' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{doctorsData.onCall.title}</h3>
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-300 font-bold mb-4">
                                        <IoCallOutline className="text-xl" />
                                        <a href={`tel:${doctorsData.onCall.phone}`} className="hover:underline">{doctorsData.onCall.phone}</a>
                                    </div>
                                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 mb-4">
                                        <IoLocationOutline className="text-xl shrink-0 mt-0.5" />
                                        <span>{doctorsData.onCall.address}</span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        {doctorsData.onCall.hours.map((h, i) => (
                                            <div key={i} className="flex justify-between text-sm border-b border-red-200/50 dark:border-red-800/20 pb-1 last:border-0">
                                                <span className="font-medium">{h.days}</span>
                                                <span className="font-bold">{h.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-red-600/80 dark:text-red-400/80 italic">
                                        {doctorsData.onCall.note}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 text-center text-sm text-gray-500">
                                    Súlyos, életveszélyes esetben azonnal: <strong className="text-red-600">112</strong>
                                </div>
                            </div>
                        )}

                        {/* List Views (GP, Ped, Dent, Pharmacies) */}
                        {activeTab !== 'onCall' && doctorsData[activeTab] && (
                            <div className="space-y-4">
                                {doctorsData[activeTab].map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {doc.name}
                                            </h3>
                                            {doc.isOnline && (
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide">
                                                    Online
                                                </span>
                                            )}
                                        </div>

                                        {doc.district && (
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
                                                {doc.district}
                                            </span>
                                        )}

                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            {doc.address && (
                                                <div className="flex items-start gap-2">
                                                    <IoLocationOutline className="text-lg text-gray-400 shrink-0 mt-0.5" />
                                                    <span>{doc.address}</span>
                                                </div>
                                            )}
                                            {doc.phone && doc.phone !== '-' && (
                                                <div className="flex items-center gap-2">
                                                    <IoCallOutline className="text-lg text-gray-400 shrink-0" />
                                                    <a href={`tel:${doc.phone}`} className="hover:text-blue-500 font-medium">{doc.phone}</a>
                                                </div>
                                            )}
                                            {doc.link && (
                                                <div className="mt-2">
                                                    <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                                                        🌐 Keresés megnyitása
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {doc.hours && (
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                    <IoTimeOutline /> Nyitvatartás / Rendelés
                                                </div>
                                                <ul className="space-y-1 text-sm">
                                                    {Array.isArray(doc.hours) ? doc.hours.map((h, i) => (
                                                        <li key={i} className="flex justify-between">
                                                            <span>{h.split(':')[0]}</span>
                                                            <span className="font-bold text-gray-800 dark:text-gray-200">{h.split(':').slice(1).join(':')}</span>
                                                        </li>
                                                    )) : (
                                                        <li>{doc.hours}</li> // Fallback if string
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {doc.consultation && (
                                            <div className="mt-3 text-xs text-gray-500 italic">
                                                Tanácsadás: {doc.consultation.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Fallback if data missing */}
                        {activeTab !== 'onCall' && !doctorsData[activeTab] && (
                            <div className="text-center p-8 text-gray-500">Adatok feltöltés alatt...</div>
                        )}

                    </div>

                    {/* Disclaimer Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 text-center">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                            Az adatok tájékoztató jellegűek. Utolsó ellenőrzés: 2026.01.08.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
