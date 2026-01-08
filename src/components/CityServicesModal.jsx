import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCallOutline, IoTimeOutline, IoLocationOutline, IoInformationCircleOutline } from 'react-icons/io5';
import servicesData from '../data/cityServices.json';

export default function CityServicesModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('post');

    const tabs = [
        { id: 'post', label: 'Posta', icon: '📮' },
        { id: 'government', label: 'Kormányablak', icon: '🏛️' },
        { id: 'market', label: 'Piac', icon: '🥦' },
        { id: 'utilities', label: 'Közmű/Hiba', icon: '🔧' },
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
                            <span className="text-3xl">🏙️</span> Városi Szolgáltatások
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

                        {/* Post Office View */}
                        {activeTab === 'post' && (
                            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{servicesData.postOffice.title}</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <IoLocationOutline className="text-xl shrink-0 mt-0.5" />
                                        <span>{servicesData.postOffice.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <IoCallOutline className="text-xl shrink-0" />
                                        <a href={`tel:${servicesData.postOffice.phone}`} className="hover:text-blue-500 font-medium">{servicesData.postOffice.phone}</a>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <IoTimeOutline /> Nyitvatartás
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {servicesData.postOffice.hours.map((h, i) => (
                                                <li key={i} className="flex justify-between">
                                                    <span>{h.split(':')[0]}</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{h.split(':').slice(1).join(':')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Government View */}
                        {activeTab === 'government' && (
                            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{servicesData.government.title}</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <IoLocationOutline className="text-xl shrink-0 mt-0.5" />
                                        <span>{servicesData.government.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <IoCallOutline className="text-xl shrink-0" />
                                        <a href={`tel:${servicesData.government.phone}`} className="hover:text-blue-500 font-medium">{servicesData.government.phone}</a>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <IoTimeOutline /> Ügyfélfogadás
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {servicesData.government.hours.map((h, i) => (
                                                <li key={i} className="flex justify-between">
                                                    <span>{h.split(':')[0]}</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{h.split(':').slice(1).join(':')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex gap-2">
                                        <IoInformationCircleOutline className="text-lg shrink-0" />
                                        {servicesData.government.note}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Market View */}
                        {activeTab === 'market' && (
                            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{servicesData.market.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{servicesData.market.description}</p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <IoLocationOutline className="text-xl shrink-0 mt-0.5" />
                                        <span>{servicesData.market.address}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <IoTimeOutline /> Nyitvatartás
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {servicesData.market.hours.map((h, i) => (
                                                <li key={i} className="flex justify-between">
                                                    <span>{h.split(':')[0]}</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{h.split(':').slice(1).join(':')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Utilities View */}
                        {activeTab === 'utilities' && (
                            <div className="space-y-4">
                                {servicesData.utilities.map((util, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{util.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{util.description}</p>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={`tel:${util.phone}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                <IoCallOutline className="text-lg" />
                                                {util.phone}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
