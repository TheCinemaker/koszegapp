import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoArrowBack, IoPerson, IoCalendar, IoSearch } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import BookingModal from './BookingModal';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇' },
    { id: 'kormos', label: 'Körmös', icon: '💅' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨' },
];

export default function ProvidersModal({ isOpen, onClose }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Booking logic handled here or passed down?
    // Let's handle it here to keep the modal stack clean
    const [selectedProviderForBooking, setSelectedProviderForBooking] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
        } else {
            // Reset on close
            setTimeout(() => setSelectedCategory(null), 200);
        }
    }, [isOpen]);

    const fetchProviders = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('providers').select('*');
        if (error) console.error(error);
        else setProviders(data || []);
        setLoading(false);
    };

    const filteredProviders = selectedCategory
        ? providers.filter(p => p.category === selectedCategory)
        : [];

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                />

                {/* Main Modal Content */}
                <motion.div
                    initial={{ y: "100%", scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: "100%", scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="
                        relative w-full max-w-2xl 
                        bg-[#f5f5f7] dark:bg-zinc-900 
                        rounded-t-[2rem] sm:rounded-[2rem] 
                        shadow-2xl overflow-hidden 
                        pointer-events-auto
                        h-[90vh] flex flex-col
                    "
                >
                    {/* Header */}
                    <div className="relative p-6 bg-white dark:bg-zinc-800 shrink-0 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            {selectedCategory ? (
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                                >
                                    <IoArrowBack className="text-xl" />
                                </button>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                    <IoCalendar className="text-xl" />
                                </div>
                            )}

                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-none">
                                    {selectedCategory
                                        ? CATEGORIES.find(c => c.id === selectedCategory)?.label
                                        : 'Időpontfoglaló'}
                                </h2>
                                <p className="text-xs text-zinc-500 font-medium">
                                    {selectedCategory ? 'Válassz szakembert' : 'Válassz szolgáltatást'}
                                </p>
                            </div>
                        </div>

                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors text-zinc-500">
                            <IoClose className="text-xl" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

                        {!selectedCategory ? (
                            /* CATEGORY SELECTION VIEW */
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {CATEGORIES.map((cat, i) => {
                                    const count = providers.filter(p => p.category === cat.id).length;
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className="
                                                flex flex-col items-center justify-center p-6
                                                bg-white dark:bg-zinc-800 
                                                rounded-3xl border border-zinc-100 dark:border-white/5
                                                shadow-sm hover:shadow-xl hover:scale-105 transition-all
                                                group
                                            "
                                        >
                                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                                {cat.icon}
                                            </div>
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{cat.label}</span>
                                            <span className="text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full mt-2">
                                                {count} szolgáltató
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ) : (
                            /* PROVIDER LIST VIEW */
                            <div className="space-y-4">
                                {filteredProviders.length > 0 ? filteredProviders.map((provider, i) => (
                                    <motion.div
                                        key={provider.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => setSelectedProviderForBooking(provider)}
                                        className="
                                            cursor-pointer group
                                            bg-white dark:bg-zinc-800 
                                            rounded-2xl p-4 
                                            border border-zinc-100 dark:border-white/5
                                            shadow-sm hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-900/50
                                            flex items-center gap-4 transition-all
                                        "
                                    >
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-3xl shadow-inner">
                                            {provider.category === 'fodraszat' ? '💇' :
                                                provider.category === 'kormos' ? '💅' :
                                                    provider.category === 'kozmetikus' ? '✨' :
                                                        provider.category === 'masszazs' ? '💆' : '🎨'}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">
                                                {provider.business_name}
                                            </h3>
                                            <p className="text-xs text-zinc-500 line-clamp-1 mb-2">
                                                {provider.location_address || 'Kőszeg'}
                                            </p>

                                            <div className="flex gap-2">
                                                <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">
                                                    Nyitva
                                                </span>
                                            </div>
                                        </div>

                                        <button className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                            <IoArrowForward />
                                        </button>
                                    </motion.div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-zinc-400">Ebben a kategóriában még nincs regisztrált partner.</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                    {/* Bottom Gradient Fade */}
                    <div className="h-6 bg-gradient-to-t from-[#f5f5f7] dark:from-zinc-900 to-transparent pointer-events-none absolute bottom-0 left-0 right-0" />
                </motion.div>
            </div>

            {/* NESTED BOOKING MODAL */}
            <AnimatePresence>
                {selectedProviderForBooking && (
                    <BookingModal
                        isOpen={!!selectedProviderForBooking}
                        onClose={() => setSelectedProviderForBooking(null)}
                        provider={selectedProviderForBooking}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
