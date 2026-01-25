import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoBasket, IoRestaurant, IoClose, IoAdd, IoRemove, IoArrowBack, IoTime, IoLocation, IoReceipt, IoHome, IoGift, IoPerson, IoWallet, IoArrowForward, IoSearchOutline } from 'react-icons/io5';
import { useCart } from '../hooks/useCart';
import { getMenu, placeOrder } from '../api/foodService';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import KoszegPassProfile from './KoszegPassProfile';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

// --- RESTAURANT CARD (Thinner + Info Capsule Restored) ---
const RestaurantCard = ({ restaurant, onClick, index }) => (
    <FadeUp delay={index * 0.05}>
        <motion.div
            layoutId={`restaurant-${restaurant.id}`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="
                cursor-pointer 
                relative overflow-hidden
                bg-white/60 dark:bg-[#1a1c2e]/60 
                backdrop-blur-[30px] saturate-150
                rounded-[2rem] 
                border border-white/60 dark:border-white/10 
                shadow-[0_4px_20px_0_rgba(31,38,135,0.05)]
                group
                flex flex-col
            "
        >
            {/* Abstract Background Gradient - Thinner/Smaller */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-600 opacity-10 blur-[40px] rounded-full group-hover:opacity-20 transition-opacity duration-500" />

            {/* Image Section - Reduced Height for "Thinner" feel */}
            <div className="h-40 relative overflow-hidden rounded-t-[2rem] m-1.5 mb-0">
                {restaurant.image_url ? (
                    <ParallaxImage src={restaurant.image_url} className="w-full h-full" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900" />
                )}

                {/* Info Capsule (Restored!) */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                    {restaurant.has_delivery === false ? (
                        <div className="bg-black/70 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 border border-white/10">
                            <IoLocation className="text-amber-500" />
                            <span>CSAK ELVITEL</span>
                        </div>
                    ) : (
                        <div className="bg-white/80 dark:bg-black/60 text-gray-900 dark:text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                            <IoTime className="text-amber-500" />
                            <span>{restaurant.delivery_time || '30-40 p'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section - Compact */}
            <div className="p-4 relative z-10 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">
                    {restaurant.name}
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-2">
                    {restaurant.tags && restaurant.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md">
                            {tag}
                        </span>
                    ))}
                </div>

                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 leading-relaxed">
                    {restaurant.description}
                </p>
            </div>
        </motion.div>
    </FadeUp>
);

export default function FoodOrderPage() {
    const [activeTab, setActiveTab] = useState('home');
    const [view, setView] = useState('restaurants');
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [realCategories, setRealCategories] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('delivery'); // 'delivery' | 'pickup'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { items, addItem, removeItem, updateQuantity, clearCart, total, count } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user } = useAuth();
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);

    // Monitor Active Orders
    useEffect(() => {
        if (!user) return;
        const fetchActiveOrders = async () => {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('status', ['new', 'preparing', 'delivering']);
            if (!error) setActiveOrdersCount(count || 0);
        };
        fetchActiveOrders();
        const channel = supabase.channel('active-orders-monitor').on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => fetchActiveOrders()).subscribe();
        return () => supabase.removeChannel(channel);
    }, [user]);

    // Fetch Data (Restaurants & Categories)
    useEffect(() => {
        const fetchRestaurants = async () => {
            const { data } = await supabase.from('restaurants').select('*').eq('is_open', true).order('name');
            if (data) setRestaurants(data);
        };
        const fetchCategories = async () => {
            const { data } = await supabase.from('menu_categories').select('name, restaurant_id');
            if (data) {
                const uniqueCats = [...new Set(data.map(c => c.name))].sort();
                setRealCategories(uniqueCats);
                const map = {};
                data.forEach(c => { if (!map[c.name]) map[c.name] = new Set(); map[c.name].add(c.restaurant_id); });
                setCategoryMap(map);
            }
        };
        fetchRestaurants();
        fetchCategories();
        const sub = supabase.channel('restaurants-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurants' }, (payload) => {
            setRestaurants(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
        }).subscribe();
        return () => supabase.removeChannel(sub);
    }, []);

    // Load Menu
    useEffect(() => {
        if (selectedRestaurant) {
            setLoading(true);
            getMenu(selectedRestaurant.id).then(data => { setCategories(data); setView('menu'); }).catch(() => toast.error("Hiba a menü betöltésekor")).finally(() => setLoading(false));
            const sub = supabase.channel(`menu-${selectedRestaurant.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${selectedRestaurant.id}` }, () => {
                getMenu(selectedRestaurant.id).then(setCategories);
            }).subscribe();
            return () => supabase.removeChannel(sub);
        }
    }, [selectedRestaurant]);

    const handleBack = () => { setView('restaurants'); setSelectedRestaurant(null); setCategories([]); };

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden pt-2 pb-24 font-sans transition-colors duration-300">

            {/* --- HERO SECTION --- */}
            <div className="pt-6 pb-2 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 self-start sm:self-center">
                        {view === 'menu' ? (
                            <button onClick={handleBack} className="w-10 h-10 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                <IoArrowBack className="text-lg text-zinc-900 dark:text-white" />
                            </button>
                        ) : (
                            <Link to="/" className="w-10 h-10 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                <IoHome className="text-lg text-zinc-900 dark:text-white" />
                            </Link>
                        )}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Kőszeg<span className="text-amber-500">Eats</span></h1>
                            {user && <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Szia, {user.user_metadata?.nickname || 'Vendég'}!</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/20 shadow-md pl-4 pr-1 py-1 rounded-full hover:scale-105 transition-transform"
                        >
                            <IoBasket className="text-xl text-zinc-800 dark:text-white" />

                            {/* 1. STATUS INDICATOR CAPSULE (Next to basket, non-blinking) */}
                            {activeOrdersCount > 0 && (
                                <div className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                                    {activeOrdersCount} aktív
                                </div>
                            )}

                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black shadow-sm">
                                    {count}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                <div className={activeTab === 'home' ? 'block' : 'hidden'}>
                    {view === 'restaurants' && (
                        <>
                            {/* 2. SEARCH BAR (Thinner, matching Dashboard h-14 but ensuring thin look -> h-12) */}
                            {/* 3. TOGGLE SWITCH (Small, right side) */}
                            <div className="flex flex-row items-center justify-between gap-4 mb-6 mt-4">

                                {/* Search Input */}
                                <div className="relative flex-1 group max-w-lg">
                                    <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors text-lg" />
                                    <input
                                        type="text"
                                        placeholder="Keress éttermet..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="
                                            w-full h-12 pl-12 pr-4 rounded-2xl
                                            bg-white dark:bg-zinc-800/50
                                            border border-transparent focus:border-amber-500/50
                                            text-sm text-zinc-900 dark:text-white font-medium
                                            placeholder-zinc-400
                                            focus:outline-none focus:ring-4 focus:ring-amber-500/10
                                            transition-all shadow-sm
                                        "
                                    />
                                </div>

                                {/* Delivery/Pickup Toggle Switch */}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-bold uppercase text-zinc-400">
                                        {filterType === 'delivery' ? 'Kiszállítás' : 'Elvitel'}
                                    </span>
                                    <button
                                        onClick={() => setFilterType(prev => prev === 'delivery' ? 'pickup' : 'delivery')}
                                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${filterType === 'delivery' ? 'bg-amber-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'}`}
                                    >
                                        <motion.div
                                            layout
                                            className="w-4 h-4 rounded-full bg-white shadow-sm"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* 4. CATEGORIES (Small, thin buttons) */}
                            {realCategories.length > 0 && (
                                <div className="mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <div className="flex gap-2 min-w-max">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className={`
                                                flex items-center justify-center px-4 py-2 rounded-xl border transition-all duration-300 font-bold text-xs
                                                ${selectedCategory === null
                                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                                    : 'bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-amber-500/50'}
                                            `}
                                        >
                                            Összes
                                        </button>
                                        {realCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`
                                                    flex items-center justify-center px-4 py-2 rounded-xl border transition-all duration-300 font-bold text-xs
                                                    ${selectedCategory === cat
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                                        : 'bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-amber-500/50'}
                                                `}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 5. RESTAURANT GRID (Thinner cards) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
                                {restaurants
                                    .filter(r => {
                                        const termMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
                                        const deliveryMatch = filterType === 'delivery' ? (r.has_delivery !== false) : true;
                                        if (!selectedCategory) return termMatch && deliveryMatch;
                                        const categoryMatch = categoryMap[selectedCategory] && categoryMap[selectedCategory].has(r.id);
                                        return termMatch && deliveryMatch && categoryMatch;
                                    })
                                    .map((rest, idx) => (
                                        <RestaurantCard
                                            key={rest.id}
                                            restaurant={rest}
                                            index={idx}
                                            onClick={() => setSelectedRestaurant(rest)}
                                        />
                                    ))
                                }
                            </div>
                        </>
                    )}

                    {/* MENU VIEW - Keep premium but match thinner aesthetic where possible */}
                    {view === 'menu' && selectedRestaurant && (
                        <div className="pb-24">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/60 dark:bg-[#1a1c2e]/60 backdrop-blur-[30px] rounded-[2rem] p-5 border border-white/60 dark:border-white/10 shadow-xl mb-6 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

                                <div className="flex flex-col md:flex-row gap-5 relative z-10">
                                    <div className="w-full md:w-32 md:h-32 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                        {selectedRestaurant.image_url ? (
                                            <ParallaxImage src={selectedRestaurant.image_url} className="w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">{selectedRestaurant.name}</h2>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <div className="px-2 py-1 rounded-lg bg-white/50 dark:bg-black/20 text-[10px] font-bold flex items-center gap-1 border border-black/5 dark:border-white/5">
                                                <IoLocation className="text-amber-500" /> {selectedRestaurant.address}
                                            </div>
                                            <div className="px-2 py-1 rounded-lg bg-white/50 dark:bg-black/20 text-[10px] font-bold flex items-center gap-1 border border-black/5 dark:border-white/5">
                                                <IoTime className="text-amber-500" /> {selectedRestaurant.delivery_time || '30-40p'}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed max-w-xl">
                                            {selectedRestaurant.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {loading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div></div>
                            ) : (
                                <div className="space-y-8">
                                    {categories.map((category) => (
                                        <div key={category.id} id={`cat-${category.id}`}>
                                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white pl-1">
                                                <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                                                {category.name}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {category.items.map(item => (
                                                    <MenuItemCard key={item.id} item={item} onAdd={() => addItem({ ...item, restaurant_id: selectedRestaurant.id })} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {categories.length === 0 && <p className="text-center opacity-50 py-10 text-sm">Jelenleg nincs betöltött menü.</p>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'orders' && (
                    <div className="pb-32">
                        <div className="bg-white/40 dark:bg-[#1a1c2e]/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-lg mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                <IoReceipt className="text-xl" />
                            </div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white">Rendelések</h1>
                        </div>
                        {user ? <MyOrdersList user={user} /> : (
                            <div className="text-center py-20 text-zinc-500">Jelentkezz be a rendeléseidhez.</div>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && <div className="pb-32"><KoszegPassProfile viewMode="card" /></div>}
                {activeTab === 'account' && <div className="pb-32"><KoszegPassProfile viewMode="settings" /></div>}
            </div>

            {/* FLOATING BOTTOM NAVIGATION */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
                <div className="pointer-events-auto bg-white/70 dark:bg-[#1a1c2e]/70 backdrop-blur-[40px] saturate-150 border border-white/40 dark:border-white/10 shadow-2xl rounded-[2rem] px-6 py-4 flex items-center gap-6 md:gap-8 transition-transform hover:scale-[1.02]">
                    <NavButton label="Főoldal" icon={IoHome} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavButton label="Rendelések" icon={IoReceipt} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`group relative -mt-12 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-white/20 transition-all duration-300 ${activeTab === 'rewards' ? 'bg-amber-500 scale-110 -rotate-3 shadow-amber-500/40 text-white' : 'bg-gray-900 dark:bg-white text-amber-500 dark:text-black hover:scale-110'}`}
                    >
                        <IoWallet size={24} />
                    </button>
                    <NavButton label="Fiók" icon={IoPerson} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                </div>
            </div>

            <AnimatePresence>
                {isCartOpen && (
                    <CartDrawer
                        items={items}
                        total={total}
                        onClose={() => setIsCartOpen(false)}
                        onUpdateQty={updateQuantity}
                        onRemove={removeItem}
                        onClear={clearCart}
                        restaurantId={selectedRestaurant?.id}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function NavButton({ label, icon: Icon, active, onClick }) {
    return (
        <button onClick={onClick} className={`relative flex flex-col items-center justify-center w-10 h-10 transition-all duration-300 group ${active ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
            <Icon size={24} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
            {active && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
        </button>
    )
}

function MenuItemCard({ item, onAdd }) {
    return (
        <FadeUp delay={0.05}>
            <div className="group relative bg-white/50 dark:bg-[#1a1c2e]/50 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all duration-300 border border-white/60 dark:border-white/5 flex items-center gap-3 p-2.5 backdrop-blur-md">
                <div className="w-16 h-16 shrink-0 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden relative">
                    {item.image_url ? (
                        <p className="w-full h-full"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></p>
                    ) : (
                        <div className="flex items-center justify-center h-full text-lg opacity-20">🍽️</div>
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm leading-tight text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                        <span className="font-bold text-amber-600 dark:text-amber-500 text-xs whitespace-nowrap">{item.price} Ft</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                </div>
                <button onClick={onAdd} className="w-8 h-8 shrink-0 bg-white dark:bg-white/10 text-amber-500 rounded-full flex items-center justify-center shadow-sm hover:bg-amber-500 hover:text-white hover:scale-110 active:scale-95 transition-all border border-gray-100 dark:border-white/10">
                    <IoAdd className="text-lg font-bold" />
                </button>
            </div>
        </FadeUp>
    )
}

function MyOrdersList({ user }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase.from('orders').select('*, restaurants(name), items:order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();
        const chan = supabase.channel(`my-orders-list-tab-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.new.user_id === user.id) fetchOrders();
        }).subscribe();
        return () => supabase.removeChannel(chan);
    }, [user]);

    const getStatusText = (status) => {
        const map = { 'pending': 'Függőben', 'accepted': 'Elfogadva', 'preparing': 'Készül', 'delivering': 'Futárnál', 'completed': 'Kész', 'cancelled': 'Törölve' };
        return map[status] || status;
    };
    if (loading) return <div className="text-center opacity-50 text-xs">Töltés...</div>;
    if (orders.length === 0) return <div className="text-center opacity-50 text-xs">Nincs korábbi rendelés.</div>;

    return (
        <div className="space-y-3">
            {orders.map(order => (
                <div key={order.id} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/60 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{order.restaurants?.name}</div>
                        <span className="text-[9px] font-bold uppercase bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-gray-600 dark:text-gray-300">{getStatusText(order.status)}</span>
                    </div>
                    <div className="space-y-0.5 mb-2 opacity-80 text-[11px]">
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>{item.price * item.quantity} Ft</span></div>
                        ))}
                    </div>
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">Összesen</span>
                        <span className="font-black text-amber-500 text-sm">{order.total_price} Ft</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CartDrawer({ items, total, onClose, onUpdateQty, onRemove, onClear, restaurantId }) {
    const { user } = useAuth();
    const [step, setStep] = useState('cart');
    const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (step === 'checkout' && user) {
            const fetchUserData = async () => {
                const { data } = await supabase.from('koszegpass_users').select('full_name, phone, address').eq('id', user.id).single();
                if (data) setForm(prev => ({ ...prev, name: data.full_name || prev.name, phone: data.phone || prev.phone, address: data.address || prev.address }));
            };
            fetchUserData();
        }
    }, [step, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const ordersByRestaurant = items.reduce((acc, item) => {
                if (!acc[item.restaurant_id]) acc[item.restaurant_id] = [];
                acc[item.restaurant_id].push(item);
                return acc;
            }, {});
            await Promise.all(Object.keys(ordersByRestaurant).map(rId => placeOrder({ restaurantId: rId, customer: { ...form, userId: user?.id }, cartItems: ordersByRestaurant[rId] })));
            toast.success("Rendelés elküldve! 🍔");
            onClear(); onClose();
        } catch (error) { console.error(error); toast.error('Hiba történt.'); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-full max-w-md bg-white/90 dark:bg-[#151515]/95 backdrop-blur-[40px] h-full shadow-2xl pointer-events-auto flex flex-col border-l border-white/20"
            >
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-black">{step === 'cart' ? 'Kosarad 🛒' : 'Befejezés ✨'}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:scale-110 transition-transform"><IoClose /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <IoBasket className="text-5xl mb-3 opacity-20" />
                            <p className="text-sm">Még üres...</p>
                        </div>
                    ) : (
                        step === 'cart' ? (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center bg-white/50 dark:bg-white/5 p-2 rounded-xl border border-black/5 dark:border-white/5">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden shrink-0">
                                            {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate text-sm text-gray-900 dark:text-white">{item.name}</h4>
                                            <p className="text-[10px] text-amber-600 font-bold">{item.price} Ft</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-black/40 rounded-full px-2 py-1 shadow-sm">
                                            <button onClick={() => onUpdateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center hover:text-red-500"><IoRemove size={12} /></button>
                                            <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                                            <button onClick={() => onUpdateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center hover:text-green-500"><IoAdd size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
                                <div className="space-y-2">
                                    <input required type="text" placeholder="Név" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    <input required type="tel" placeholder="Telefonszám" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    <input required type="text" placeholder="Cím" className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                    <textarea rows={3} placeholder="Megjegyzés futárnak..." className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-black transition-all outline-none font-bold text-sm resize-none" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                                </div>
                            </form>
                        )
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 bg-white dark:bg-zinc-900 border-t border-black/5 dark:border-white/5 pb-10">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-500 font-bold text-sm">Végösszeg</span>
                            <span className="text-2xl font-black text-amber-500">{total.toLocaleString('hu-HU')} Ft</span>
                        </div>
                        {step === 'cart' ? (
                            <button onClick={() => setStep('checkout')} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-base">
                                Fizetés
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep('cart')} className="px-5 py-3 bg-gray-100 dark:bg-white/10 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">Vissza</button>
                                <button type="submit" form="checkout-form" disabled={isSubmitting} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl shadow-xl shadow-green-500/20 active:scale-95 transition-all text-base flex justify-center">
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Rendelés Leadása'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
