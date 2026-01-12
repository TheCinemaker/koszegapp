import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoArrowBack, IoPerson, IoCalendar, IoSearch, IoArrowForward } from 'react-icons/io5';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Booking logic handled here to keep the modal stack clean
    const [selectedProviderForBooking, setSelectedProviderForBooking] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
        } else {
            // Reset on close
            setTimeout(() => {
                setSelectedCategory(null);
                setSearchQuery('');
            }, 200);
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
        ? providers.filter(p => p.category === selectedCategory && p.status === 'active')
        : [];

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                {/* Backdrop - Heavier Blur/Darkness for specific aesthetics */}
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
                    <div className="relative p-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl shrink-0 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between z-10">
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
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10">
                        {!selectedCategory ? (
                            /* CATEGORY SELECTION VIEW */
                            <div className="space-y-8">
                                {/* Search Input & Context - NEW SECTION */}
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                        <div className="relative flex items-center bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-400">
                                            <IoSearch className="ml-4 text-zinc-400 text-xl shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Keresés név vagy szolgáltatás alapján..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-14 pl-3 pr-4 bg-transparent outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 font-medium"
                                            />
                                        </div>
                                    </div>

                                    {!searchQuery && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 flex gap-3 items-start"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center shrink-0">
                                                <IoPerson className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-0.5">Találd meg a szakembered!</h4>
                                                <p className="text-xs text-blue-800/70 dark:text-blue-300/70 leading-relaxed">
                                                    Válassz egy kategóriát vagy használd a keresőt, hogy időpontot foglalhass Kőszeg legjobb szolgáltatóinál.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Dynamic Content: Search Results OR Categories */}
                                {searchQuery ? (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide ml-1">Találatok</h3>
                                        {providers.filter(p =>
                                            p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            CATEGORIES.find(c => c.id === p.category)?.label.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length > 0 ? (
                                            providers
                                                .filter(p =>
                                                    p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    CATEGORIES.find(c => c.id === p.category)?.label.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map((provider, i) => (
                                                    <motion.div
                                                        key={provider.id}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => setSelectedProviderForBooking(provider)}
                                                        className="
                                                            relative bg-white/60 dark:bg-zinc-800/40 
                                                            backdrop-blur-lg border border-white/40 dark:border-white/5
                                                            p-4 rounded-2xl
                                                            hover:bg-white/80 dark:hover:bg-zinc-800/60 
                                                            transition-all cursor-pointer group
                                                            shadow-sm hover:shadow-md
                                                        "
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white dark:bg-zinc-700/50 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                                {CATEGORIES.find(c => c.id === provider.category)?.icon}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                    {provider.business_name}
                                                                </h4>
                                                                <p className="text-xs text-zinc-500 font-medium">{provider.location_address}</p>
                                                            </div>
                                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <IoArrowForward className="text-blue-500" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                        ) : (
                                            <div className="text-center py-10 opacity-50">
                                                <p>Nincs találat.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {CATEGORIES.map((cat, i) => {
                                            const count = providers.filter(p => p.category === cat.id && p.status === 'active').length;
                                            return (
                                                <motion.button
                                                    key={cat.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className="
                                                        relative group flex flex-col items-center justify-center 
                                                        bg-white/60 dark:bg-zinc-800/40 
                                                        backdrop-blur-md border border-white/50 dark:border-white/5
                                                        rounded-[1.5rem] p-6 
                                                        hover:bg-white/80 dark:hover:bg-zinc-800/60 
                                                        shadow-sm hover:shadow-lg hover:-translate-y-1 
                                                        transition-all duration-300
                                                    "
                                                >
                                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
                                                        {cat.icon}
                                                    </div>
                                                    <h3 className="font-bold text-zinc-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                                                        {cat.label}
                                                    </h3>
                                                    {count > 0 ? (
                                                        <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide rounded-full">
                                                            {count} elérhető
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px] font-medium rounded-full">
                                                            Hamarosan
                                                        </span>
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* PROVIDER LIST VIEW */
                            <div className="space-y-4">
                                {filteredProviders.length > 0 ? (
                                    filteredProviders.map((provider, i) => (
                                        <motion.div
                                            key={provider.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => setSelectedProviderForBooking(provider)}
                                            className="
                                                relative overflow-hidden
                                                bg-white/70 dark:bg-zinc-800/50 
                                                backdrop-blur-xl border border-white/40 dark:border-white/5
                                                p-5 rounded-[1.5rem]
                                                hover:bg-white dark:hover:bg-zinc-800 
                                                transition-all cursor-pointer group
                                                shadow-sm hover:shadow-xl hover:-translate-y-0.5
                                            "
                                        >
                                            <div className="flex items-start gap-4 z-10 relative">
                                                {/* Avatar/Icon */}
                                                <div className="
                                                    w-16 h-16 rounded-2xl 
                                                    bg-gradient-to-br from-blue-500 to-indigo-600 
                                                    flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/30
                                                    group-hover:scale-105 transition-transform duration-300
                                                ">
                                                    {provider.business_name.charAt(0)}
                                                </div>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                                        {provider.business_name}
                                                    </h3>
                                                    <div className="flex flex-col gap-1 text-sm text-zinc-500 font-medium">
                                                        <span className="flex items-center gap-1.5 overflow-hidden">
                                                            <IoArrowForward className="text-zinc-300 shrink-0" />
                                                            <span className="truncate">{provider.location_address}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <IoPerson className="text-zinc-300 shrink-0" />
                                                            {provider.contact_name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="self-center">
                                                    <button className="hidden sm:flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all">
                                                        Foglalás
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Decorative background blob */}
                                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-all duration-500"></div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <IoSearch className="text-3xl text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-400">Ebben a kategóriában még nincs szolgáltató.</h3>
                                        <p className="text-sm text-zinc-400/70 mt-2 max-w-xs">Nézz vissza később, vagy válassz másik kategóriát!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Gradient Fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#f5f5f7] dark:from-zinc-900 to-transparent pointer-events-none z-20"></div>

                    {/* Booking Modal */}
                    <AnimatePresence>
                        {selectedProviderForBooking && (
                            <BookingModal
                                isOpen={!!selectedProviderForBooking}
                                provider={selectedProviderForBooking}
                                onClose={() => setSelectedProviderForBooking(null)}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
}
