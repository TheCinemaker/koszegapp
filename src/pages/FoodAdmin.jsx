import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoRestaurant, IoFastFood, IoSettings, IoLogOut, IoNotifications, IoAddCircle, IoTime, IoPrint, IoSave, IoImage, IoCheckmarkCircle, IoStatsChart, IoInformationCircle, IoClose, IoStorefront } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Windows 98 UI Constants (Repurposed for Modern UI)
const WIN98 = {
    bg: 'bg-gray-50 dark:bg-zinc-950',
    windowBg: 'bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10',
    text: 'text-gray-900 dark:text-white font-sans',
    borderOutset: 'border border-gray-200 dark:border-white/10 shadow-sm rounded-2xl',
    borderInset: 'bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 rounded-xl',
    titleBar: 'bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 text-gray-900 dark:text-white font-bold px-4 py-3 flex justify-between items-center select-none rounded-t-2xl',
    btn: 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-zinc-700 active:scale-95 text-gray-900 dark:text-white font-medium px-4 py-1.5 text-sm rounded-xl shadow-sm transition-all outline-none flex items-center justify-center gap-1.5',
};

// Helper function to translate status to Hungarian
const getStatusText = (status) => {
    const map = {
        'new': 'ÚJ KÉRÉS!',
        'pending': 'Függőben',
        'accepted': 'Elfogadva',
        'preparing': 'Készül',
        'ready': 'Kész',
        'delivered': 'Kézbesítve',
        'rejected': 'Elutasítva',
        'cancelled': 'Törölve'
    };
    return map[status] || status;
};


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
        return (
            <div className={`min-h-screen ${WIN98.bg} flex items-center justify-center`}>
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-4`}>
                    <p className="font-bold">Rendszer indítása...</p>
                </div>
            </div>
        );
    }

    if (!restaurantId) {
        return (
            <div className={`min-h-screen ${WIN98.bg} flex items-center justify-center`}>
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-96 flex flex-col`}>
                    <div className={WIN98.titleBar}>
                        <span>Hiba</span>
                        <button onClick={() => navigate('/food-auth')} className={`${WIN98.btn} ${WIN98.borderOutset} w-5 h-5 flex items-center justify-center leading-none pb-1`}>x</button>
                    </div>
                    <div className="p-4 flex gap-4 items-center">
                        <div className="text-red-600 text-4xl">❌</div>
                        <div>
                            <p className="mb-4">Nincs étterem társítva a fiókhoz.</p>
                            <button onClick={() => navigate('/food-auth')} className={`${WIN98.btn} ${WIN98.borderOutset} w-full`}>Vissza a belépéshez</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await logout();
        navigate('/food-auth');
    };

    return (
        <div className={`min-h-screen ${WIN98.bg} p-2 md:p-6 overflow-hidden flex flex-col font-sans`}>
            <FoodAdminDashboard restaurantId={restaurantId} onLogout={handleLogout} />
        </div>
    );
}


function FoodAdminDashboard({ restaurantId, onLogout }) {
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'profile'
    const [restaurantData, setRestaurantData] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    // Fetch basic restaurant data for header
    useEffect(() => {
        if (!restaurantId) return;
        supabase.from('restaurants').select('*').eq('id', restaurantId).single()
            .then(({ data }) => setRestaurantData(data));
    }, [restaurantId]);

    return (
        <div className={`flex-1 flex flex-col ${WIN98.windowBg} ${WIN98.borderOutset} p-0.5`}>
            {/* Title Bar */}
            <div className={WIN98.titleBar}>
                <div className="flex items-center gap-2">
                    <IoStorefront className="text-xl text-amber-500" />
                    <span className="tracking-wide">FoodManager - {restaurantData?.name || 'Betöltés...'}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onLogout} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><IoClose size={20} /></button>
                </div>
            </div>

            {/* Menu Bar / Toolbar */}
            <div className="flex gap-4 px-4 py-2 border-b border-gray-100 dark:border-white/5 shadow-sm text-sm mb-1 bg-white dark:bg-zinc-900">
                <button onClick={() => setShowHelp(true)} className="cursor-pointer hover:text-amber-500 transition-colors font-medium text-gray-600 dark:text-gray-300">Súgó</button>
                <span className="ml-auto text-gray-500 dark:text-gray-400 font-medium">{new Date().toLocaleDateString('hu-HU')}</span>
            </div>

            {/* Content Area with Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col p-2">

                {/* Tabs */}
                <div className="flex items-end pl-2 gap-0.5 relative z-10 -mb-[2px]">
                    <TabButton id="orders" label="Rendelések" active={activeTab} set={setActiveTab} />
                    <TabButton id="menu" label="Étlap" active={activeTab} set={setActiveTab} />
                    <TabButton id="marketing" label="⚡ Marketing" active={activeTab} set={setActiveTab} />
                    <TabButton id="search" label="Keresés" active={activeTab} set={setActiveTab} />
                    <TabButton id="stats" label="Kimutatások" active={activeTab} set={setActiveTab} />
                    <TabButton id="profile" label="Beállítások" active={activeTab} set={setActiveTab} />
                </div>

                {/* Main Panel */}
                <main className={`flex-1 overflow-y-auto ${WIN98.borderOutset} bg-white dark:bg-zinc-950 p-4 sm:p-6 relative rounded-2xl`}>
                    <div className="max-w-full mx-auto">
                        {activeTab === 'orders' && <OrderList restaurantId={restaurantId} restaurantName={restaurantData?.name} />}
                        {activeTab === 'menu' && (
                            <MenuEditor 
                                restaurantId={restaurantId} 
                                restData={restaurantData} 
                                updateRestField={async (field, value) => {
                                    const { error } = await supabase.from('restaurants').update({ [field]: value }).eq('id', restaurantId);
                                    if (error) toast.error("Hiba a mentéskor");
                                    else {
                                        setRestaurantData(prev => ({ ...prev, [field]: value }));
                                    }
                                }} 
                            />
                        )}
                        {activeTab === 'marketing' && <MarketingPanel restaurantId={restaurantId} />}
                        {activeTab === 'search' && <SearchPanel restaurantId={restaurantId} />}
                        {activeTab === 'stats' && <SalesSummary restaurantId={restaurantId} />}
                        {activeTab === 'profile' && <ProfileEditor restaurantId={restaurantId} />}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <div className={`h-10 border-t border-gray-200 dark:border-white/5 flex items-center px-4 text-xs gap-4 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 rounded-b-2xl font-medium`}>
                <span className="w-32 truncate border-r border-gray-300 dark:border-white/10 pr-4">Állapot: {restaurantData?.is_open ? 'Nyitva 🟢' : 'Zárva 🔴'}</span>
                <span className="flex-1 truncate">Rendszer: Aktív</span>
                <span className="border-l border-gray-300 dark:border-white/10 pl-4">v5.0.0</span>
            </div>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
}

const TabButton = ({ id, label, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`
            px-5 py-2.5 rounded-t-xl text-sm font-bold tracking-wide transition-colors
            border-b-0
            ${active === id
                ? 'bg-white dark:bg-zinc-950 text-amber-500 z-20 pb-3 -mb-1 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] border-t border-l border-r border-gray-200 dark:border-white/10'
                : 'bg-gray-100 dark:bg-zinc-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 mb-0 border-t border-l border-r border-transparent'
            }
        `}
    >
        {label}
    </button>
);


