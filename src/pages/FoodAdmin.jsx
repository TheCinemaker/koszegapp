import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoRestaurant, IoFastFood, IoSettings, IoLogOut, IoNotifications, IoAddCircle, IoTime, IoPrint, IoSave, IoImage, IoCheckmarkCircle, IoStatsChart, IoInformationCircle, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Windows 98 UI Constants
const WIN98 = {
    bg: 'bg-[#008080]', // Teal
    windowBg: 'bg-[#c0c0c0]', // Silver
    text: 'text-black font-sans', // System font
    borderOutset: 'border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-black border-b-black',
    borderInset: 'border-t-2 border-l-2 border-r-2 border-b-2 border-t-black border-l-black border-r-white border-b-white',
    titleBar: 'bg-gradient-to-r from-[#000080] to-[#1084d0] text-white font-bold px-1 py-0.5 flex justify-between items-center select-none',
    btn: 'bg-[#c0c0c0] active:border-t-black active:border-l-black active:border-r-white active:border-b-white px-3 py-1 text-sm active:translate-y-px',
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
        <div className={`min-h-screen ${WIN98.bg} p-1 md:p-2 overflow-hidden flex flex-col font-sans text-sm`} style={{ color: '#000000' }}>
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
                    <img src="/icons/icon-192x192.png" className="w-4 h-4 grayscale contrast-200" alt="" />
                    <span>FoodManager 98 - {restaurantData?.name || 'Betöltés...'}</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={onLogout} className={`${WIN98.btn} ${WIN98.borderOutset} w-5 h-5 flex items-center justify-center leading-none pb-1 font-bold`}>_</button>
                    <button onClick={onLogout} className={`${WIN98.btn} ${WIN98.borderOutset} w-5 h-5 flex items-center justify-center leading-none pb-1 font-bold`}>X</button>
                </div>
            </div>

            {/* Menu Bar / Toolbar */}
            <div className="flex gap-4 px-2 py-1 border-b border-gray-400 shadow-sm text-sm mb-1 bg-[#c0c0c0]">
                <button onClick={() => setShowHelp(true)} className="underline cursor-pointer hover:bg-blue-800 hover:text-white px-1 text-black">Súgó</button>
                <span className="ml-auto text-black">{new Date().toLocaleDateString()}</span>
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
                <main className={`flex-1 overflow-y-auto ${WIN98.borderOutset} bg-[#c0c0c0] p-4 relative`}>
                    {/* Inner content usually has an inset border in some apps, but standard is just gray bg or white if document */}
                    <div className="max-w-full mx-auto">
                        {activeTab === 'orders' && <OrderList restaurantId={restaurantId} />}
                        {activeTab === 'menu' && <MenuEditor restaurantId={restaurantId} />}
                        {activeTab === 'marketing' && <MarketingPanel restaurantId={restaurantId} />}
                        {activeTab === 'search' && <SearchPanel restaurantId={restaurantId} />}
                        {activeTab === 'stats' && <SalesSummary restaurantId={restaurantId} />}
                        {activeTab === 'profile' && <ProfileEditor restaurantId={restaurantId} />}
                    </div>
                </main>
            </div>

            {/* Status Bar */}
            <div className={`h-6 ${WIN98.borderInset} flex items-center px-2 text-xs gap-4 bg-[#c0c0c0] text-black`}>
                <span className="w-32 truncate border-r border-gray-400 pr-2">Állapot: {restaurantData?.is_open ? 'Nyitva' : 'Zárva'}</span>
                <span className="flex-1 truncate">Felhasználó: Kész</span>
                <span className="border-l border-gray-400 pl-2">v4.0.98</span>
            </div>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
}

const TabButton = ({ id, label, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`
            px-3 py-1 rounded-t-sm text-sm font-bold
            border-t-2 border-l-2 border-r-2 
            ${active === id
                ? 'bg-[#c0c0c0] border-t-white border-l-white border-r-black text-black z-20 pb-1.5 -mb-1'
                : 'bg-[#b0b0b0] border-t-white border-l-white border-r-gray-600 text-black mb-0'
            }
        `}
    >
        {label}
    </button>
);


