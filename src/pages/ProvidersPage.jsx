import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoArrowBack, IoCalendar, IoSearch, IoPerson, IoArrowForward, IoCutOutline, IoSparklesOutline, IoColorWandOutline, IoBodyOutline, IoEllipsisHorizontalOutline, IoChevronForward } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import BookingModal from '../components/BookingModal';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', desc: 'Hajvágás, festés, styling', icon: IoCutOutline, gradient: 'from-blue-600 to-indigo-700' },
    { id: 'kormos', label: 'Körmös', desc: 'Manikűr, pedikűr, gél lakk', icon: IoSparklesOutline, gradient: 'from-pink-500 to-rose-600' },
    { id: 'kozmetikus', label: 'Kozmetikus', desc: 'Arckezelés, smink, gyanta', icon: IoColorWandOutline, gradient: 'from-emerald-500 to-teal-700' },
    { id: 'masszazs', label: 'Masszázs', desc: 'Relaxáció és gyógyulás', icon: IoBodyOutline, gradient: 'from-purple-600 to-violet-800' },
    { id: 'egyeb', label: 'Egyéb', desc: 'Minden más szolgáltatás', icon: IoEllipsisHorizontalOutline, gradient: 'from-zinc-600 to-gray-800' },
];

const PREMIUM_GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-purple-500',
    'from-zinc-700 to-black',
];

const getRandomGradient = (id) => {
    // Deterministic random based on ID string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PREMIUM_GRADIENTS[Math.abs(hash) % PREMIUM_GRADIENTS.length];
};

export default function ProvidersPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProviderForBooking, setSelectedProviderForBooking] = useState(null);

    React.useEffect(() => {
        fetchProviders();
    }, []);

    // Scroll to top when category changes
    React.useEffect(() => {
        if (selectedCategory) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [selectedCategory]);

    const fetchProviders = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('providers').select('*');
        if (error) console.error(error);
        else {
            setProviders(data || []);

            // Handle redirect-back: Open modal if provider ID is in URL
            const openProviderId = searchParams.get('openProvider');
            if (openProviderId) {
                const target = data?.find(p => p.id === openProviderId);
                if (target) {
                    setSelectedCategory('egyeb'); // Reveal category context
                    setSelectedProviderForBooking(target);
                }
            }
        }
        setLoading(false);
    };

    const filteredProviders = selectedCategory
        ? providers.filter(p => {
            const isMatch = p.category === selectedCategory && p.status === 'active';
            // If selecting 'egyeb', also show providers with custom category text
            const isCustomInEgyeb = selectedCategory === 'egyeb' &&
                p.status === 'active' &&
                !CATEGORIES.find(c => c.id === p.category);
            return isMatch || isCustomInEgyeb;
        })
        : [];

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/5 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => selectedCategory ? setSelectedCategory(null) : navigate(-1)}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                        >
                            <IoArrowBack className="text-xl text-zinc-900 dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-zinc-900 dark:text-white leading-none">
                                {selectedCategory
                                    ? CATEGORIES.find(c => c.id === selectedCategory)?.label
                                    : 'Időpontfoglaló'}
                            </h1>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                {selectedCategory ? 'Válassz szakembert' : 'Válassz szolgáltatást'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                {!selectedCategory ? (
                    <div className="space-y-10">
                        {/* Search */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                            <div className="relative flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
                                <IoSearch className="ml-5 text-zinc-400 text-xl shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Keresés név vagy szolgáltatás alapján..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-3 pr-4 bg-transparent outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 font-bold text-sm"
                                />
                            </div>
                        </div>

                        {/* Search Results or Categories */}
                        {searchQuery ? (
                            <div className="grid grid-cols-1 gap-3">
                                {providers.filter(p =>
                                    p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    CATEGORIES.find(c => c.id === p.category)?.label.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map((provider, i) => (
                                    <motion.div
                                        key={provider.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setSelectedProviderForBooking(provider)}
                                        className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-white/10 flex items-center gap-4 cursor-pointer hover:border-blue-400 transition-all group"
                                    >
                                        <div className={`w-12 h-12 bg-gradient-to-br ${getRandomGradient(provider.id)} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                                            {provider.business_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-zinc-900 dark:text-white leading-tight">{provider.business_name}</h4>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{provider.location_address}</p>
                                        </div>
                                        <IoChevronForward className="ml-auto text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {CATEGORIES.map((cat, i) => {
                                    const count = providers.filter(p => p.category === cat.id && p.status === 'active').length;
                                    const Icon = cat.icon;
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className="
                                                relative h-44 rounded-[2rem] p-5 flex flex-col justify-between overflow-hidden group
                                                bg-white/70 dark:bg-white/5 
                                                backdrop-blur-xl border border-zinc-200/50 dark:border-white/10
                                                shadow-sm hover:shadow-xl hover:shadow-indigo-500/10
                                                transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]
                                            "
                                        >
                                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${cat.gradient} opacity-20 blur-[30px] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-1000`} />
                                            
                                            <div className={`
                                                relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                                bg-gradient-to-br ${cat.gradient} text-white shadow-lg
                                                group-hover:rotate-6 group-hover:scale-110 transition-all duration-500
                                            `}>
                                                <Icon />
                                            </div>

                                            <div className="relative z-10 text-left">
                                                <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-none tracking-tight mb-1">{cat.label}</h3>
                                                <p className="text-[10px] font-bold text-zinc-500 leading-tight group-hover:text-indigo-500 transition-colors">{cat.desc}</p>
                                                
                                                <div className="mt-3">
                                                    {count > 0 && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                                            {count} elérhető
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredProviders.length > 0 ? (
                            filteredProviders.map((provider, i) => (
                                <motion.div
                                    key={provider.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedProviderForBooking(provider)}
                                    className="
                                        relative bg-white/70 dark:bg-white/5 backdrop-blur-xl 
                                        p-5 rounded-[2.5rem] border border-zinc-200/50 dark:border-white/10 
                                        flex items-center gap-5 cursor-pointer hover:shadow-2xl 
                                        hover:shadow-indigo-500/10 transition-all group overflow-hidden
                                    "
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-3xl rounded-full" />
                                    
                                    <div className={`relative z-10 w-14 h-14 bg-gradient-to-br ${getRandomGradient(provider.id)} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500`}>
                                        {provider.business_name.charAt(0)}
                                    </div>
                                    
                                    <div className="relative z-10 flex-1 min-w-0">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight tracking-tight truncate">{provider.business_name}</h3>
                                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                                            {CATEGORIES.find(c => c.id === provider.category)?.label || provider.category}
                                        </p>
                                    </div>
                                    
                                    <button className="relative z-10 bg-white dark:bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all hover:scale-105">
                                        Foglalás
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-10 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[3rem] border border-zinc-200/50 dark:border-white/5">
                                <div className="text-5xl mb-4 opacity-20">✨</div>
                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Még nincs itt senki</h4>
                                <p className="text-xs text-zinc-500 max-w-[200px]">Ebben a kategóriában hamarosan elérhetőek lesznek a szolgáltatók.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {selectedProviderForBooking && (
                    <BookingModal
                        isOpen={!!selectedProviderForBooking}
                        provider={selectedProviderForBooking}
                        onClose={() => setSelectedProviderForBooking(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