// --- 1. ORDERS TAB (WITH PDF) ---
function OrderList({ restaurantId, restaurantName }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const playNotification = () => {
        try {
            const audio = new Audio('/sounds/bell.mp3');
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

            if (!error && data) {
                console.log('📦 Orders loaded:', data);
                console.log('📦 First order items:', data[0]?.items);
                setOrders(data);
            }
            setLoading(false);
        };

        fetchOrders();

        console.log('🔌 Setting up realtime subscription for restaurant:', restaurantId);

        const channel = supabase
            .channel(`orders-${restaurantId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                (payload) => {
                    console.log('🔔 Realtime event received:', payload.eventType, payload);
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
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status);
            });

        return () => {
            console.log('🔌 Cleaning up realtime subscription');
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const handleStatusChange = async (orderId, newStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    };

    const printReceipt = (order) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200]
            });

            // Helper for jsPDF Latin-1 encoding limits (ő -> ö, ű -> ü)
            const normalizeText = (text) => {
                if (!text) return '';
                return text.toString()
                    .replace(/ő/g, 'ö').replace(/Ő/g, 'Ö')
                    .replace(/ű/g, 'ü').replace(/Ű/g, 'Ü');
            };

            const shortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'ISMERETLEN';

            doc.setFontSize(14);
            doc.text(normalizeText('KöszegEats Rendelésed'), 40, 10, { align: 'center' });

            doc.setFontSize(10);
            if (restaurantName) {
                doc.text(normalizeText(restaurantName), 40, 15, { align: 'center' });
            }
            doc.text(`#${shortId}`, 40, 20, { align: 'center' });
            doc.text(new Date(order.created_at).toLocaleString('hu-HU'), 40, 26, { align: 'center' });

            doc.line(5, 29, 75, 29);

            // Customer Info
            doc.setFontSize(10);
            doc.text(normalizeText('Vevő:'), 5, 32);
            doc.setFont('helvetica', 'bold');
            doc.text(normalizeText(order.customer_name), 5, 37);
            doc.setFont('helvetica', 'normal');
            doc.text(normalizeText(order.customer_phone), 5, 42);

            const splitAddress = doc.splitTextToSize(normalizeText(order.customer_address), 70);
            doc.text(splitAddress, 5, 47);

            let yPos = 47 + (splitAddress.length * 5);

            if (order.customer_note) {
                yPos += 2;
                doc.setFontSize(8);
                const splitNote = doc.splitTextToSize(`Megj: ${normalizeText(order.customer_note)}`, 70);
                doc.text(splitNote, 5, yPos);
                yPos += (splitNote.length * 4);
            }

            yPos += 2;
            doc.line(5, yPos, 75, yPos);
            yPos += 6;

            // Items
            doc.setFontSize(10);
            order.items.forEach(item => {
                doc.text(`${item.quantity}x`, 5, yPos);

                const splitName = doc.splitTextToSize(normalizeText(item.name), 40);
                doc.text(splitName, 15, yPos);

                doc.text(`${item.price} Ft`, 75, yPos, { align: 'right' });

                yPos += (splitName.length * 5) + 2;
            });

            doc.line(5, yPos, 75, yPos);
            yPos += 7;

            // Total
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(normalizeText('VÉGÖSSZEG:'), 5, yPos);
            doc.text(`${order.total_price} Ft`, 75, yPos, { align: 'right' });

            yPos += 10;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(normalizeText('Számlát nem helyettesitö bizonylat'), 40, yPos, { align: 'center' });

            doc.save(`rendeles_${shortId}.pdf`);
            toast.success('Nyomtatás indítva... 🖨️');

        } catch (e) {
            console.error('PDF Error:', e);
            toast.error('Hiba a nyomtatáskor');
        }
    };

    if (loading) return (
        <div className="bg-white border-2 border-inset p-4 text-center">Adatok betöltése...</div>
    );

    return (
        <div className="space-y-4">
            <QuickDelivery restaurantId={restaurantId} />

            <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl h-[600px] overflow-auto shadow-sm`}>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-zinc-800 sticky top-0 z-10">
                        <tr>
                            {['Időpont', 'Vevő Neve', 'Cím', 'Tételek', 'Összeg', 'Státusz', 'Műveletek'].map(head => (
                                <th key={head} className={`p-3 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 select-none uppercase tracking-wider`}>
                                    <div className="px-1">{head}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 text-sm">
                        {orders.map(order => (
                            <tr
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`
                                    border-b border-gray-200 dark:border-white/5 group cursor-pointer
                                    ${order.status === 'new'
                                        ? 'bg-amber-400 dark:bg-amber-500/80 text-black font-bold'
                                        : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 hover:bg-blue-600 dark:hover:bg-blue-900 hover:text-white'
                                    }
                                `}
                            >
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'}`}>{new Date(order.created_at).toLocaleTimeString()}</td>
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'} font-bold`}>{order.customer_name}</td>
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'} text-xs truncate max-w-[150px] opacity-70`} title={order.customer_address}>{order.customer_address}</td>
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'} text-xs italic opacity-80`}>
                                    {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    {order.customer_note && <span className={`font-bold ml-1 ${order.status === 'new' ? 'text-amber-900' : 'text-red-500 dark:text-red-400'}`}> (! {order.customer_note})</span>}
                                </td>
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'} text-right font-medium`}>{order.total_price} Ft</td>
                                <td className={`p-4 border-b ${order.status === 'new' ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-white/5'} text-center`}>
                                    <span className={`px-2 py-1 rounded-md text-xs uppercase font-bold 
                                        ${order.status === 'new' ? 'bg-amber-600 text-white shadow-sm' :
                                            order.status === 'accepted' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30' :
                                                order.status === 'ready' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' : 'bg-green-100 text-green-800 dark:bg-green-900/30'}
                                     `}>
                                        {getStatusText(order.status)}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-gray-100 dark:border-white/5 flex gap-2 justify-center">
                                    {order.status === 'new' ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'accepted'); }} className={`${WIN98.btn}`}>Ok</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'rejected'); }} className={`${WIN98.btn}`}>Nem</button>
                                        </>
                                    ) : (
                                        <>
                                            {order.status === 'accepted' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'ready'); }} className={`${WIN98.btn}`}>Futár</button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'delivered'); }} className={`${WIN98.btn}`}>Kész</button>
                                            )}
                                        </>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); printReceipt(order); }} className={`${WIN98.btn} px-2`} title="Nyomtatás"><IoPrint size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">Nincs megjeleníthető rendelés.</div>
                )}
            </div>

            <div className="flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>{orders.length} aktív objektum</span>
                <span className="flex items-center gap-1"><IoCheckmarkCircle className="text-green-500" /> Rendszer Szinkronizálva</span>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusChange={handleStatusChange}
                    onPrint={printReceipt}
                />
            )}
        </div>

    );
}