// --- 1. ORDERS TAB (WITH PDF) ---
function OrderList({ restaurantId }) {
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
            doc.text(normalizeText('KöszegApp Rendelés'), 40, 10, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`#${shortId}`, 40, 16, { align: 'center' });
            doc.text(new Date(order.created_at).toLocaleString('hu-HU'), 40, 22, { align: 'center' });

            doc.line(5, 25, 75, 25);

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

            <div className={`bg-white ${WIN98.borderInset} h-[600px] overflow-auto`}>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#c0c0c0] sticky top-0 z-10">
                        <tr>
                            {['Időpont', 'Vevő Neve', 'Cím', 'Tételek', 'Összeg', 'Státusz', 'Műveletek'].map(head => (
                                <th key={head} className={`p-1 border border-r-black border-b-black border-l-white border-t-white text-xs font-normal select-none active:border-r-white active:border-b-white active:border-l-black active:border-t-black`}>
                                    <div className="px-1">{head}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white text-sm">
                        {orders.map(order => (
                            <tr
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`
                                    border-b border-gray-200 group cursor-pointer
                                    ${order.status === 'new'
                                        ? 'bg-yellow-300 text-black font-bold'
                                        : 'bg-white text-black hover:bg-blue-800 hover:text-white'
                                    }
                                `}
                            >
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} text-black`}>{new Date(order.created_at).toLocaleTimeString()}</td>
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} font-bold text-black`}>{order.customer_name}</td>
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} text-xs truncate max-w-[150px] text-black`} title={order.customer_address}>{order.customer_address}</td>
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} text-xs italic text-black`}>
                                    {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    {order.customer_note && <span className={`font-bold ml-1 ${order.status === 'new' ? 'text-yellow-300' : 'text-red-500 group-hover:text-yellow-300'}`}> (! {order.customer_note})</span>}
                                </td>
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} text-right text-black`}>{order.total_price} Ft</td>
                                <td className={`p-1 border-r ${order.status === 'new' ? 'border-red-400' : 'border-gray-200'} text-center`}>
                                    <span className={`px-1 text-xs uppercase font-bold 
                                        ${order.status === 'new' ? 'bg-red-600 text-white' :
                                            order.status === 'accepted' ? 'bg-yellow-200 text-black' :
                                                order.status === 'ready' ? 'bg-blue-200 text-black' : 'bg-green-200 text-black'}
                                     `}>
                                        {getStatusText(order.status)}
                                    </span>
                                </td>
                                <td className="p-1 flex gap-1 justify-center">
                                    {order.status === 'new' ? (
                                        <>
                                            <button onClick={() => handleStatusChange(order.id, 'accepted')} className={`${WIN98.btn} bg-green-200`}>Ok</button>
                                            <button onClick={() => handleStatusChange(order.id, 'rejected')} className={`${WIN98.btn}`}>Nem</button>
                                        </>
                                    ) : (
                                        <>
                                            {order.status === 'accepted' && (
                                                <button onClick={() => handleStatusChange(order.id, 'ready')} className={`${WIN98.btn}`}>Futár</button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button onClick={() => handleStatusChange(order.id, 'delivered')} className={`${WIN98.btn}`}>Kész</button>
                                            )}
                                        </>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); printReceipt(order); }} className={`${WIN98.btn} px-1`} title="Nyomtatás">🖨️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-10 text-center text-black">Nincs megjeleníthető adat.</div>
                )}
            </div>

            <div className="flex justify-between items-center text-xs">
                <span>{orders.length} objektum(ok)</span>
                <span>Szabad memória: 64MB</span>
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

    if (loading) return <div className="p-10 text-center text-sm">Könyvtárak beolvasása...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-32">
            <QuickDelivery restaurantId={restaurantId} />

            <div className={`flex items-center justify-between mb-2 p-1 ${WIN98.borderInset} bg-white`}>
                <span className="font-bold px-2">Helyi meghajtó (C:) \ Étlap</span>
                <button onClick={() => openCatModal()} className={`${WIN98.btn} text-xs`}>
                    Új Mappa (Kategória)
                </button>
            </div>

            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat.id} className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1 mb-4`}>
                        <div className={`${WIN98.titleBar} mx-0 mb-1`}>
                            <span>📁 {cat.name}</span>
                            <button onClick={() => openCatModal(cat)} className="text-white text-xs underline px-2">Szerkeszt</button>
                        </div>

                        <div className={`bg-white ${WIN98.borderInset} p-2 grid grid-cols-1 md:grid-cols-2 gap-2`}>
                            {cat.items?.map(item => (
                                <div key={item.id} className={`flex items-start gap-2 p-1 border border-dotted border-gray-400 ${!item.is_available ? 'opacity-50 grayscale' : ''}`}>
                                    <div className={`w-10 h-10 ${WIN98.borderInset} shrink-0 bg-gray-200 overflow-hidden`}>
                                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs truncate">{item.name}</h4>
                                        <p className="text-[10px] text-black truncate">{item.price} Ft</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => openItemModal(cat.id, item)} className={`${WIN98.btn} py-0 px-1 text-[10px]`}>✏️</button>
                                        <button onClick={() => toggleItemAvailability(item.id, item.is_available)} className={`${WIN98.btn} py-0 px-1 text-[10px] ${item.is_available ? 'text-green-800' : 'text-red-800'}`}>
                                            {item.is_available ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openItemModal(cat.id)} className="w-full h-12 border border-dashed border-gray-400 flex items-center justify-center text-black text-xs hover:bg-gray-100">
                                + Új Fájl
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
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white`}>
                        <div className="mb-2"><IoTime className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-black">{stats.daily.toLocaleString()} Ft</h3>
                        <p className="text-xs text-black mt-1">Mai forgalom</p>
                    </div>
                </div>

                {/* Weekly Card */}
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                    <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-blue-800 to-blue-600`}>
                        <span>Heti Összesítés</span>
                    </div>
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white`}>
                        <div className="mb-2"><IoStatsChart className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-black">{stats.weekly.toLocaleString()} Ft</h3>
                        <p className="text-xs text-black mt-1">E heti forgalom</p>
                    </div>
                </div>

                {/* Monthly Card */}
                <div className={`${WIN98.windowBg} ${WIN98.borderOutset} p-1`}>
                    <div className={`${WIN98.titleBar} mx-0 mb-1 bg-gradient-to-r from-purple-800 to-purple-600`}>
                        <span>Havi Jelentés</span>
                    </div>
                    <div className={`p-4 text-center ${WIN98.borderInset} bg-white`}>
                        <div className="mb-2"><IoStatsChart className="inline text-2xl text-gray-400" /></div>
                        <h3 className="text-2xl font-bold font-mono text-black">{stats.monthly.toLocaleString()} Ft</h3>

                        {/* Retro Progress Bar */}
                        <div className={`mt-3 h-4 ${WIN98.borderInset} bg-gray-200 relative`}>
                            <div className="absolute top-0 left-0 h-full bg-blue-800" style={{ width: '70%' }}></div>
                            {/* Blocks for retro feel */}
                            <div className="absolute top-0 left-0 h-full w-full flex opacity-20">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-white"></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-black mt-1">Hónap állapota: 70%</p>
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
                <div className={`${WIN98.borderInset} bg-white overflow-auto max-h-[400px]`}>
                    {loadingProducts ? (
                        <div className="p-4 text-center text-sm text-black">Adatok betöltése...</div>
                    ) : productStats.length === 0 ? (
                        <div className="p-4 text-center text-sm text-black">Nincs adat a kiválasztott időszakra.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#c0c0c0] sticky top-0">
                                <tr>
                                    <th className="p-2 border border-r-black border-b-black border-l-white border-t-white text-xs font-bold text-black">#</th>
                                    <th className="p-2 border border-r-black border-b-black border-l-white border-t-white text-xs font-bold text-black">Termék Név</th>
                                    <th className="p-2 border border-r-black border-b-black border-l-white border-t-white text-xs font-bold text-black text-right">Eladott DB</th>
                                    <th className="p-2 border border-r-black border-b-black border-l-white border-t-white text-xs font-bold text-black text-right">Bevétel</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-sm">
                                {productStats.map((product, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="p-2 text-black">{index + 1}</td>
                                        <td className="p-2 font-bold text-black">{product.name}</td>
                                        <td className="p-2 text-right text-black">{product.totalQuantity} db</td>
                                        <td className="p-2 text-right font-mono text-black">{product.totalRevenue.toLocaleString()} Ft</td>
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
        <form onSubmit={save} className="max-w-2xl mx-auto space-y-4 pb-20">
            <QuickDelivery restaurantId={restaurantId} />

            {/* Basic Info */}
            <fieldset className={`border-2 border-white border-l-gray-500 border-t-gray-500 p-2 mb-4`}>
                <legend className="px-1 font-bold text-sm text-black">Alapadatok</legend>
                <div className="grid md:grid-cols-2 gap-4 p-2">

                    {/* Image Upload */}
                    <div className="md:col-span-2 mb-2 flex gap-4 items-start">
                        <div className={`w-32 h-24 ${WIN98.borderInset} bg-gray-200 relative overflow-hidden flex items-center justify-center`}>
                            {form.image_url ? (
                                <img src={form.image_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-black">Nincs Kép</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-xs mb-1">Borítókép kiválasztása:</p>
                            <label className={`${WIN98.btn} inline-block cursor-pointer`}>
                                {uploading ? 'Feltöltés...' : 'Tallózás...'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-black">Étterem Neve:</label>
                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-black">Telefonszám:</label>
                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-black">Cím:</label>
                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-black">Rövid leírás (Szlogen):</label>
                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
            </fieldset>

            {/* Opening Hours & Delivery */}
            <fieldset className={`border-2 border-white border-l-gray-500 border-t-gray-500 p-2 mb-4`}>
                <legend className="px-1 font-bold text-sm text-black">Nyitvatartás & Szállítás</legend>
                <div className="grid md:grid-cols-2 gap-4 p-2">
                    <div className="space-y-1">
                        <label className="text-xs text-black">Nyitvatartás:</label>
                        <input className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} placeholder="H-V: 10-22" value={form.opening_hours} onChange={e => setForm({ ...form, opening_hours: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                type="checkbox"
                                id="hasDelivery"
                                checked={form.has_delivery}
                                onChange={e => setForm({ ...form, has_delivery: e.target.checked })}
                                className="accent-black"
                            />
                            <label htmlFor="hasDelivery" className="text-xs cursor-pointer select-none text-black">Házhozszállítás engedélyezése</label>
                        </div>
                        <input disabled={!form.has_delivery} className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none ${!form.has_delivery ? 'bg-gray-200 text-gray-500' : ''}`} placeholder="30-45 perc" value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-black">Min. Rendelés (Ft):</label>
                        <input type="number" className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`} value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} />
                    </div>
                </div>
            </fieldset>

            {/* News & Promos */}
            <fieldset className={`border-2 border-white border-l-gray-500 border-t-gray-500 p-2 mb-4`}>
                <legend className="px-1 font-bold text-sm text-black">Hírek & Akciók</legend>
                <div className="space-y-4 p-2">

                    {/* Constant Menu */}
                    <div className="space-y-2 pb-3 mb-3 border-b border-gray-300">
                        <div className="flex flex-wrap items-center justify-between gap-2 pr-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={form.settings.show_constant_menu} onChange={() => toggleSetting('show_constant_menu')} className="accent-black" />
                                <label className="text-xs font-bold text-black border-b border-black pb-0.5">Állandó Menü (A/B menü)</label>
                            </div>
                            {form.settings.show_constant_menu && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase">Ár:</span>
                                    <input
                                        type="number"
                                        placeholder="Pl. 2500"
                                        className={`w-20 ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none font-bold`}
                                        value={form.settings.constant_menu_price || ''}
                                        onChange={e => setForm({ ...form, settings: { ...form.settings, constant_menu_price: e.target.value } })}
                                    />
                                    <span className="text-[10px] font-bold">Ft</span>
                                </div>
                            )}
                        </div>
                        {form.settings.show_constant_menu && (
                            <textarea
                                rows={2}
                                className={`w-full ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none resize-none font-mono focus:bg-yellow-50`}
                                placeholder="A menü: Húsleves + Rántott sajt, B menü: Bakonyi sertésborda..."
                                value={form.settings.constant_menu_text || ''}
                                onChange={e => setForm({ ...form, settings: { ...form.settings, constant_menu_text: e.target.value } })}
                            />
                        )}
                    </div>

                    {/* Weekly Menu */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pr-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={form.settings.show_daily_menu} onChange={() => toggleSetting('show_daily_menu')} className="accent-black" />
                                <label className="text-xs font-bold text-black border-b border-black pb-0.5">Egész heti menü / Ajánlatok</label>
                            </div>
                            {form.settings.show_daily_menu && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase">Ár:</span>
                                    <input
                                        type="number"
                                        placeholder="Pl. 2500"
                                        className={`w-20 ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none font-bold`}
                                        value={form.settings.daily_menu_price || ''}
                                        onChange={e => setForm({ ...form, settings: { ...form.settings, daily_menu_price: e.target.value } })}
                                    />
                                    <span className="text-[10px] font-bold">Ft</span>
                                </div>
                            )}
                        </div>
                        {form.settings.show_daily_menu && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 border-l-2 border-gray-400 pb-2">
                                {[{ id: 1, label: 'Hétfő' }, { id: 2, label: 'Kedd' }, { id: 3, label: 'Szerda' }, { id: 4, label: 'Csütörtök' }, { id: 5, label: 'Péntek' }, { id: 6, label: 'Szombat' }, { id: 0, label: 'Vasárnap' }].map(day => {
                                    const wm = (() => {
                                        if (!form.daily_menu) return {};
                                        try {
                                            const o = JSON.parse(form.daily_menu);
                                            // Handling edge case where old data was not a JSON object but a plain string
                                            return (typeof o === 'object' && o !== null) ? o : { 1: form.daily_menu };
                                        } catch {
                                            return { 1: form.daily_menu };
                                        }
                                    })();
                                    return (
                                        <div key={day.id} className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{day.label}</span>
                                            <textarea rows={2} className={`w-full ${WIN98.borderInset} px-2 py-1 text-xs bg-white outline-none resize-none font-mono focus:bg-yellow-50`} placeholder="pl: Húsleves, Rántott sajt..." value={wm[day.id] || ''} onChange={e => {
                                                const nw = { ...wm, [day.id]: e.target.value };
                                                setForm({ ...form, daily_menu: JSON.stringify(nw) });
                                            }} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* News */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={form.settings.show_news} onChange={() => toggleSetting('show_news')} className="accent-black" />
                            <label className="text-xs font-bold text-black">Hírek</label>
                        </div>
                        <textarea rows={2} className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none resize-none`} value={form.news} onChange={e => setForm({ ...form, news: e.target.value })} />
                    </div>

                    {/* Promos */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={form.settings.show_promotions} onChange={() => toggleSetting('show_promotions')} className="accent-black" />
                            <label className="text-xs font-bold text-black">Akciók</label>
                        </div>
                        <textarea rows={2} className={`w-full ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none resize-none`} value={form.promotions} onChange={e => setForm({ ...form, promotions: e.target.value })} />
                    </div>
                </div>
            </fieldset>

            <button type="submit" className={`${WIN98.btn} w-full py-2 font-bold flex items-center justify-center gap-2`}>
                💾 Beállítások Mentése
            </button>
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

    const isActive = (opt) => time === opt.replace('p', 'perc');

    return (
        <fieldset className={`border-2 border-white border-l-gray-500 border-t-gray-500 p-2 mb-4`}>
            <legend className="px-1 font-bold text-xs text-black">Gyors Kiszállítási Idő</legend>
            <div className="flex items-center justify-between gap-4 p-2">
                <div className="flex items-center gap-3 bg-black text-green-500 font-mono px-4 py-2 border-4 border-gray-400 border-inset">
                    <p className="text-xl font-bold tracking-widest">{time}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                    {["15 p", "30 p", "45 p", "60 p", "60+ p"].map(opt => (
                        <button
                            key={opt}
                            onClick={() => handleSet(opt)}
                            className={`${WIN98.btn} ${isActive(opt) ? 'font-bold border-black bg-white' : ''} `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </fieldset>
    );
}

// --- HELP MODAL (USER MANUAL) ---
function HelpModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />
            <div className={`${WIN98.windowBg} ${WIN98.borderOutset} w-full max-w-2xl pointer-events-auto shadow-xl max-h-[80vh] flex flex-col`}>
                <div className={WIN98.titleBar}>
                    <div className="flex items-center gap-2">
                        <span>📖 Súgó - FoodManager 98</span>
                    </div>
                    <button onClick={onClose} className={`${WIN98.btn} w-4 h-4 flex items-center justify-center leading-none pb-1`}>x</button>
                </div>

                <div className="p-4 overflow-y-auto bg-white border-2 border-inset border-gray-400 m-1 flex-1 text-sm font-sans leading-relaxed">
                    <h1 className="text-xl font-bold mb-4 border-b-2 border-black pb-1">Használati Útmutató</h1>

                    <section className="mb-6">
                        <h2 className="font-bold bg-blue-800 text-white px-1 mb-2">1. Rendelések (Orders)</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Értesítés:</strong> Új rendeléskor csengés hallható, és a sor <span className="bg-yellow-300 px-1 font-bold">SÁRGA</span> színűvé válik.</li>
                            <li><strong>Státuszok:</strong>
                                <ul className="list-circle pl-5 mt-1 text-black">
                                    <li><span className="bg-red-600 text-white px-1 text-xs">ÚJ</span>: Azonnal reagálni kell!</li>
                                    <li><span className="bg-yellow-200 px-1 text-xs">ELFOGADVA</span>: Készítés alatt.</li>
                                    <li><span className="bg-green-200 px-1 text-xs">KÉSZ</span>: Kiszállítva.</li>
                                </ul>
                            </li>
                            <li><strong>Nyomtatás:</strong> A 🖨️ gombbal blokk nyomtatható.</li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h2 className="font-bold bg-blue-800 text-white px-1 mb-2">2. Egyéb Funkciók</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Étlap:</strong> Mappák (Kategóriák) és Fájlok (Ételek).</li>
                            <li><strong>Profil:</strong> Nyitvatartás és Szállítási idő beállítása.</li>
                        </ul>
                    </section>

                    <div className="p-2 flex justify-end">
                        <button onClick={onClose} className={`${WIN98.btn} w-24 border-black font-bold`}>OK</button>
                    </div>
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

                <div className="p-4 bg-white border-2 border-inset border-gray-400 m-1 flex-1 text-sm font-sans max-h-[70vh] overflow-y-auto">
                    {/* Header Info */}
                    <div className="flex justify-between items-start border-b-2 border-gray-200 pb-2 mb-2">
                        <div>
                            <h2 className="text-xl font-bold">{order.customer_name}</h2>
                            <p className="text-black">{order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg font-bold">{order.total_price} Ft</p>
                            <p className="text-xs text-black">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mb-4 bg-yellow-50 p-2 border border-yellow-200">
                        <p className="font-bold text-xs text-black uppercase">Szállítási Cím:</p>
                        <p className="text-lg leading-tight">{order.customer_address}</p>
                        {order.customer_note && (
                            <p className="mt-2 text-red-600 font-bold">⚠️ Megjegyzés: {order.customer_note}</p>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                        <p className="font-bold text-xs text-black uppercase mb-1">Rendelt Tételek:</p>
                        <ul className="space-y-1 border-t border-gray-200 pt-1">
                            {order.items?.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-bold">{item.quantity}x {item.name}</span>
                                    <span>{item.price * item.quantity} Ft</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-2 gap-2 flex flex-wrap justify-end bg-gray-200">
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
                        <label className="text-xs font-bold text-black">Keresés (Név, Cím, Tel):</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                className={`flex-1 ${WIN98.borderInset} px-2 py-1 text-sm bg-white outline-none`}
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
            <div className={`flex-1 ${WIN98.borderInset} bg-white overflow-y-auto`}>
                {hasSearched && results.length === 0 ? (
                    <div className="p-10 text-center text-black">
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
                                    <td className="p-1 border-r border-gray-200 text-right font-mono">{order.total_price} Ft</td>
                                    <td className="p-1 text-center text-xs">
                                        <span className={`px-1 rounded-sm
                                            ${order.status === 'delivered' ? 'bg-green-200 text-black' :
                                                order.status === 'rejected' ? 'bg-red-200 text-black' : 'bg-gray-200 text-black'}
                                         `}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!hasSearched && (
                                <tr className="text-black italic">
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
                <div className={`p-4 ${WIN98.borderInset} bg-white`}>
                    <p className="text-sm mb-4 text-gray-600">
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
                <div className={`p-4 ${WIN98.borderInset} bg-white`}>
                    <p className="text-sm mb-4 text-gray-600">
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
                        <div className={`p-4 ${WIN98.borderInset} bg-white space-y-3 mt-1`}>
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
