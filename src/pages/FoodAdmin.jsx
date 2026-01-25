import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoRestaurant, IoFastFood, IoSettings, IoLogOut, IoNotifications, IoAddCircle, IoTime, IoPrint, IoSave, IoImage, IoCheckmarkCircle } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function FoodAdmin() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [restaurantId, setRestaurantId] = useState(null);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            navigate('/food-auth', { replace: true });
            return;
        }

        const fetchMyRestaurant = async () => {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (data) {
                setRestaurantId(data.id);
            } else {
                console.error("No restaurant found for this user:", user.id);
                toast.error("Nincs hozzárendelt étterem a fiókodhoz!");
            }
            setVerifying(false);
        };

        fetchMyRestaurant();

    }, [user, loading, navigate]);

    if (loading || verifying) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white animate-pulse">Betöltés...</div>;
    }

    if (!restaurantId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
                <h1 className="text-2xl font-bold mb-4">Nincs étterem társítva!</h1>
                <p className="text-zinc-400 mb-6">Kérlek regisztrálj új éttermet vagy vedd fel a kapcsolatot az adminisztrátorral.</p>
                <button onClick={() => navigate('/food-auth')} className="px-6 py-2 bg-amber-600 rounded-lg font-bold">Vissza a belépéshez</button>
            </div>
        );
    }

    const handleLogout = async () => {
        await logout();
        navigate('/food-auth');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0b0b0c] text-gray-900 dark:text-gray-100 font-sans">
            <FoodAdminDashboard restaurantId={restaurantId} onLogout={handleLogout} />
        </div>
    );
}


function FoodAdminDashboard({ restaurantId, onLogout }) {
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'profile'
    const [restaurantData, setRestaurantData] = useState(null);

    // Fetch basic restaurant data for header
    useEffect(() => {
        if (!restaurantId) return;
        supabase.from('restaurants').select('*').eq('id', restaurantId).single()
            .then(({ data }) => setRestaurantData(data));
    }, [restaurantId]);

    return (
        <div className="flex flex-col h-screen">
            {/* Top Bar */}
            <header className="bg-white dark:bg-[#1a1c2e] border-b border-gray-200 dark:border-white/5 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-lg hidden md:block">
                        {restaurantData?.name || 'Étterem Kezelő'}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${restaurantData?.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {restaurantData?.is_open ? 'Nyitva' : 'Zárva'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onLogout} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                        <IoLogOut className="text-lg" /> <span className="hidden md:inline">Kilépés</span>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Tabs */}
                    <div className="flex justify-center mb-4 gap-2 md:gap-4 overflow-x-auto pb-2">
                        <TabButton id="orders" label="Rendelések" icon={<IoFastFood />} active={activeTab} set={setActiveTab} />
                        <TabButton id="menu" label="Étlap" icon={<IoRestaurant />} active={activeTab} set={setActiveTab} />
                        <TabButton id="profile" label="Beállítások" icon={<IoSettings />} active={activeTab} set={setActiveTab} />
                    </div>



                    <div className="max-w-6xl mx-auto">
                        {activeTab === 'orders' && <OrderList restaurantId={restaurantId} />}
                        {activeTab === 'menu' && <MenuEditor restaurantId={restaurantId} />}
                        {activeTab === 'profile' && <ProfileEditor restaurantId={restaurantId} />}
                    </div>
                </main>
            </div>
        </div>
    );
}

const TabButton = ({ id, label, icon, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`px-4 md:px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 whitespace-nowrap ${active === id ? 'bg-amber-500 text-white shadow-lg scale-105' : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-100'}`}
    >
        {icon} {label}
    </button>
);