// --- 2. MENU TAB ---
function MenuEditor({ restaurantId, restData, updateRestField }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [showFlashModal, setShowFlashModal] = useState(false);
    const [flashItem, setFlashItem] = useState(null);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [formData, setFormData] = useState({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!restaurantId) return;
        fetchMenu();
    }, [restaurantId]);

    const fetchMenu = async () => {
        setLoading(true);
        let query = supabase
            .from('menu_categories')
            .select(`
                *,
                menu_items (*)
            `)
            .eq('restaurant_id', restaurantId);

        let { data, error } = await query.order('sort_order', { ascending: true });

        if (error && error.code === '42703') {
            // Fallback: fetch without sort_order
            const { data: fallbackData, error: fbError } = await query;
            if (fbError) throw fbError;
            data = fallbackData;
        } else if (error) {
            throw error;
        }

        if (data) {
            const sortedData = data.map(cat => ({
                ...cat,
                items: (cat.menu_items || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            }));
            const finalSortedData = [...sortedData].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            setCategories(finalSortedData);
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
        toast.success(newStatus ? 'Étel elérhető' : 'Étel ELFOGYOTT', { icon: newStatus ? '✅' : '🚫' });
    };

    const updateRestSetting = async (key, value) => {
        const newSettings = { ...restData.display_settings, [key]: value };
        updateRestField('display_settings', newSettings);
    };

    const days = [{ id: 1, label: 'Hétfő' }, { id: 2, label: 'Kedd' }, { id: 3, label: 'Szerda' }, { id: 4, label: 'Csütörtök' }, { id: 5, label: 'Péntek' }, { id: 6, label: 'Szombat' }, { id: 0, label: 'Vasárnap' }];

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
        const fileName = `${restaurantId}/${crypto.randomUUID()}.${fileExt}`;
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

    const handleMoveCategory = async (catId, direction) => {
        const catIndex = categories.findIndex(c => c.id === catId);
        if (catIndex < 0) return;
        const targetIndex = catIndex + direction;
        if (targetIndex < 0 || targetIndex >= categories.length) return;
        
        const newCats = [...categories];
        const temp = newCats[catIndex];
        newCats[catIndex] = newCats[targetIndex];
        newCats[targetIndex] = temp;
        
        newCats.forEach((c, idx) => c.sort_order = idx);
        setCategories(newCats);
        
        try {
            const updates = newCats.map(c => ({ 
                id: c.id, 
                name: c.name, // Added mandatory field
                sort_order: c.sort_order,
                restaurant_id: restaurantId 
            }));
            const { error } = await supabase.from('menu_categories').upsert(updates);
            if (error) throw error;
            toast.success("Kategória sorrend mentve", { icon: '🔄' });
        } catch (err) {
            console.error(err);
            toast.error("Hiba a mentés során: " + (err.message || 'Ismeretlen hiba'));
        }
    };

    const handleMoveItem = async (catId, itemId, direction) => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;
        const items = [...cat.items];
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex < 0) return;
        const targetIndex = itemIndex + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        
        const temp = items[itemIndex];
        items[itemIndex] = items[targetIndex];
        items[targetIndex] = temp;
        
        items.forEach((it, idx) => it.sort_order = idx);
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, items } : c));
        
        try {
            const updates = items.map(it => ({ 
                id: it.id, 
                name: it.name, // Added mandatory field
                price: it.price, // Added mandatory field
                category_id: it.category_id, // Added mandatory field
                sort_order: it.sort_order,
                restaurant_id: restaurantId 
            }));
            const { error } = await supabase.from('menu_items').upsert(updates);
            if (error) throw error;
            toast.success("Étel sorrend mentve", { icon: '🔄' });
        } catch (err) {
            console.error(err);
            toast.error("Hiba a mentés során: " + (err.message || 'Ismeretlen hiba'));
        }
    };

    if (loading) return <div className="p-10 text-center text-sm">Könyvtárak beolvasása...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-32">
            <QuickDelivery restaurantId={restaurantId} />

            {/* QUICK NEWS & MENU ACCESS (Moved from Profile) */}
            {restData && (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-4 sm:p-5 rounded-2xl shadow-sm mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4 bg-gray-50 dark:bg-white/5 py-2 px-3 rounded-xl"><IoStorefront className="text-amber-500" /> Sürgős Módosítások (Hírek & Napi Ajánlat)</h3>
                    <div className="space-y-4">
                        
                        {/* Daily Menu Visibility & Pricing */}
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${restData.display_settings?.show_daily_menu ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-white/10'}`}>
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="show_daily" 
                                    checked={restData.display_settings?.show_daily_menu} 
                                    onChange={e => updateRestSetting('show_daily_menu', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                                <label htmlFor="show_daily" className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase cursor-pointer">Napi Menü Engedélyezése</label>
                            </div>

                            {restData.display_settings?.show_daily_menu && (
                                <div className="flex items-center gap-3 border-l border-gray-300 dark:border-white/10 pl-3">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold uppercase">Látható:</span>
                                        <input 
                                            type="time" 
                                            className={`w-20 ${WIN98.borderInset} px-1 text-[10px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100`}
                                            value={restData.display_settings?.daily_menu_start || '11:00'} 
                                            onChange={e => updateRestSetting('daily_menu_start', e.target.value)}
                                        />
                                        <span className="text-[10px] text-gray-400">-</span>
                                        <input 
                                            type="time" 
                                            className={`w-20 ${WIN98.borderInset} px-1 text-[10px] bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100`}
                                            value={restData.display_settings?.daily_menu_end || '14:00'} 
                                            onChange={e => updateRestSetting('daily_menu_end', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <IoTime className="text-amber-600 animate-pulse" />
                                        <span className="text-[9px] text-zinc-500 italic leading-none">
                                            {(() => {
                                                const now = new Date();
                                                const current = now.getHours() * 60 + now.getMinutes();
                                                const [sh, sm] = (restData.display_settings?.daily_menu_start || '11:00').split(':').map(Number);
                                                const [eh, em] = (restData.display_settings?.daily_menu_end || '14:00').split(':').map(Number);
                                                const start = sh * 60 + sm;
                                                const end = eh * 60 + em;
                                                return (current >= start && current <= end) 
                                                    ? '✅ Jelenleg látható a vendégeknek' 
                                                    : '💤 Jelenleg rejtve van (időn kívül)';
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {restData.display_settings?.show_daily_menu && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 dark:text-gray-400">Teljes ár (Leves + Főétel):</span>
                                        <input 
                                            type="number" 
                                            placeholder="pl. 2200"
                                            className={`w-20 ${WIN98.borderInset} px-1 text-xs text-gray-900 dark:text-gray-100`} 
                                            value={restData.display_settings?.daily_menu_price || ''} 
                                            onChange={e => updateRestSetting('daily_menu_price', e.target.value)}
                                        />
                                        <span className="text-[10px] text-gray-400">Ft</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 dark:text-gray-400">Leves nélkül:</span>
                                        <input 
                                            type="number" 
                                            placeholder="pl. 1800"
                                            className={`w-20 ${WIN98.borderInset} px-1 text-xs text-gray-900 dark:text-gray-100`} 
                                            value={restData.display_settings?.daily_menu_no_soup_price || ''} 
                                            onChange={e => updateRestSetting('daily_menu_no_soup_price', e.target.value)}
                                        />
                                        <span className="text-[10px] text-gray-400">Ft</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const demo = {
                                                "2": { "soup": "Jókai bableves", "A": "Rántott szelet petrezselymes burgonyával", "B": "Bakonyi sertésborda nokedlivel", "C": "Spenót főzelék tükörtojással", "soldOutB": true },
                                                "3": { "soup": "Újházi tyúkhúsleves", "A": "Vadas marhasült zsemlegombóccal", "B": "Brassói aprópecsenye sült krumplival", "C": "Mákos guba vanília öntettel" },
                                                "4": { "soup": "Görög gyümölcsleves", "A": "Cigánypecsenye kakastaréjjal", "B": "Töltött paprika paradicsommártásban", "C": "Grillezett camembert áfonyával" }
                                            };
                                            updateRestField('daily_menu', JSON.stringify(demo));
                                            if (!restData.display_settings?.daily_menu_price) {
                                                updateRestSetting('daily_menu_price', '2200');
                                                updateRestSetting('daily_menu_no_soup_price', '1800');
                                            }
                                        }}
                                        className={`${WIN98.btn} px-2 py-0.5 text-[9px] bg-amber-100 hover:bg-amber-200 ml-auto`}
                                    >
                                        🧪 TESZT ADATOK BETÖLTÉSE
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Daily Menu Section */}
                        {restData.display_settings?.show_daily_menu && (
                            <div className={`p-2 ${WIN98.borderInset} ${restData.is_daily_menu_available ? 'bg-blue-50' : 'bg-red-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase flex items-center gap-1"><IoRestaurant /> Napi Menü Szerkesztő (A/B/C)</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => updateRestSetting('is_daily_menu_available', !restData.display_settings?.is_daily_menu_available)}
                                            className={`${WIN98.btn} px-3 py-1 text-[10px] font-bold ${restData.display_settings?.is_daily_menu_available !== false ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                                        >
                                            {restData.display_settings?.is_daily_menu_available !== false ? 'Minden elérhető' : 'Összes elfogyott'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {days.map(day => {
                                        const wm = (() => {
                                            if (!restData.daily_menu) return {};
                                            try {
                                                const o = JSON.parse(restData.daily_menu);
                                                return (typeof o === 'object' && o !== null) ? o : {};
                                            } catch { return {}; }
                                        })();
                                        const dayData = wm[day.id] || { soup: '', A: '', B: '', C: '', soldOutA: false, soldOutB: false, soldOutC: false };
                                        
                                        const updateDay = (field, val) => {
                                            const nw = { ...wm, [day.id]: { ...dayData, [field]: val } };
                                            updateRestField('daily_menu', JSON.stringify(nw));
                                        };

                                        return (
                                            <div key={day.id} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm mb-4">
                                                <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-white/5 pb-2">
                                                        <span className="font-black text-amber-500 uppercase tracking-widest w-24">{day.label}</span>
                                                        <input 
                                                            placeholder="Leves neve..." 
                                                            className={`flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700 focus:border-amber-500 outline-none transition-colors text-gray-900 dark:text-gray-100`} 
                                                            value={dayData.soup || ''} 
                                                            onChange={e => updateDay('soup', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {['A', 'B', 'C'].map(m => (
                                                            <div key={m} className={`p-2 rounded-xl border ${dayData[`soldOut${m}`] ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/5 shadow-sm'}`}>
                                                                <div className="flex items-center justify-between mb-2 px-1">
                                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{m} menü</span>
                                                                    <button 
                                                                        onClick={() => updateDay(`soldOut${m}`, !dayData[`soldOut${m}`])}
                                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${dayData[`soldOut${m}`] ? 'bg-red-500 text-white border-red-600' : 'bg-green-500 text-white border-green-600'}`}
                                                                    >
                                                                        {dayData[`soldOut${m}`] ? 'ELFOGYOTT' : 'VAN'}
                                                                    </button>
                                                                </div>
                                                                <textarea 
                                                                    rows={2} 
                                                                    className={`w-full rounded-lg border px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-700 transition-colors resize-none ${dayData[`soldOut${m}`] ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-white/10'} text-gray-900 dark:text-gray-100`} 
                                                                    value={dayData[m] || ''} 
                                                                    onChange={e => updateDay(m, e.target.value)}
                                                                    placeholder={`${m} menü főétel...`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${restData.display_settings?.is_constant_menu_available !== false ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold flex items-center gap-1 text-gray-800 dark:text-white">Állandó (A/B) Menü</span>
                                            <button 
                                            onClick={() => updateRestSetting('is_constant_menu_available', !restData.display_settings?.is_constant_menu_available)}
                                            className={`${WIN98.btn} ${restData.display_settings?.is_constant_menu_available !== false ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'}`}
                                        >
                                            {restData.display_settings?.is_constant_menu_available !== false ? 'ELÉRHETŐ 🟢' : 'ELFOGYOTT 🔴'}
                                        </button>
                                    </div>
                                    <textarea 
                                        className="w-full text-sm p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 focus:bg-gray-50 dark:focus:bg-zinc-700 transition-colors min-h-[60px]" 
                                        rows={2} 
                                        value={restData.promotions || ''} 
                                        onChange={e => updateRestField('promotions', e.target.value)}
                                        placeholder="Akció vagy üzenet a vendégeknek..."
                                    />
                                </div>

                                <div className={`p-4 rounded-xl border bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-white/10`}>
                                    <span className="font-bold mb-3 block text-gray-800 dark:text-white flex items-center gap-2"><IoNotifications className="text-amber-500" />Hírek / Közlemény</span>
                                    <textarea 
                                        className="w-full text-sm p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 focus:bg-gray-50 dark:focus:bg-zinc-700 transition-colors min-h-[60px]" 
                                        rows={2} 
                                        value={restData.news || ''} 
                                        onChange={e => updateRestField('news', e.target.value)}
                                        placeholder="Friss hír vagy változás..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            
            <div className={`flex items-center justify-between mb-2 p-1 ${WIN98.borderInset} bg-white`}>
                <span className="font-bold px-2">Helyi meghajtó (C:) \ Étlap</span>
                <button onClick={() => openCatModal()} className={`${WIN98.btn} text-xs`}>
                    Új Mappa (Kategória)
                </button>
            </div>

            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat.id} className={`${WIN98.windowBg} ${WIN98.borderOutset} mb-6 overflow-hidden`}>
                        <div className={`${WIN98.titleBar} mx-0 mb-0`}>
                            <span className="flex items-center gap-2"><span className="text-xl">📁</span> {cat.name}</span>
                            <div className="flex gap-1 items-center">
                                <button onClick={() => handleMoveCategory(cat.id, -1)} className="text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-zinc-800 w-7 h-7 flex items-center justify-center rounded-lg transition-colors font-bold" title="Mozgatás fel">↑</button>
                                <button onClick={() => handleMoveCategory(cat.id, 1)} className="text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-zinc-800 w-7 h-7 flex items-center justify-center rounded-lg transition-colors font-bold" title="Mozgatás le">↓</button>
                                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1"></div>
                                <button onClick={() => openCatModal(cat)} className="text-gray-500 hover:text-amber-500 text-xs px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors font-medium">Szerkesztés</button>
                            </div>
                        </div>

                        <div className={`bg-white dark:bg-zinc-950 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-b-2xl`}>
                            {cat.items?.map(item => (
                                <div key={item.id} className={`flex items-start gap-2 p-1 border border-dotted border-gray-400 ${!item.is_available ? 'opacity-50 grayscale' : ''}`}>
                                    <div className={`w-10 h-10 ${WIN98.borderInset} shrink-0 bg-gray-200 overflow-hidden`}>
                                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs truncate text-gray-900 dark:text-gray-100">{item.name}</h4>
                                        <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{item.price} Ft</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleMoveItem(cat.id, item.id, -1)}
                                                className="text-gray-400 hover:text-amber-500 w-5 h-5 flex items-center justify-center rounded bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 transition-colors font-bold text-[10px]" 
                                                title="Fel"
                                            >↑</button>
                                            <button 
                                                onClick={() => handleMoveItem(cat.id, item.id, 1)}
                                                className="text-gray-400 hover:text-amber-500 w-5 h-5 flex items-center justify-center rounded bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 transition-colors font-bold text-[10px]" 
                                                title="Le"
                                            >↓</button>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5"></div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFlashItem(item);
                                                    setShowFlashModal(true);
                                                }}
                                                className={`${WIN98.btn} py-0.5 px-1 text-[9px] flex items-center gap-1 ${restData.flash_sale?.items?.[item.id] ? 'bg-orange-200 border-orange-400 font-bold' : ''}`}
                                            >
                                                🔥 {restData.flash_sale?.items?.[item.id] ? 'AKCIÓS' : 'FLASH'}
                                            </button>
                                            <button onClick={() => openItemModal(cat.id, item)} className={`${WIN98.btn} py-0 px-1 text-[10px]`}>✏️</button>
                                        </div>
                                        <button 
                                            onClick={() => toggleItemAvailability(item.id, item.is_available)} 
                                            className={`${WIN98.btn} py-1 px-2 text-[10px] font-bold leading-tight ${item.is_available ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'}`}
                                        >
                                            {item.is_available ? 'ELÉRHETŐ' : 'ELFOGYOTT'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openItemModal(cat.id)} className="w-full h-[72px] rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-amber-500 transition-all hover:border-amber-500">
                                + Új Fájl Hozzáadása
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {(showCatModal || showItemModal) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-transparent pointer-events-auto" />
                    <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-full max-w-sm pointer-events-auto shadow-xl relative z-10`}>
                        <div className={WIN98.titleBar}>
                            <span>{showCatModal ? 'Kategória Tulajdonságok' : 'Fájl Tulajdonságok'}</span>
                            <button onClick={() => { setShowCatModal(false); setShowItemModal(false); }} className={`${WIN98.btn} w-4 h-4 flex items-center justify-center leading-none pb-1`}>x</button>
                        </div>
                        <form onSubmit={showCatModal ? saveCategory : saveItem} className="p-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-black">Név:</label>
                                <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} autoFocus value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            {!showCatModal && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs text-black">Leírás:</label>
                                        <textarea rows={2} className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-black">Ár (HUF):</label>
                                        <input type="number" className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                    </div>

                                    {/* Retro Image Upload */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-black">Kép forrása:</label>
                                        <div className="flex gap-1">
                                            <input className={`flex-1 ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none`} value={formData.imageFile ? formData.imageFile.name : (formData.image_url || '')} readOnly />
                                            <label className={`${WIN98.btn} cursor-pointer`}>
                                                Tallózás...
                                                <input type="file" accept="image/*" className="hidden" onChange={e => setFormData({ ...formData, imageFile: e.target.files[0] })} />
                                            </label>
                                        </div>
                                        <div className="text-[10px] text-black">Vagy add meg az URL-t kézzel:</div>
                                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none`} value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => { setShowCatModal(false); setShowItemModal(false); }} className={`${WIN98.btn} min-w-[70px]`}>Mégsem</button>
                                <button disabled={uploading} className={`${WIN98.btn} min-w-[70px] border border-black font-bold`}>
                                    {uploading ? 'Mentés...' : 'Alkalmaz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FLASH RULE MODAL */}
            {showFlashModal && flashItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
                    <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-full max-w-sm p-1 shadow-2xl`}>
                        <div className={WIN98.titleBar}>
                            <span>🔥 Flash Akció: {flashItem.name}</span>
                            <button onClick={() => setShowFlashModal(false)} className={`${WIN98.btn} px-2 py-0`}>x</button>
                        </div>
                        <div className={`p-4 ${WIN98.borderInset} bg-white space-y-4`}>
                            {!restData?.flash_sale?.active && (
                                <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold">
                                    ⚠️ FIGYELEM: A Flash Sale globálisan NINCS AKTIVÁLVA a Marketing fülön! 
                                    Az itt beállított szabályok csak akkor jelennek meg a vendégeknek, ha ott is bekapcsolod.
                                </div>
                            )}
                            <p className="text-xs text-gray-500 italic">Válassz akció típust ehhez a termékhez:</p>
                            
                            <div className="space-y-3">
                                {/* Type: PERCENT */}
                                <div className={`p-2 border ${restData.flash_sale?.items?.[flashItem.id]?.type === 'percent' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'} rounded-lg`}>
                                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                                        <input 
                                            type="radio" 
                                            name="flashType" 
                                            checked={restData.flash_sale?.items?.[flashItem.id]?.type === 'percent'} 
                                            onChange={() => {
                                                const items = { ...restData.flash_sale?.items, [flashItem.id]: { type: 'percent', value: 20 } };
                                                updateRestField('flash_sale', { ...restData.flash_sale, items });
                                            }}
                                        />
                                        <span className="text-xs font-bold">Százalékos kedvezmény (%)</span>
                                    </label>
                                    {restData.flash_sale?.items?.[flashItem.id]?.type === 'percent' && (
                                        <div className="flex items-center gap-2 ml-5">
                                            <input 
                                                type="number" 
                                                className={`w-16 ${WIN98.borderInset} px-2 py-0.5 text-xs`}
                                                value={restData.flash_sale?.items?.[flashItem.id]?.value || 0}
                                                onChange={(e) => {
                                                    const items = { ...restData.flash_sale?.items, [flashItem.id]: { ...restData.flash_sale.items[flashItem.id], value: parseInt(e.target.value) } };
                                                    updateRestField('flash_sale', { ...restData.flash_sale, items });
                                                }}
                                            />
                                            <span className="text-xs font-bold">% levonás</span>
                                        </div>
                                    )}
                                </div>

                                {/* Type: BOGO */}
                                <div className={`p-2 border ${restData.flash_sale?.items?.[flashItem.id]?.type === 'bogo' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg`}>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="flashType" 
                                            checked={restData.flash_sale?.items?.[flashItem.id]?.type === 'bogo'} 
                                            onChange={() => {
                                                const items = { ...restData.flash_sale?.items, [flashItem.id]: { type: 'bogo' } };
                                                updateRestField('flash_sale', { ...restData.flash_sale, items });
                                            }}
                                        />
                                        <span className="text-xs font-bold">1+1 Akció (Egyet fizet, kettőt kap)</span>
                                    </label>
                                </div>

                                {/* Type: GIFT (Choice/Select) */}
                                <div className={`p-2 border ${restData.flash_sale?.items?.[flashItem.id]?.type === 'gift' ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-lg`}>
                                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                                        <input 
                                            type="radio" 
                                            name="flashType" 
                                            checked={restData.flash_sale?.items?.[flashItem.id]?.type === 'gift'} 
                                            onChange={() => {
                                                const items = { ...restData.flash_sale?.items, [flashItem.id]: { type: 'gift', giftName: 'Ajándék üdítő' } };
                                                updateRestField('flash_sale', { ...restData.flash_sale, items });
                                            }}
                                        />
                                        <span className="text-xs font-bold">Ajándék termék hozzá</span>
                                    </label>
                                    {restData.flash_sale?.items?.[flashItem.id]?.type === 'gift' && (
                                        <div className="ml-5">
                                            <input 
                                                className={`w-full ${WIN98.borderInset} px-2 py-0.5 text-xs`}
                                                placeholder="Ajándék megnevezése (pl. 0.33l Cola)"
                                                value={restData.flash_sale?.items?.[flashItem.id]?.giftName || ''}
                                                onChange={(e) => {
                                                    const items = { ...restData.flash_sale?.items, [flashItem.id]: { ...restData.flash_sale.items[flashItem.id], giftName: e.target.value } };
                                                    updateRestField('flash_sale', { ...restData.flash_sale, items });
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t flex flex-col gap-2">
                                <button 
                                    onClick={() => {
                                        const items = { ...restData.flash_sale?.items };
                                        delete items[flashItem.id];
                                        updateRestField('flash_sale', { ...restData.flash_sale, items });
                                        setShowFlashModal(false);
                                    }}
                                    className={`${WIN98.btn} text-red-600 font-bold`}
                                >
                                    Akció Törlése Ebből a Termékből
                                </button>
                                <button onClick={() => setShowFlashModal(false)} className={`${WIN98.btn} font-bold py-2 bg-gray-100`}>
                                    Kész / Mentés
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 4. SALES STATISTICS TAB ---
function SalesSummary({ restaurantId }) {
    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
    const [loading, setLoading] = useState(true);
    const [productStats, setProductStats] = useState([]);
    const [productPeriod, setProductPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchStats = async () => {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // FIX: Copy date to avoid mutation
            const todayForWeek = new Date(now);
            const day = todayForWeek.getDay();
            const diff = todayForWeek.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(todayForWeek.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const safeStartDate = new Date();
            safeStartDate.setDate(safeStartDate.getDate() - 40);

            const { data, error } = await supabase
                .from('orders')
                .select('total_price, created_at')
                .eq('restaurant_id', restaurantId)
                .neq('status', 'rejected')
                .neq('status', 'cancelled')
                .gte('created_at', safeStartDate.toISOString());

            if (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
                return;
            }

            let dailyTotal = 0;
            let weeklyTotal = 0;
            let monthlyTotal = 0;

            data.forEach(order => {
                const orderDate = new Date(order.created_at);
                const price = order.total_price || 0;

                if (orderDate >= startOfToday) dailyTotal += price;
                if (orderDate >= startOfWeek) weeklyTotal += price;
                if (orderDate >= startOfMonth) monthlyTotal += price;
            });

            setStats({ daily: dailyTotal, weekly: weeklyTotal, monthly: monthlyTotal });
            setLoading(false);
        };

        fetchStats();
    }, [restaurantId]);

    // Fetch product statistics
    useEffect(() => {
        if (!restaurantId) return;

        const fetchProductStats = async () => {
            setLoadingProducts(true);

            const now = new Date();
            let startDate;

            if (productPeriod === 'daily') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (productPeriod === 'weekly') {
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            try {
                const { data, error } = await supabase
                    .from('order_items')
                    .select(`
                        menu_item_id,
                        name,
                        quantity,
                        price,
                        order:orders!inner(
                            restaurant_id,
                            status,
                            created_at
                        )
                    `)
                    .eq('order.restaurant_id', restaurantId)
                    .eq('order.status', 'delivered')
                    .gte('order.created_at', startDate.toISOString());

                if (error) {
                    console.error('Error fetching product stats:', error);
                    setLoadingProducts(false);
                    return;
                }

                // Group by menu item
                const grouped = {};
                data.forEach(item => {
                    const key = item.menu_item_id || item.name;
                    if (!grouped[key]) {
                        grouped[key] = {
                            name: item.name,
                            totalQuantity: 0,
                            totalRevenue: 0
                        };
                    }
                    grouped[key].totalQuantity += item.quantity;
                    grouped[key].totalRevenue += item.quantity * item.price;
                });

                // Convert to array and sort by quantity
                const statsArray = Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);
                setProductStats(statsArray.slice(0, 10)); // Top 10
                setLoadingProducts(false);
            } catch (err) {
                console.error('Error:', err);
                setLoadingProducts(false);
            }
        };

        fetchProductStats();
    }, [restaurantId, productPeriod]);

    if (loading) return <div className="p-10 text-center text-sm">Adatok feldolgozása...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className={`p-1 ${WIN98.borderInset} bg-white mb-4`}>
                <span className="font-bold px-2">Statisztikák \ Bevétel</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Daily Card */}
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                    <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-teal-800 to-teal-600`}>
                        <span>Napló (Mai)</span>
                    </div>
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white dark:bg-zinc-900`}>
                        <div className="mb-2"><IoTime className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{stats.daily.toLocaleString()} Ft</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Mai forgalom</p>
                    </div>
                </div>

                {/* Weekly Card */}
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                    <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-blue-800 to-blue-600`}>
                        <span>Heti Összesítés</span>
                    </div>
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white dark:bg-zinc-900`}>
                        <div className="mb-2"><IoStatsChart className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{stats.weekly.toLocaleString()} Ft</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">E heti forgalom</p>
                    </div>
                </div>

                {/* Monthly Card */}
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                    <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-purple-800 to-purple-600`}>
                        <span>Havi Jelentés</span>
                    </div>
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white dark:bg-zinc-900`}>
                        <div className="mb-2"><IoStatsChart className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{stats.monthly.toLocaleString()} Ft</h3>

                        {/* Retro Progress Bar */}
                        <div className={`mt-3 h-4 ${WIN98.borderInset} bg-gray-200 dark:bg-zinc-800 relative`}>
                            <div className="absolute top-0 left-0 h-full bg-blue-800" style={{ width: '70%' }}></div>
                            {/* Blocks for retro feel */}
                            <div className="absolute top-0 left-0 h-full w-full flex opacity-20">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-white dark:border-black"></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">Hónap állapota: 70%</p>
                    </div>
                </div>
            </div>

            {/* Product Statistics Section */}
            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                <div className={WIN98.titleBar + " mx-0 mb-1"}>
                    <span>📊 Termék Statisztika</span>
                </div>

                {/* Period Filter Tabs */}
                <div className="flex gap-1 p-1 mb-2">
                    <button
                        onClick={() => setProductPeriod('daily')}
                        className={`${WIN98.btn} px-3 py-1 text-xs ${productPeriod === 'daily' ? 'bg-blue-200 font-bold' : ''}`}
                    >
                        Mai
                    </button>
                    <button
                        onClick={() => setProductPeriod('weekly')}
                        className={`${WIN98.btn} px-3 py-1 text-xs ${productPeriod === 'weekly' ? 'bg-blue-200 font-bold' : ''}`}
                    >
                        Heti
                    </button>
                    <button
                        onClick={() => setProductPeriod('monthly')}
                        className={`${WIN98.btn} px-3 py-1 text-xs ${productPeriod === 'monthly' ? 'bg-blue-200 font-bold' : ''}`}
                    >
                        Havi
                    </button>
                </div>

                {/* Product Stats Table */}
                <div className={`${WIN98.borderInset} bg-white dark:bg-zinc-900 overflow-auto max-h-[400px]`}>
                    {loadingProducts ? (
                        <div className="p-4 text-center text-sm text-gray-900 dark:text-gray-100">Adatok betöltése...</div>
                    ) : productStats.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-900 dark:text-gray-100">Nincs adat a kiválasztott időszakra.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 dark:bg-zinc-800 sticky top-0">
                                <tr>
                                    <th className="p-2 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400">#</th>
                                    <th className="p-2 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400">Termék Név</th>
                                    <th className="p-2 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 text-right">Eladott DB</th>
                                    <th className="p-2 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 text-right">Bevétel</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {productStats.map((product, index) => (
                                    <tr key={index} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-2 text-gray-600 dark:text-gray-400">{index + 1}</td>
                                        <td className="p-2 font-bold text-gray-900 dark:text-gray-100">{product.name}</td>
                                        <td className="p-2 text-right text-gray-600 dark:text-gray-400">{product.totalQuantity} db</td>
                                        <td className="p-2 text-right font-mono text-gray-900 dark:text-gray-100">{product.totalRevenue.toLocaleString()} Ft</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>


            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-2 flex items-start gap-3`}>
                <div className="text-3xl">ℹ️</div>
                <div className="text-sm">
                    <p className="font-bold mb-1">Információ</p>
                    <p>A statisztika csak a "Kézbesített" (delivered) vagy függőben lévő rendeléseket számolja, az elutasítottakat nem. A heti számítás Hétfőtől kezdődik.</p>
                </div>
            </div>
        </div>
    );
}

// --- 5. PROFILE EDITOR TAB ---
function ProfileEditor({ restaurantId }) {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        image_url: '',
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
                    image_url: data.image_url || '',
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
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
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
            image_url: form.image_url,
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

    if (loading) return <div className="p-10 text-center text-sm">Profil betöltése...</div>;

    return (
        <form onSubmit={save} className="max-w-4xl mx-auto space-y-6 pb-32">
            <QuickDelivery restaurantId={restaurantId} />

            {/* Basic Info */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6 text-lg"><IoInformationCircle className="text-amber-500" /> Alapadatok</h3>
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Image Upload */}
                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                        <div className={`w-40 h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 relative overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-900`}>
                            {form.image_url ? (
                                <img src={form.image_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <IoImage className="text-4xl text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Étterem borítóképe</p>
                            <p className="text-xs text-gray-500">Ajánlott méret: 1200x800px. Ez a kép jelenik meg az étlap fejlécében.</p>
                            <label className={`${WIN98.btn} inline-flex items-center gap-2 cursor-pointer`}>
                                <IoAddCircle size={18} />
                                {uploading ? 'Feltöltés...' : 'Új kép választása'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Étterem Neve</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telefonszám</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cím</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Szlogen / Rövid leírás</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Opening Hours & Delivery */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6 text-lg"><IoTime className="text-amber-500" /> Nyitvatartás & Szállítás</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nyitvatartás Szövege</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" placeholder="H-V: 10-22" value={form.opening_hours} onChange={e => setForm({ ...form, opening_hours: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Szállítási Beállítások</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5 mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="hasDelivery"
                                    checked={form.has_delivery}
                                    onChange={e => setForm({ ...form, has_delivery: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Szállítás Aktív</span>
                            </label>
                        </div>
                        <input 
                            disabled={!form.has_delivery} 
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${!form.has_delivery ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-gray-200 dark:border-zinc-700' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-amber-500'}`} 
                            placeholder="Várható idő (pl. 30-45 perc)" 
                            value={form.delivery_time} 
                            onChange={e => setForm({ ...form, delivery_time: e.target.value })} 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Minimum Rendelés (Ft)</label>
                        <div className="relative">
                            <input type="number" className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 focus:border-amber-500 outline-none transition-all text-gray-900 dark:text-white" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Ft</span>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg">
                <IoSave size={20} /> Beállítások Mentése
            </button>
        </form>
    );
}

// --- REUSABLE QUICK DELIVERY COMPONENT ---
function QuickDelivery({ restaurantId }) {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;
        const fetchRest = async () => {
            const { data } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
            setRestaurant(data);
            setLoading(false);
        };
        fetchRest();

        const channel = supabase.channel(`rest-quick-${restaurantId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurantId}` }, 
            payload => setRestaurant(payload.new))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [restaurantId]);

    const toggleOpen = async () => {
        const newVal = !restaurant.is_open;
        setRestaurant({ ...restaurant, is_open: newVal });
        await supabase.from('restaurants').update({ is_open: newVal }).eq('id', restaurantId);
        toast.success(newVal ? 'Étterem NYITVA! 🟢' : 'Étterem ZÁRVA! 🔴');
    };

    const setDeliveryTime = async (val) => {
        const newVal = val.replace('p', 'perc');
        setRestaurant({ ...restaurant, delivery_time: newVal });
        await supabase.from('restaurants').update({ delivery_time: newVal }).eq('id', restaurantId);
        toast.success(`Új szállítási idő: ${newVal}`, { icon: '⏱️' });
    };

    if (loading || !restaurant) return null;

    return (
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${restaurant.is_open ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 shadow-sm' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${restaurant.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        <IoRestaurant />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 dark:text-white leading-tight">Gyorselérés</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bolt állapot és szállítási idő</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Delivery Time Selector */}
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                        {["15 p", "30 p", "45 p", "60 p"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setDeliveryTime(opt)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${restaurant.delivery_time === opt.replace('p', 'perc') ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {/* Master Switch */}
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{restaurant.is_open ? 'Nyitva' : 'Zárva'}</span>
                        <button 
                            onClick={toggleOpen}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${restaurant.is_open ? 'bg-green-500' : 'bg-red-500'}`}
                        >
                            <div className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${restaurant.is_open ? 'translate-x-8' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- HELP MODAL (USER MANUAL) ---
function HelpModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl relative shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl">
                            <IoInformationCircle />
                        </div>
                        <h2 className="font-bold text-gray-800 dark:text-white text-lg">Súgó & Útmutató</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500"><IoClose size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    <section>
                        <h3 className="font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">01. Rendelések Kezelése</h3>
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Új rendelés esetén csengőhang értesít, és a sor <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded font-black text-[10px]">KIEMELT</span> lesz.</p>
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <li className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> <b>Új</b>: Beérkező kérés</li>
                                <li className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl"><span className="w-2 h-2 rounded-full bg-amber-500"></span> <b>Elfogadva</b>: Konyhán van</li>
                                <li className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl"><span className="w-2 h-2 rounded-full bg-blue-500"></span> <b>Futárnál</b>: Szállítás alatt</li>
                                <li className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/10 rounded-xl"><span className="w-2 h-2 rounded-full bg-green-500"></span> <b>Kész</b>: Kézbesítve</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">02. Bolt Állapota</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                            A Rendelések oldal tetején található <b>Mesterkapcsolóval</b> bármikor lezárhatod az online rendelést. Ha zárva vagy, a vendégek látni fogják az étlapot, de nem tudnak kosárba tenni semmit.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">03. Nyomtatás</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex items-center gap-3 border border-dashed border-gray-200 dark:border-white/10 p-4 rounded-2xl italic">
                            <IoPrint className="text-2xl flex-shrink-0" /> A webes felület 80mm-es blokknyomtatókhoz van optimalizálva. A rendelés sorában a nyomtató ikonra kattintva PDF-et generál a rendszer, amit a böngészőből azonnal nyomtathatsz.
                        </p>
                    </section>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 flex justify-center">
                    <button onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-12 py-2 rounded-xl transition-all active:scale-95 shadow-md">RENDBEN</button>
                </div>
            </div>
        </div>
    );
}

// --- ORDER DETAIL MODAL ---
function OrderDetailModal({ order, onClose, onStatusChange, onPrint }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-full max-w-lg pointer-events-auto shadow-xl flex flex-col relative z-20`}>
                <div className={WIN98.titleBar}>
                    <div className="flex items-center gap-2">
                        <span>Rendelés Részletei - #{order.id}</span>
                    </div>
                    <button onClick={onClose} className={`${WIN98.btn} w-4 h-4 flex items-center justify-center leading-none pb-1`}>x</button>
                </div>

                <div className={`p-4 bg-white dark:bg-zinc-800 border-2 border-inset border-gray-400 dark:border-white/10 m-1 flex-1 text-sm font-sans max-h-[70vh] overflow-y-auto text-gray-900 dark:text-gray-100`}>
                    {/* Header Info */}
                    <div className="flex justify-between items-start border-b-2 border-gray-200 pb-2 mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{order.customer_name}</h2>
                            <p className="text-gray-700 dark:text-gray-300">{order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{order.total_price} Ft</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-2 border border-amber-200 dark:border-amber-900/30">
                        <p className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase">Szállítási Cím:</p>
                        <p className="text-lg leading-tight text-gray-900 dark:text-white">{order.customer_address}</p>
                        {order.customer_note && (
                            <p className="mt-2 text-red-600 dark:text-red-400 font-bold">⚠️ Megjegyzés: {order.customer_note}</p>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                        <p className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Rendelt Tételek:</p>
                        <ul className="space-y-1 border-t border-gray-200 dark:border-white/10 pt-1">
                            {order.items?.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm text-gray-900 dark:text-gray-100">
                                    <span className="font-bold">{item.quantity}x {item.name}</span>
                                    <span>{item.price * item.quantity} Ft</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-2 gap-2 flex flex-wrap justify-end bg-gray-100 dark:bg-zinc-800">
                    <button onClick={() => onPrint(order)} className={`${WIN98.btn} mr-auto`} title="Nyomtatás">🖨️ Nyomtatás</button>

                    {order.status === 'new' && (
                        <>
                            <button onClick={() => { onStatusChange(order.id, 'accepted'); onClose(); }} className={`${WIN98.btn} bg-green-200 font-bold border-green-800`}>Elfogad</button>
                            <button onClick={() => { onStatusChange(order.id, 'rejected'); onClose(); }} className={`${WIN98.btn} bg-red-200`}>Elutasít</button>
                        </>
                    )}

                    {order.status === 'accepted' && (
                        <button onClick={() => { onStatusChange(order.id, 'ready'); onClose(); }} className={`${WIN98.btn} font-bold`}>Futárnak Átad</button>
                    )}

                    {order.status === 'ready' && (
                        <button onClick={() => { onStatusChange(order.id, 'delivered'); onClose(); }} className={`${WIN98.btn} font-bold`}>Kész / Kiszállítva</button>
                    )}

                    <button onClick={onClose} className={`${WIN98.btn} min-w-[60px]`}>Bezár</button>
                </div>
            </div>
        </div>
    );
}

// --- SEARCH PANEL (WIN98 FIND) ---
function SearchPanel({ restaurantId }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Status Logic for Search Panel
    const handleStatusChange = async (orderId, newStatus) => {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        setResults(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
    };

    // Print Logic for Search Panel
    const printReceipt = (order) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200]
            });

            doc.setFontSize(14);
            doc.text('KőszegApp Rendelés', 40, 10, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`#${order.id}`, 40, 16, { align: 'center' });
            doc.text(new Date(order.created_at).toLocaleString('hu-HU'), 40, 22, { align: 'center' });
            doc.line(5, 25, 75, 25);
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
            order.items.forEach(item => {
                doc.text(`${item.quantity}x`, 5, yPos);
                doc.text(doc.splitTextToSize(item.name, 50), 12, yPos);
                doc.text(`${item.price} Ft`, 75, yPos, { align: 'right' });
                yPos += 6;
                if (item.name.length > 25) yPos += 4;
            });
            yPos += 5;
            doc.line(5, yPos, 75, yPos);
            yPos += 7;
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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setHasSearched(true);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, items:order_items(*)`)
                .eq('restaurant_id', restaurantId)
                .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,customer_address.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Hiba a keresés során');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
            <div className="p-2 bg-[#c0c0c0] mb-2 border-2 border-white border-b-black border-r-black">
                <form onSubmit={handleSearch} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold text-black text-gray-900 dark:text-gray-100">Keresés (Név, Cím, Tel):</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                className={`flex-1 ${WIN98.borderInset} px-2 py-1 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white outline-none`}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="pl. Tóth István"
                            />
                            <button type="submit" className={`${WIN98.btn} font-bold px-4 flex items-center gap-2`}>
                                🔍 {searching ? '...' : 'Keresés'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results List */}
            <div className={`flex-1 ${WIN98.borderInset} bg-white dark:bg-zinc-900 overflow-y-auto`}>
                {hasSearched && results.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        <p className="font-bold text-lg mb-2">Nincs találat.</p>
                        <p className="text-sm">Próbáld más névvel vagy címmel.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[#c0c0c0] sticky top-0">
                            <tr>
                                <th className="p-1 border border-gray-400 w-32">Dátum</th>
                                <th className="p-1 border border-gray-400">Ügyfél</th>
                                <th className="p-1 border border-gray-400">Tételek</th>
                                <th className="p-1 border border-gray-400">Cím</th>
                                <th className="p-1 border border-gray-400 w-24 text-right">Összeg</th>
                                <th className="p-1 border border-gray-400 w-24 text-center">Státusz</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(order => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-blue-800 hover:text-white cursor-pointer group border-b border-gray-100"
                                >
                                    <td className="p-1 border-r border-gray-200 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                                    <td className="p-1 border-r border-gray-200 font-bold">{order.customer_name}</td>
                                    <td className="p-1 border-r border-gray-200 text-xs italic">{order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                                    <td className="p-1 border-r border-gray-200 text-xs">{order.customer_address}</td>
                                    <td className="p-1 border-r border-gray-200 dark:border-white/5 text-right font-mono text-gray-900 dark:text-white">{order.total_price} Ft</td>
                                    <td className="p-1 text-center text-xs">
                                        <span className={`px-1 rounded-sm
                                            ${order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                order.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'}
                                         `}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!hasSearched && (
                                <tr className="text-gray-500 dark:text-gray-400 italic">
                                    <td colSpan={6} className="p-4 text-center">Írj be valamit a kereséshez...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex justify-between items-center text-xs mt-1">
                <span>{results.length} találat</span>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusChange={handleStatusChange}
                    onPrint={printReceipt}
                />
            )}
        </div>
    );
}

// --- 6. MARKETING PANEL (FLASH SALE & MYSTERY BOX) ---
function MarketingPanel({ restaurantId }) {
    const [loading, setLoading] = useState(true);
    const [flashSale, setFlashSale] = useState({
        active: false,
        discount: "20%",
        message: "Minden pizzára!",
        end_time: ""
    });

    const [mysteryBox, setMysteryBox] = useState([]);
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [editingBox, setEditingBox] = useState(null);
    const [boxForm, setBoxForm] = useState({ name: '', original_price: '', discounted_price: '', items_left: 1, pickup_time: '', description: '' });

    // Load Data
    useEffect(() => {
        if (!restaurantId) return;
        const loadMarketing = async () => {
            const { data } = await supabase.from('restaurants').select('flash_sale, mystery_box').eq('id', restaurantId).single();
            if (data) {
                if (data.flash_sale) setFlashSale({ ...data.flash_sale });
                if (data.mystery_box) setMysteryBox(data.mystery_box);
            }
            setLoading(false);
        };
        loadMarketing();
    }, [restaurantId]);


    // Flash Sale Logic
    const saveFlashSale = async () => {
        const { error } = await supabase.from('restaurants').update({ flash_sale: flashSale }).eq('id', restaurantId);
        if (error) toast.error("Hiba a mentéskor");
        else toast.success("Flash Sale frissítve! ⚡");
    };
    // Mystery Box Logic
    const saveMysteryBox = async () => {
        let newBoxes = [...mysteryBox];
        if (editingBox) {
            newBoxes = newBoxes.map(b => b.id === editingBox.id ? { ...boxForm, id: editingBox.id } : b);
        } else {
            newBoxes.push({ ...boxForm, id: `mb_${Date.now()}` });
        }

        const { error } = await supabase.from('restaurants').update({ mystery_box: newBoxes }).eq('id', restaurantId);

        if (error) {
            toast.error("Hiba a mentéskor");
        } else {
            setMysteryBox(newBoxes);
            setShowBoxModal(false);
            toast.success("Mystery Box mentve! 🎁");
        }
    };

    const deleteBox = async (id) => {
        if (!window.confirm("Biztos törlöd ezt a csomagot?")) return;
        const newBoxes = mysteryBox.filter(b => b.id !== id);
        const { error } = await supabase.from('restaurants').update({ mystery_box: newBoxes }).eq('id', restaurantId);
        if (error) toast.error("Hiba a törléskor");
        else {
            setMysteryBox(newBoxes);
            toast.success("Törölve.");
        }
    };

    const openBoxModal = (box = null) => {
        setEditingBox(box);
        setBoxForm(box || { name: 'Meglepetés Csomag', original_price: '3000', discounted_price: '1500', items_left: 3, pickup_time: '20:00-21:00', description: 'Megmaradt finomságok...' });
        setShowBoxModal(true);
    };

    if (loading) return <div className="p-10 text-center">Betöltés...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* FLASH SALE SECTION */}
            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-red-800 to-orange-600`}>
                    <span>⚡ FLASH SALE (Villámakció)</span>
                </div>
                <div className={`p-4 ${WIN98.borderInset} bg-white dark:bg-zinc-900`}>
                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                        Indíts azonnali akciót, amit a közeledben lévő felhasználók <strong>kiemelt értesítésként</strong> kapnak meg!
                        Csak akkor használd, ha tényleg akció van, mert 2 óra múlva automatikusan lejár.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex gap-2 items-center md:col-span-2 bg-yellow-100 p-2 border border-yellow-300">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-red-600"
                                checked={flashSale.active}
                                onChange={e => setFlashSale({ ...flashSale, active: e.target.checked })}
                            />
                            <span className="font-bold text-red-600">AKCIÓ AKTIVÁLÁSA</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold">Kedvezmény (pl. -20% vagy 1+1):</label>
                            <input className={`w-full ${WIN98.borderInset} px-2 py-1`} value={flashSale.discount} onChange={e => setFlashSale({ ...flashSale, discount: e.target.value })} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold">Lejárat Ideje:</label>
                            <input type="datetime-local" className={`w-full ${WIN98.borderInset} px-2 py-1`} value={flashSale.end_time} onChange={e => setFlashSale({ ...flashSale, end_time: e.target.value })} />
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => {
                                    const d = new Date(); d.setHours(d.getHours() + 1);
                                    setFlashSale({ ...flashSale, end_time: d.toISOString().slice(0, 16) });
                                }} className="text-[10px] underline text-blue-600">+1 Óra</button>
                                <button onClick={() => {
                                    const d = new Date(); d.setHours(d.getHours() + 2);
                                    setFlashSale({ ...flashSale, end_time: d.toISOString().slice(0, 16) });
                                }} className="text-[10px] underline text-blue-600">+2 Óra</button>
                            </div>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold">Rövid Üzenet (pl. Minden Pizzára):</label>
                            <input className={`w-full ${WIN98.borderInset} px-2 py-1`} value={flashSale.message} onChange={e => setFlashSale({ ...flashSale, message: e.target.value })} />
                        </div>
                    </div>

                    <button onClick={saveFlashSale} className={`${WIN98.btn} w-full font-bold py-2 bg-red-100`}>
                        💾 Flash Sale Mentése
                    </button>
                </div>
            </div>

            {/* MYSTERY BOX SECTION */}
            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-purple-800 to-indigo-600`}>
                    <span>🎁 MYSTERY BOX (Ételmentés)</span>
                </div>
                <div className={`p-4 ${WIN98.borderInset} bg-white dark:bg-zinc-900`}>
                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                        Zárás előtt maradt ételek? Add el őket csomagban, kedvezményesen!
                        A rendszer automatikusan szól a felhasználóknak, ha közeledik az átvételi idő.
                    </p>

                    <button onClick={() => openBoxModal()} className={`${WIN98.btn} mb-4 flex items-center gap-2`}>
                        <IoAddCircle className="text-lg" /> Új Csomag Hozzáadása
                    </button>

                    <div className="space-y-2">
                        {mysteryBox.map(box => (
                            <div key={box.id} className="border border-gray-300 p-2 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h4 className="font-bold">{box.name} ({box.items_left} db maradt)</h4>
                                    <p className="text-xs text-gray-500">Átvétel: {box.pickup_time} | Ár: {box.discounted_price} Ft <s className="text-gray-400">{box.original_price} Ft</s></p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openBoxModal(box)} className={`${WIN98.btn} text-xs`}>Szerk.</button>
                                    <button onClick={() => deleteBox(box.id)} className={`${WIN98.btn} text-xs text-red-600`}>Törlés</button>
                                </div>
                            </div>
                        ))}
                        {mysteryBox.length === 0 && <p className="text-center text-gray-400 italic">Nincs aktív csomag.</p>}
                    </div>
                </div>
            </div>

            {/* BOX MODAL */}
            {showBoxModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-full max-w-md p-1 shadow-2xl`}>
                        <div className={WIN98.titleBar}>
                            <span>{editingBox ? 'Csomag Szerkesztése' : 'Új Csomag'}</span>
                            <button onClick={() => setShowBoxModal(false)} className={`${WIN98.btn} px-2 py-0`}>x</button>
                        </div>
                        <div className={`p-4 ${WIN98.borderInset} bg-white dark:bg-zinc-900 space-y-3 mt-1`}>
                            <div>
                                <label className="text-xs font-bold">Név:</label>
                                <input className={`w-full ${WIN98.borderInset} px-2 py-1`} value={boxForm.name} onChange={e => setBoxForm({ ...boxForm, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs font-bold">Eredeti Ár:</label><input type="number" className={`w-full ${WIN98.borderInset} px-2 py-1`} value={boxForm.original_price} onChange={e => setBoxForm({ ...boxForm, original_price: e.target.value })} /></div>
                                <div><label className="text-xs font-bold">Akciós Ár:</label><input type="number" className={`w-full ${WIN98.borderInset} px-2 py-1`} value={boxForm.discounted_price} onChange={e => setBoxForm({ ...boxForm, discounted_price: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs font-bold">Darabszám:</label><input type="number" className={`w-full ${WIN98.borderInset} px-2 py-1`} value={boxForm.items_left} onChange={e => setBoxForm({ ...boxForm, items_left: e.target.value })} /></div>
                                <div><label className="text-xs font-bold">Átvétel (pl. 20:00-21:00):</label><input className={`w-full ${WIN98.borderInset} px-2 py-1`} value={boxForm.pickup_time} onChange={e => setBoxForm({ ...boxForm, pickup_time: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold">Leírás:</label>
                                <textarea className={`w-full ${WIN98.borderInset} px-2 py-1`} rows={2} value={boxForm.description} onChange={e => setBoxForm({ ...boxForm, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowBoxModal(false)} className={`${WIN98.btn}`}>Mégse</button>
                                <button onClick={saveMysteryBox} className={`${WIN98.btn} font-bold`}>Mentés</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
