import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoBasket, IoRestaurant, IoClose, IoAdd, IoRemove, IoArrowBack, IoTime, IoLocation, IoReceipt, IoHome, IoGift, IoPerson, IoWallet } from 'react-icons/io5';
import { useCart } from '../hooks/useCart';
import { getMenu, placeOrder, getRestaurants } from '../api/foodService';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import KoszegPassProfile from './KoszegPassProfile';

export default function FoodOrderPage() {
    // Tab State: 'home', 'orders', 'rewards', 'account'
    const [activeTab, setActiveTab] = useState('home');

    const [view, setView] = useState('restaurants'); // 'restaurants' | 'menu' (Sub-view within Home)
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [categories, setCategories] = useState([]); // For the specific restaurant menu view
    const [realCategories, setRealCategories] = useState([]); // All available categories across ALL restaurants
    const [categoryMap, setCategoryMap] = useState({}); // Map<CategoryName, Set<RestaurantID>>
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('delivery'); // 'delivery' | 'pickup'
    const [selectedCategory, setSelectedCategory] = useState(null);

    const { items, addItem, removeItem, updateQuantity, clearCart, total, count } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Auth & Orders Logic
    const { user } = useAuth();
    // const [showOrders, setShowOrders] = useState(false); // Deprecated in favor of 'orders' tab

    // 1. Éttermek betöltése induláskor
    // 1. Éttermek betöltése és feliratkozás
    useEffect(() => {
        const fetchRestaurants = async () => {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_open', true)
                .order('name');

            if (error) {
                console.error(error);
                toast.error("Nem sikerült betölteni az éttermeket");
            } else {
                setRestaurants(data || []);
            }
        };

        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('menu_categories')
                .select('name, restaurant_id');

            if (data) {
                const uniqueCats = [...new Set(data.map(c => c.name))].sort();
                setRealCategories(uniqueCats);

                // Build Map: "Pizza" -> [restId1, restId2]
                const map = {};
                data.forEach(c => {
                    if (!map[c.name]) map[c.name] = new Set();
                    map[c.name].add(c.restaurant_id);
                });
                setCategoryMap(map);
            }
        };

        fetchRestaurants();
        fetchCategories();

        // Subscribe to changes (e.g. delivery time updates)
        const channelRestaurants = supabase.channel('restaurants-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurants' }, (payload) => {
                setRestaurants(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
                if (payload.new.delivery_time) {
                    toast.success(`Új kiszállítási idő: ${payload.new.delivery_time}`, { icon: '⏱️' });
                }
            })
            .subscribe();

        // Subscribe to category changes
        const channelCategories = supabase.channel('categories-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => {
                fetchCategories();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelRestaurants);
            supabase.removeChannel(channelCategories);
        };
    }, []);

    useEffect(() => {
        if (selectedRestaurant) {
            setLoading(true);

            // Initial fetch
            getMenu(selectedRestaurant.id)
                .then(data => {
                    setCategories(data);
                    setView('menu');
                })
                .catch(err => {
                    console.error(err);
                    toast.error("Nem sikerült betölteni a menüt");
                    setSelectedRestaurant(null);
                })
                .finally(() => setLoading(false));

            // Realtime Subscription
            const channel = supabase.channel(`menu-${selectedRestaurant.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${selectedRestaurant.id}` },
                    (payload) => {
                        // Simple strategy: Reload menu on any change (safer for consistency)
                        // Alternatively, we could update state locally for better performance
                        getMenu(selectedRestaurant.id).then(setCategories);

                        if (payload.eventType === 'UPDATE' && !payload.new.is_available) {
                            toast('Egy termék lekerült a menüről', { icon: '⚠️' });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedRestaurant]);

    const handleBack = () => {
        setView('restaurants');
        setSelectedRestaurant(null);
        setCategories([]);
    };

    // Category Icon Mapping
    const getCategoryIcon = (catName) => {
        const lower = catName.toLowerCase();
        if (lower.includes('pizza')) return '/category-icons/pizza.png';
        if (lower.includes('burger')) return '/category-icons/burger.png';
        if (lower.includes('hamburger')) return '/category-icons/burger.png';
        if (lower.includes('kebab')) return '/category-icons/kebab.png';
        if (lower.includes('gyros')) return '/category-icons/kebab.png';
        if (lower.includes('tortilla')) return '/category-icons/tortilla.png';
        if (lower.includes('saláta')) return '/category-icons/salad.png';
        if (lower.includes('salad')) return '/category-icons/salad.png';
        if (lower.includes('ital')) return '/category-icons/drinks.png';
        if (lower.includes('drink')) return '/category-icons/drinks.png';
        return `https://source.unsplash.com/100x100/?${catName},food`; // Fallback
    };

    return (
        <div className="min-h-screen flex flex-col mesh-bg-vibrant text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500">

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 pb-24"> {/* Padding for bottom nav */}

                {/* --- TAB: HOME --- */}
                <div className={activeTab === 'home' ? 'block' : 'hidden'}>
                    {/* Header */}
                    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-[#1a1c2e]/70 border-b border-white/20 dark:border-white/5 shadow-sm">
                        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {view === 'menu' && (
                                    <button onClick={handleBack} className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                                        <IoArrowBack className="text-xl" />
                                    </button>
                                )}
                                <IoRestaurant className="text-amber-500 text-2xl" />
                                <h1 className="font-bold text-xl tracking-tight">Kőszeg<span className="text-amber-500">Eats</span></h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <IoBasket className="text-2xl" />
                                    {count > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1a1c2e]">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Category Bar */}
                    {view === 'restaurants' && realCategories.length > 0 && (
                        <div className="sticky top-16 z-20 bg-white/80 dark:bg-[#1a1c2e]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            <div className="container mx-auto px-4 flex gap-4 min-w-max">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`flex flex-col items-center gap-2 min-w-[70px] transition-opacity ${selectedCategory === null ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${selectedCategory === null ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-white/10'}`}>
                                        <IoRestaurant className="text-2xl" />
                                    </div>
                                    <span className={`text-xs font-bold ${selectedCategory === null ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>Összes</span>
                                </button>

                                {realCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`flex flex-col items-center gap-2 min-w-[70px] transition-opacity ${selectedCategory === cat ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-full overflow-hidden shadow-md border-2 ${selectedCategory === cat ? 'border-amber-500' : 'border-transparent'}`}>
                                            <img
                                                src={getCategoryIcon(cat)}
                                                className="w-full h-full object-cover p-1"
                                                alt={cat}
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'; }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold capitalize ${selectedCategory === cat ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <main className="container mx-auto px-4 py-8">
                        {view === 'restaurants' ? (
                            <>
                                {/* TOGGLE FILTER */}
                                <div className="flex justify-center mb-8">
                                    <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-1 rounded-full shadow-lg border border-white/20 flex relative">
                                        <motion.div
                                            className="absolute top-1 bottom-1 bg-amber-500 rounded-full shadow-md z-0"
                                            initial={false}
                                            animate={{
                                                left: filterType === 'delivery' ? '4px' : '50%',
                                                width: 'calc(50% - 4px)',
                                                x: filterType === 'pickup' ? 0 : 0
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                        <button
                                            onClick={() => setFilterType('delivery')}
                                            className={`relative z-10 px-6 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${filterType === 'delivery' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            <IoTime className="text-lg" /> Kiszállítás
                                        </button>
                                        <button
                                            onClick={() => setFilterType('pickup')}
                                            className={`relative z-10 px-6 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${filterType === 'pickup' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            <IoLocation className="text-lg" /> Elvitel / Helyben
                                        </button>
                                    </div>
                                </div>

                                {/* Restaurant List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {restaurants
                                        .filter(r => {
                                            const deliveryMatch = filterType === 'delivery' ? (r.has_delivery !== false) : true;
                                            if (!selectedCategory) return deliveryMatch;
                                            const categoryMatch = categoryMap[selectedCategory] && categoryMap[selectedCategory].has(r.id);
                                            return deliveryMatch && categoryMatch;
                                        })
                                        .map(rest => (
                                            <motion.div
                                                key={rest.id}
                                                layoutId={`restaurant-${rest.id}`}
                                                onClick={() => setSelectedRestaurant(rest)}
                                                className="relative h-full block rounded-[1.5rem] bg-white/70 dark:bg-white/5 backdrop-blur-[20px] backdrop-saturate-[1.6] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group overflow-hidden"
                                            >
                                                <div className="h-40 bg-gray-200 dark:bg-white/5 relative overflow-hidden group">
                                                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                                        {rest.image_url ? (
                                                            <img src={rest.image_url} alt={rest.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                                    </div>

                                                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                                                        {rest.has_delivery === false ? (
                                                            <div className="bg-gray-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 border border-white/10">
                                                                <IoLocation className="text-amber-500" />
                                                                <span>CSAK ELVITEL</span>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white/90 dark:bg-black/60 text-gray-900 dark:text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                                                                <IoTime className="text-amber-500 text-sm" />
                                                                <span>{rest.delivery_time || '30-40 perc'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h2 className="font-bold text-xl mb-1 text-gray-900 dark:text-gray-100">{rest.name}</h2>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{rest.description}</p>
                                                    <div className="flex items-center gap-4 text-xs font-medium opacity-70">
                                                        <span className="flex items-center gap-1"><IoLocation /> {rest.address}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </>
                        ) : (
                            /* MENU VIEW */
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="rounded-[2rem] bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-black/10" />
                                    <div className="relative z-10">
                                        <h2 className="text-3xl font-bold mb-2">{selectedRestaurant?.name}</h2>
                                        <p className="opacity-90 max-w-2xl">{selectedRestaurant?.description}</p>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 text-9xl opacity-20 rotate-12">🍔</div>
                                </div>

                                <div className="space-y-12">
                                    {categories.map(cat => (
                                        <section key={cat.id} id={cat.id}>
                                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                                                {cat.name}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {cat.items.map(item => (
                                                    <MenuItemCard key={item.id} item={item} onAdd={() => addItem(item)} />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </main>
                </div>

                {/* --- TAB: ORDERS --- */}
                {activeTab === 'orders' && user && (
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center gap-3 mb-6">
                            <h1 className="text-2xl font-bold">Rendeléseim</h1>
                        </div>
                        <MyOrdersList user={user} />
                    </div>
                )}
                {activeTab === 'orders' && !user && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                        <p className="text-gray-500">Jelentkezz be a rendeléseid megtekintéséhez.</p>
                    </div>
                )}

                {/* --- TAB: REWARDS (KőszegPass Card) --- */}
                {activeTab === 'rewards' && (
                    <KoszegPassProfile viewMode="card" />
                )}

                {/* --- TAB: ACCOUNT (Settings) --- */}
                {activeTab === 'account' && (
                    <KoszegPassProfile viewMode="settings" />
                )}

            </div>

            {/* FIXED BOTTOM NAVIGATION */}
            <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-white dark:bg-[#1a1c2e] border-t border-gray-200 dark:border-white/10 pb-5 pt-2 z-50 flex justify-around items-center px-2">
                <NavButton label="Főoldal" icon={IoHome} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton label="Rendelések" icon={IoReceipt} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                {/* Center Main Action Button for Pass */}
                <div className="relative -top-5">
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-[#1a1c2e] transition-transform ${activeTab === 'rewards' ? 'bg-amber-500 text-white scale-110' : 'bg-gray-900 text-amber-500'}`}
                    >
                        <IoWallet size={28} />
                    </button>
                    <span className="absolute -bottom-5 w-full text-center text-[10px] font-bold opacity-70">Jutalmak</span>
                </div>
                {/* <NavButton label="Jutalmak" icon={IoGift} active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} /> */}
                <NavButton label="Fiók" icon={IoPerson} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
            </div>

            {/* Cart Drawer Modal */}
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

        </div >
    );
}

// --- SUB-COMPONENTS ---

function NavButton({ label, icon: Icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
            <Icon size={24} className={active ? 'fill-current' : ''} />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    )
}


// Extracted Orders List Component for 'Orders' Tab
function MyOrdersList({ user }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            // ... Logic same as before ... 
            const { data } = await supabase
                .from('orders')
                .select('*, restaurants(name), items:order_items(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            if (data) setOrders(data);
            setLoading(false);
        };
        fetchOrders();
        // Subscription logic (Simplified for this view)
        const channel = supabase.channel(`my-orders-list-tab-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.new.user_id === user.id) fetchOrders();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-600';
            case 'accepted': return 'bg-blue-500/20 text-blue-600';
            case 'preparing': return 'bg-purple-500/20 text-purple-600';
            case 'delivering': return 'bg-orange-500/20 text-orange-600';
            case 'completed': return 'bg-green-500/20 text-green-600';
            case 'cancelled': return 'bg-red-500/20 text-red-600';
            default: return 'bg-gray-500/20 text-gray-600';
        }
    };

    const getStatusText = (status) => {
        const map = {
            'pending': 'Várakozás...',
            'accepted': 'Étterem elfogadta ✅',
            'preparing': 'Készül 👨‍🍳',
            'delivering': 'Futárnál 🚴',
            'completed': 'Kiszállítva 🏁',
            'cancelled': 'Elutasítva ❌'
        };
        return map[status] || status;
    };

    if (loading) return <div className="text-center py-10 opacity-50">Betöltés...</div>;
    if (orders.length === 0) return <div className="text-center py-10 opacity-50">Még nincs rendelésed.</div>;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="font-bold text-base mb-0.5">{order.restaurants?.name || 'Ismeretlen Étterem'}</div>
                            <div className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                        </span>
                    </div>
                    <div className="space-y-1 mb-3">
                        {order.items?.map((item, i) => (
                            <div key={i} className="text-sm flex justify-between opacity-80">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-mono text-xs">{item.price * item.quantity} Ft</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
                        <span className="text-xs font-medium opacity-60">Végösszeg:</span>
                        <span className="font-bold text-amber-500 font-mono text-lg">{order.total_price} Ft</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function MenuItemCard({ item, onAdd }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-white/70 dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-white/60 dark:border-white/10 flex items-center gap-3 p-3 backdrop-blur-md"
        >
            {/* Image Thumbnail (Small) */}
            <div className="w-20 h-20 shrink-0 bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden relative">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="flex items-center justify-center h-full text-2xl opacity-20">🍽️</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-base leading-tight dark:text-gray-100">{item.name}</h4>
                    <span className="font-mono font-bold text-amber-600 shrink-0 dark:text-amber-500">{item.price.toLocaleString('hu-HU')} Ft</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
            </div>

            {/* Add Button */}
            <button
                onClick={onAdd}
                className="w-10 h-10 shrink-0 bg-white dark:bg-amber-600 text-amber-600 dark:text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform border border-amber-100 dark:border-amber-500"
            >
                <IoAdd className="text-xl font-bold" />
            </button>
        </motion.div>
    )
}



function CartDrawer({ items, total, onClose, onUpdateQty, onRemove, onClear, restaurantId }) {
    const { user } = useAuth(); // Get authenticated user
    const [step, setStep] = useState('cart'); // 'cart' | 'checkout'
    const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-fill form when entering checkout
    useEffect(() => {
        if (step === 'checkout' && user) {
            const fetchUserData = async () => {
                const { data, error } = await supabase
                    .from('koszegpass_users')
                    .select('full_name, phone, address')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setForm(prev => ({
                        ...prev,
                        name: data.full_name || prev.name,
                        phone: data.phone || prev.phone,
                        address: data.address || prev.address
                    }));
                }
            };
            fetchUserData();
        }
    }, [step, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Group items by restaurant
            const ordersByRestaurant = items.reduce((acc, item) => {
                const rId = item.restaurant_id;
                if (!acc[rId]) acc[rId] = [];
                acc[rId].push(item);
                return acc;
            }, {});

            const restaurantIds = Object.keys(ordersByRestaurant);

            // Execute all orders in parallel
            await Promise.all(restaurantIds.map(rId =>
                placeOrder({
                    restaurantId: rId,
                    customer: { ...form, userId: user?.id }, // Attach UserID if logged in
                    cartItems: ordersByRestaurant[rId]
                })
            ));

            const isMultiple = restaurantIds.length > 1;
            toast.success(isMultiple ? `Sikeres rendelés ${restaurantIds.length} helyről! 🍔` : 'Rendelés sikeresen elküldve! 🍔');
            onClear();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba történt a rendeléskor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white/90 dark:bg-[#1a1c2e]/90 backdrop-blur-xl z-[100] shadow-2xl flex flex-col border-l border-white/20"
            >
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold">{step === 'cart' ? 'Kosár tartalma' : 'Megrendelés'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><IoClose className="text-2xl" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <IoBasket className="text-6xl opacity-20" />
                            <p>Üres a kosarad.</p>
                            <button onClick={onClose} className="text-amber-500 font-bold hover:underline">Válassz valamit!</button>
                        </div>
                    ) : (
                        step === 'cart' ? (
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden shrink-0">
                                            {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">{item.name}</h4>
                                            <p className="text-sm text-amber-600 font-mono">{item.price} Ft</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-black/30 rounded-full px-2 py-1 border border-gray-200 dark:border-white/10">
                                            <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-amber-500"><IoRemove /></button>
                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-amber-500"><IoAdd /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Név</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Kovács János"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Telefonszám</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+36 30 123 4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cím</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="Fő tér 1, 2. emelet 3."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                        value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                                        placeholder="A kapucsengő rossz, kérem hívjon..."
                                    />
                                </div>
                            </form>
                        )
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#151618]">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-sm opacity-70">Összesen:</span>
                            <span className="text-2xl font-bold text-amber-500 font-mono">{total.toLocaleString('hu-HU')} Ft</span>
                        </div>
                        {step === 'cart' ? (
                            <button
                                onClick={() => setStep('checkout')}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                Tovább a rendeléshez
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('cart')}
                                    className="px-6 py-4 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 font-bold rounded-xl transition-colors"
                                >
                                    Vissza
                                </button>
                                <button
                                    form="checkout-form"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Küldés...' : 'Rendelés Leadása'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </>
    );
}