// --- 1. ORDERS TAB (WITH PDF) ---
function OrderList({ restaurantId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const playNotification = () => {
        try {
            const audio = new Audio('/sounds/bell.mp3'); // Ensure this file exists or use a robust solution
            audio.play().catch(() => { });
        } catch (e) { }
    };

    useEffect(() => {
        if (!restaurantId) return;

        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, items:order_items(*)`)
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) setOrders(data);
            setLoading(false);
        };

        fetchOrders();

        // Subscribe to Orders
        const channel = supabase
            .channel(`orders-${restaurantId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        playNotification();
                        toast.success('🔔 Új rendelés érkezett!');
                        supabase.from('orders').select(`*, items:order_items(*)`).eq('id', payload.new.id).single()
                            .then(({ data }) => {
                                if (data) setOrders(prev => [data, ...prev]);
                            });
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new, items: o.items } : o));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const handleStatusChange = async (orderId, newStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    };

    // ... printReceipt logic ...
    const printReceipt = (order) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200] // Thermal printer width approx 80mm
            });

            doc.setFontSize(14);
            doc.text('KőszegApp Rendelés', 40, 10, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`#${order.id}`, 40, 16, { align: 'center' });
            doc.text(new Date(order.created_at).toLocaleString('hu-HU'), 40, 22, { align: 'center' });

            doc.line(5, 25, 75, 25);

            // Customer Info
            doc.setFontSize(10);
            doc.text('Vevő:', 5, 32);
            doc.setFont('helvetica', 'bold');
            doc.text(order.customer_name, 5, 37);
            doc.setFont('helvetica', 'normal');
            doc.text(order.customer_phone, 5, 42);
            doc.text(doc.splitTextToSize(order.customer_address, 70), 5, 47);

            if (order.customer_note) {
                doc.setFontSize(8);
                doc.text(`Megj: ${order.customer_note}`, 5, 60);
            }

            let yPos = order.customer_note ? 65 : 55;
            doc.line(5, yPos, 75, yPos);
            yPos += 5;

            // Items
            doc.setFontSize(10);
            order.items.forEach(item => {
                doc.text(`${item.quantity}x`, 5, yPos);
                doc.text(doc.splitTextToSize(item.name, 50), 12, yPos);
                doc.text(`${item.price} Ft`, 75, yPos, { align: 'right' });
                yPos += 6;
                // Add extra space for long names
                if (item.name.length > 25) yPos += 4;
            });

            yPos += 5;
            doc.line(5, yPos, 75, yPos);
            yPos += 7;

            // Total
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('VÉGÖSSZEG:', 5, yPos);
            doc.text(`${order.total_price} Ft`, 75, yPos, { align: 'right' });

            doc.save(`rendeles_${order.id}.pdf`);
            toast.success('Nyomtatás indítva... 🖨️');

        } catch (e) {
            console.error('PDF Error:', e);
            toast.error('Hiba a nyomtatáskor');
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Rendelések betöltése...</div>;

    return (
        <div className="space-y-6">
            <QuickDelivery restaurantId={restaurantId} />

            {orders.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                    <IoFastFood className="text-6xl mb-4 opacity-20" />
                    <p>Nincs aktív rendelés jelenleg.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {orders.map(order => (
                        <div key={order.id} className={`bg-white dark:bg-[#1a1c2e] p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row items-start justify-between gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300 ${order.status === 'new' ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                            {/* ... Order Card Content (Same as before) ... */}
                            <div className="flex-1 w-full">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-0.5 rounded text-xs font-bold font-mono">#{order.id}</span>
                                        <span className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleTimeString()}</span>
                                        {order.status === 'new' && <span className="text-red-500 text-xs font-bold animate-pulse">● ÚJ</span>}
                                    </div>
                                    <div className="md:hidden">
                                        <span className="font-bold">{order.total_price} Ft</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="font-bold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-50 dark:border-white/5 last:border-0 py-1 flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="text-sm font-normal text-gray-500">{item.price * item.quantity} Ft</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                                    <p className="font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                        {order.customer_name}
                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-gray-200">
                                            SZÁLLÍTÁS
                                        </span>
                                    </p>
                                    <p className="font-mono text-base text-gray-800 dark:text-gray-300 my-1">{order.customer_address}</p>
                                    <p className="font-mono text-xs">{order.customer_phone}</p>
                                    {order.customer_note && <p className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-amber-700 dark:text-amber-500 italic">"{order.customer_note}"</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 pt-4 md:pt-0 md:pl-4">
                                <div className="text-right hidden md:block mb-4">
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">{order.total_price?.toLocaleString()} <span className="text-sm font-normal text-gray-500">Ft</span></span>
                                </div>

                                {order.status === 'new' ? (
                                    <>
                                        <button onClick={() => handleStatusChange(order.id, 'accepted')} className="py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg shadow-lg shadow-amber-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"><IoFastFood /> Elfogad</button>
                                        <button onClick={() => handleStatusChange(order.id, 'rejected')} className="py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold rounded-xl text-xs transition-colors text-gray-500">Elutasít</button>
                                    </>
                                ) : (
                                    <>
                                        <div className={`py-3 text-center font-bold rounded-xl border-2 ${order.status === 'accepted' ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/10' : order.status === 'ready' ? 'border-blue-500 text-blue-600' : 'border-red-200 text-red-400'}`}>
                                            {order.status === 'accepted' ? 'Készül...' : order.status === 'ready' ? 'Futárnál' : 'Kézbesítve / Lezárva'}
                                        </div>

                                        {order.status === 'accepted' && (
                                            <button onClick={() => handleStatusChange(order.id, 'ready')} className="py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm shadow-lg transition-transform active:scale-95">Futárnak átadva</button>
                                        )}

                                        {order.status === 'ready' && (
                                            <button onClick={() => handleStatusChange(order.id, 'delivered')} className="py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"><IoCheckmarkCircle className="text-lg" /> Sikeres Kézbesítés</button>
                                        )}

                                        {order.status !== 'rejected' && (
                                            <button
                                                onClick={() => printReceipt(order)}
                                                className="py-2 border-2 border-dashed border-gray-300 hover:border-gray-500 text-gray-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <IoPrint /> Blokk Nyomtatása
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



// --- 2. MENU TAB ---
function MenuEditor({ restaurantId }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!restaurantId) return;
        fetchMenu();
    }, [restaurantId]);

    const fetchMenu = async () => {
        // Fix: Removed alias 'items:' which might cause 400 if PostgREST is strict or confused.
        const { data, error } = await supabase
            .from('menu_categories')
            .select(`*, menu_items(*)`)
            .eq('restaurant_id', restaurantId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error("Menu fetch error:", error);
            toast.error("Hiba a menü betöltésekor");
            return;
        }

        if (data) {
            const sortedData = data.map(cat => ({
                ...cat,
                // Mapping back to 'items' for frontend consistency
                items: (cat.menu_items || []).sort((a, b) => a.id.localeCompare(b.id))
            }));
            setCategories(sortedData);
        }
        setLoading(false);
    };

    const toggleItemAvailability = async (itemId, currentStatus) => {
        const newStatus = !currentStatus;
        setCategories(prev => prev.map(cat => ({
            ...cat,
            items: cat.items.map(item => item.id === itemId ? { ...item, is_available: newStatus } : item)
        })));
        await supabase.from('menu_items').update({ is_available: newStatus }).eq('id', itemId);
    };

    const saveCategory = async (e) => {
        e.preventDefault();
        try {
            let error;
            if (editingCategory) {
                const res = await supabase.from('menu_categories').update({ name: formData.name }).eq('id', editingCategory.id);
                error = res.error;
            } else {
                const res = await supabase.from('menu_categories').insert({
                    restaurant_id: restaurantId,
                    name: formData.name,
                    sort_order: categories.length + 1
                });
                error = res.error;
            }

            if (error) throw error;

            toast.success(editingCategory ? 'Kategória frissítve' : 'Kategória létrehozva');
            setShowCatModal(false);
            fetchMenu();
        } catch (error) {
            console.error(error);
            toast.error('Hiba: ' + error.message);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurantId}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('menu-items')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('menu-items').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const saveItem = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = formData.image_url;

            // Upload image if a file was selected (we'll add file input to state)
            if (formData.imageFile) {
                imageUrl = await uploadImage(formData.imageFile);
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseInt(formData.price),
                image_url: imageUrl
            };

            if (editingItem) {
                await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
                toast.success('Étel frissítve');
            } else {
                await supabase.from('menu_items').insert({
                    ...payload,
                    restaurant_id: restaurantId,
                    category_id: activeCategoryId,
                    is_available: true
                });
                toast.success('Étel hozzáadva');
            }
            setShowItemModal(false);
            fetchMenu();
        } catch (error) {
            console.error(error);
            toast.error('Hiba a mentés során: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // ... (rest of helper functions same as before)
    const openCatModal = (cat = null) => {
        setEditingCategory(cat);
        setFormData(cat ? { name: cat.name } : { name: '' });
        setShowCatModal(true);
    };

    const openItemModal = (catId, item = null) => {
        setActiveCategoryId(catId);
        setEditingItem(item);
        setFormData(item ? {
            name: item.name, description: item.description, price: item.price, image_url: item.image_url, imageFile: null
        } : { name: '', description: '', price: '', image_url: '', imageFile: null });
        setShowItemModal(true);
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Menü betöltése...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-32">
            <QuickDelivery restaurantId={restaurantId} />

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Menü Szerkesztése</h1>
                <button onClick={() => openCatModal()} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                    <IoAddCircle className="text-lg" /> Új Kategória
                </button>
            </div>

            <div className="space-y-8">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white dark:bg-[#151618] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-xl">{cat.name}</h3>
                            <button onClick={() => openCatModal(cat)} className="text-gray-400 hover:text-amber-500 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Szerkeszt</button>
                        </div>
                        <div className="space-y-3">
                            {cat.items?.map(item => (
                                <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${item.is_available ? 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5' : 'bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-white/5 opacity-60 grayscale'}`}>
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden shrink-0">
                                        {item.image_url ?
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><IoImage /></div>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm">{item.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                        <p className="text-xs font-mono font-bold text-amber-600 mt-0.5">{item.price} Ft</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openItemModal(cat.id, item)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><IoSettings /></button>
                                        <button onClick={() => toggleItemAvailability(item.id, item.is_available)} className={`px-2 py-1 rounded text-xs font-bold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                            {item.is_available ? '✓' : 'X'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openItemModal(cat.id)} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 font-bold text-sm hover:border-amber-500 hover:text-amber-500 transition-colors flex items-center justify-center gap-2 group">
                                <IoAddCircle className="group-hover:scale-110 transition-transform" /> Új étel hozzáadása
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {(showCatModal || showItemModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#1e2030] w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{showCatModal ? 'Kategória' : 'Étel'} Szerkesztése</h2>
                        <form onSubmit={showCatModal ? saveCategory : saveItem} className="space-y-4">
                            <input autoFocus placeholder="Elnevezés" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            {!showCatModal && (
                                <>
                                    <textarea rows={2} placeholder="Leírás" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    <input type="number" placeholder="Ár (Ft)" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />

                                    {/* Image Upload UI */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-500">Kép feltöltése</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setFormData({ ...formData, imageFile: e.target.files[0] })}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                        />
                                        <div className="text-center text-xs text-gray-400 uppercase font-bold">- VAGY -</div>
                                        <input placeholder="Kép URL (belső vagy külső link)" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => { setShowCatModal(false); setShowItemModal(false); }} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Mégsem</button>
                                <button disabled={uploading} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 disabled:opacity-50">
                                    {uploading ? 'Feltöltés...' : 'Mentés'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// --- 3. PROFILE SETTINGS TAB ---
function ProfileEditor({ restaurantId }) {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false); // NEW
    const [form, setForm] = useState({
        name: '',
        image_url: '', // NEW
        phone: '',
        address: '',
        description: '',
        news: '',
        promotions: '',
        daily_menu: '',
        opening_hours: '',
        delivery_time: '',
        has_delivery: true,
        min_order_value: 0,
        settings: { show_news: true, show_promotions: true, show_daily_menu: true, show_delivery_time: true }
    });

    useEffect(() => {
        const loadProfile = async () => {
            const { data } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
            if (data) {
                setForm({
                    name: data.name || '',
                    image_url: data.image_url || '', // NEW
                    phone: data.phone || '',
                    address: data.address || '',
                    description: data.description || '',
                    news: data.news || '',
                    promotions: data.promotions || '',
                    daily_menu: data.daily_menu || '',
                    opening_hours: data.opening_hours || '',
                    delivery_time: data.delivery_time || '',
                    has_delivery: data.has_delivery !== undefined ? data.has_delivery : true,
                    min_order_value: data.min_order_value || 0,
                    settings: data.display_settings || { show_news: true, show_promotions: true, show_daily_menu: true, show_delivery_time: true }
                });
            }
            setLoading(false);
        };
        loadProfile();
    }, [restaurantId]);

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${restaurantId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('restaurant-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('restaurant-images').getPublicUrl(filePath);

            setForm(prev => ({ ...prev, image_url: data.publicUrl }));
            toast.success('Kép feltöltve! (Ne felejts el menteni)');
        } catch (error) {
            console.error(error);
            toast.error('Hiba a képfeltöltéskor');
        } finally {
            setUploading(false);
        }
    };

    const save = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('restaurants').update({
            name: form.name,
            image_url: form.image_url, // NEW
            phone: form.phone,
            address: form.address,
            description: form.description,
            news: form.news,
            promotions: form.promotions,
            daily_menu: form.daily_menu,
            opening_hours: form.opening_hours,
            delivery_time: form.delivery_time,
            has_delivery: form.has_delivery,
            min_order_value: form.min_order_value,
            display_settings: form.settings
        }).eq('id', restaurantId);

        if (error) toast.error('Hiba a mentéskor');
        else toast.success('Beállítások mentve! ✅');
    };

    const toggleSetting = (key) => {
        setForm(prev => ({ ...prev, settings: { ...prev.settings, [key]: !prev.settings[key] } }));
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Profil betöltése...</div>;

    return (
        <form onSubmit={save} className="max-w-2xl mx-auto space-y-6 pb-20">
            <QuickDelivery restaurantId={restaurantId} />

            {/* Same Basic Info Section */}
            <div className="bg-white dark:bg-[#151618] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><IoRestaurant /> Alapadatok</h3>
                <div className="grid md:grid-cols-2 gap-4">

                    {/* Image Upload UI */}
                    <div className="md:col-span-2 mb-4">
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Borítókép</label>
                        <div className="relative h-40 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 group">
                            {form.image_url ? (
                                <img src={form.image_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <span className="text-sm">Nincs kép feltöltve</span>
                                </div>
                            )}

                            {/* Overlay & Input */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                                    {uploading ? 'Feltöltés...' : 'Kép cseréje'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            </div>

                            {/* Loading State */}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Étterem Neve</label>
                        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Telefonszám</label>
                        <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Cím</label>
                        <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Rövid leírás (Szlogen)</label>
                        <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#151618] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><IoTime /> Nyitvatartás & Szállítás</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Nyitvatartás (Szöveges)</label>
                        <input className="input-field" placeholder="H-V: 10-22" value={form.opening_hours} onChange={e => setForm({ ...form, opening_hours: e.target.value })} />
                    </div>
                    {/* Delivery Toggle & Time */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold uppercase text-gray-500">Kiszállítás</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-[10px] font-bold uppercase ${form.has_delivery ? 'text-green-500' : 'text-gray-400'}`}>
                                    {form.has_delivery ? 'Van' : 'Nincs'}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={form.has_delivery}
                                    onChange={e => setForm({ ...form, has_delivery: e.target.checked })}
                                    className="w-8 h-4 bg-gray-200 rounded-full appearance-none checked:bg-green-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3 after:h-3 after:rounded-full after:transition-all checked:after:left-4.5 accent-transparent"
                                />
                            </label>
                        </div>
                        {form.has_delivery ? (
                            <input className="input-field" placeholder="30-45 perc" value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} />
                        ) : (
                            <div className="input-field opacity-50 bg-gray-100 dark:bg-white/5 flex items-center gap-2 text-gray-500 text-sm">
                                <IoFastFood /> Csak helyben / Elvitel
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Min. Rendelés (Ft)</label>
                        <input type="number" className="input-field" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#151618] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><IoNotifications /> Hírek, Menük & Akciók</h3>

                <div className="space-y-4">
                    {/* Daily Menu Section - NEW */}
                    <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-orange-700 dark:text-orange-500">Heti / Napi Menü Ajánlat</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Megjelenítés?</span>
                                <input type="checkbox" checked={form.settings.show_daily_menu} onChange={() => toggleSetting('show_daily_menu')} className="w-4 h-4 accent-amber-600" />
                            </div>
                        </div>
                        <textarea rows={3} className="input-field resize-none bg-white font-mono text-sm" placeholder="Hétfő: Bableves, Palacsinta&#10;Kedd: Gulyás, Túrós csusza..." value={form.daily_menu} onChange={e => setForm({ ...form, daily_menu: e.target.value })} />
                        <p className="text-[10px] text-gray-400">Ide írhatod be a gyors napi menü ajánlataidat egyszerű szövegként.</p>
                    </div>

                    {/* News Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-gray-500">Hírek / Újdonságok</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Megjelenítés?</span>
                                <input type="checkbox" checked={form.settings.show_news} onChange={() => toggleSetting('show_news')} className="w-4 h-4 accent-amber-600" />
                            </div>
                        </div>
                        <textarea rows={2} className="input-field resize-none" placeholder="Pl. Megújult étlapunk..." value={form.news} onChange={e => setForm({ ...form, news: e.target.value })} />
                    </div>

                    {/* Promo Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-gray-500">Akciók / Kedvezmények</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Megjelenítés?</span>
                                <input type="checkbox" checked={form.settings.show_promotions} onChange={() => toggleSetting('show_promotions')} className="w-4 h-4 accent-amber-600" />
                            </div>
                        </div>
                        <textarea rows={2} className="input-field resize-none" placeholder="Pl. Minden pizzára 10% kedvezmény..." value={form.promotions} onChange={e => setForm({ ...form, promotions: e.target.value })} />
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg text-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                <IoSave /> Beállítások Mentése
            </button>
            <style jsx>{`
                .input-field {
                    width: 100%;
                    background-color: rgb(249 250 251);
                    border: 1px solid rgb(229 231 235);
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    outline: none;
                    transition: all 200ms;
                }
                .dark .input-field {
                    background-color: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    color: white;
                }
                .input-field:focus {
                    border-color: #d97706;
                    box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
                }
            `}</style>
        </form>
    );
}

// --- REUSABLE QUICK DELIVERY COMPONENT ---
function QuickDelivery({ restaurantId }) {
    const [time, setTime] = useState('-');

    useEffect(() => {
        if (!restaurantId) return;
        supabase.from('restaurants').select('delivery_time').eq('id', restaurantId).single()
            .then(({ data }) => setTime(data?.delivery_time || '-'));
    }, [restaurantId]);

    const handleSet = (val) => {
        const newVal = val.replace('p', 'perc');
        setTime(newVal);
        supabase.from('restaurants').update({ delivery_time: newVal }).eq('id', restaurantId)
            .then(() => toast.success(`Idő: ${newVal}`, { icon: '⏱️' }));
    };

    return (
        <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-white p-2 rounded-lg">
                    <IoTime className="text-xl" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase">Kiszállítási Idő</h3>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{time}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                {["15 p", "30 p", "45 p", "60 p", "60+ p"].map(opt => (
                    <button
                        key={opt}
                        onClick={() => handleSet(opt)}
                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-sm border ${time === opt.replace('p', 'perc')
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-white/5 hover:bg-gray-50'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
