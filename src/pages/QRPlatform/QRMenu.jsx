import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoRestaurant, IoCartOutline, IoAdd, IoRemove, IoClose,
    IoCheckmarkCircle, IoTimeOutline, IoCallOutline, IoCardOutline,
    IoAlertCircle, IoLeaf
} from 'react-icons/io5';
import { supabase, supabaseGuest } from '../../lib/supabaseClient';
import {
    getQRRestaurant,
    getQRMenu,
    getOrCreateTableSession,
    addItemsToOrder,
    callWaiter,
    requestPayment
} from '../../api/qrService';
import toast, { Toaster } from 'react-hot-toast';

// ─────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────
const C = {
    bg: 'bg-[#0a0a0a]',
    surface: 'bg-[#141414]',
    card: 'bg-[#1c1c1c]',
    border: 'border-[#2a2a2a]',
    accentText: 'text-amber-400',
    muted: 'text-zinc-500',
    text: 'text-zinc-100',
    subtext: 'text-zinc-400',
};

// ══════════════════════════════════════════════════════════
// GUEST INTERFACE
// Reads from: qr_restaurants, qr_menu_categories,
//             qr_menu_items, qr_orders
// ZERO connection to EATS restaurants / menu_items tables
// ══════════════════════════════════════════════════════════
export default function QRMenu() {
    const { restaurantId, tableId } = useParams();
    // Note: restaurantId here is the qr_restaurants.id (NOT the EATS restaurants.id)

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [introFinished, setIntroFinished] = useState(false);
    const [error, setError] = useState(null);

    const [activeCategory, setActiveCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ── Load ──────────────────────────────────────────────
    useEffect(() => {
        // Minimum intro time
        const timer = setTimeout(() => setIntroFinished(true), 3500);

        if (!restaurantId || !tableId) {
            setError('Érvénytelen QR kód. Kérj segítséget a személyzettől.');
            setLoading(false);
            return;
        }

        let retryCount = 0;

        const init = async () => {
            let isAbort = false;
            try {
                // Fetch from qr_restaurants — NOT from EATS restaurants!
                const rest = await getQRRestaurant(restaurantId);
                if (!rest) throw new Error('Az étterem nem található a rendszerben.');

                setRestaurant(rest);
                document.title = `${rest.name} – Digitális Étlap`;

                // Fetch isolated QR menu (qr_menu_categories + qr_menu_items)
                const menuData = await getQRMenu(restaurantId);
                setMenu(menuData);
                if (menuData.length > 0) setActiveCategory(menuData[0].id);

                // Get or create today's table session (qr_orders)
                const sess = await getOrCreateTableSession(restaurantId, decodeURIComponent(tableId));
                setSession(sess);

            } catch (e) {
                console.error(e);
                // Supabase GoTrue Auth is known to throw AbortError on React StrictMode fast-refreshes
                if (e.name === 'AbortError' || e.message?.includes('AbortError')) {
                    if (retryCount < 3) {
                        retryCount++;
                        isAbort = true;
                        console.log(`Gyors újratöltés miatti megszakítás, újrapróbálkozás (${retryCount}/3)...`);
                        setTimeout(init, 500);
                        return;
                    } else {
                        console.error('Túl sok újrapróbálkozás, az oldal betöltése megszakadt.');
                    }
                }
                setError(e.message || 'Hiba az oldal betöltésekor. Frissítsd az oldalt!');
            } finally {
                // Csak akkor állítjuk le a töltést, ha nem AbortError miatti újrapróbálkozás zajlik
                if (!isAbort) {
                    setLoading(false);
                }
            }
        };

        init();
    }, [restaurantId, tableId]);

    // ── Realtime session updates ──────────────────────────
    useEffect(() => {
        if (!session?.id) return;

        const channel = supabaseGuest
            .channel(`qr-guest-${session.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'qr_orders',
                filter: `id=eq.${session.id}`
            }, (payload) => setSession(payload.new))
            .subscribe();

        return () => supabaseGuest.removeChannel(channel);
    }, [session?.id]);
    // ── Notify when item is served ────────────────────────
    const lastItemsRef = useRef(session?.items || []);
    useEffect(() => {
        if (!session?.items) return;
        
        const oldItems = lastItemsRef.current;
        const newItems = session.items;

        newItems.forEach(newItem => {
            const oldItem = oldItems.find(o => o.uid === newItem.uid);
            // Ha korábban nem volt kiment, de most igen
            if (newItem.served && (!oldItem || !oldItem.served)) {
                toast.success(`Megérkezett: ${newItem.name}! 🍽️`, {
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #f59e0b40',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        padding: '12px 20px'
                    }
                });
            }
        });

        lastItemsRef.current = newItems;
    }, [session?.items]);

    // ── Cart helpers ──────────────────────────────────────
    const addToCart = useCallback((item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
        });
        toast.success(`${item.name}`, { duration: 1000, icon: '🛒' });
    }, []);

    const removeFromCart = useCallback((itemId) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (!existing) return prev;
            if (existing.qty <= 1) return prev.filter(i => i.id !== itemId);
            return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
        });
    }, []);

    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const cartCount = cart.reduce((s, i) => s + i.qty, 0);

    // ── Submit order ──────────────────────────────────────
    const submitOrder = async () => {
        if (!session || cart.length === 0) return;
        setSubmitting(true);
        try {
            const updated = await addItemsToOrder(session.id, cart, session.items || []);
            setSession(updated);
            setCart([]);
            setShowCart(false);
            toast.success('Rendelés leadva! 🍽️', { duration: 3000 });
        } catch {
            toast.error('Hiba a rendelés leadásakor.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Service ───────────────────────────────────────────
    const handleCallWaiter = async () => {
        if (!session) return;
        try {
            await callWaiter(session.id);
            toast('Pincér hívva! 🙋', { duration: 2000, position: 'top-center' });
            setShowServiceModal(false);
        } catch { toast.error('Hiba történt.'); }
    };

    const handleRequestPayment = async (method) => {
        if (!session) return;
        try {
            await requestPayment(session.id, method);
            toast('Fizetési igény elküldve! 💳', { duration: 2000, position: 'top-center' });
            setShowServiceModal(false);
        } catch { toast.error('Hiba történt.'); }
    };

    const activeItems = menu.find(c => c.id === activeCategory)?.items || [];
    const sessionItems = session?.items || [];
    const sessionTotal = sessionItems.reduce((s, i) => s + i.price * i.qty, 0);
    const isPayReq = session?.status === 'payment_requested';
    const isPaid = session?.status === 'paid';

    return (
        <AnimatePresence mode="wait">
            {error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ErrorScreen message={error} />
                </motion.div>
            ) : (loading || !introFinished) ? (
                <motion.div 
                    key="loader" 
                    initial={{ opacity: 1 }} 
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} 
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100]"
                >
                    <BrutalLoader />
                </motion.div>
            ) : isPaid ? (
                <motion.div key="paid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`min-h-screen ${C.bg} ${C.text} font-sans flex flex-col items-center justify-center p-6 text-center`}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <IoCheckmarkCircle className="text-6xl text-green-500" />
                    </motion.div>
                    <h1 className="text-2xl font-black mb-2">Asztal lezárva</h1>
                    <p className={`${C.muted} mb-8 max-w-xs mx-auto`}>Rendelésed kifizetve! Köszönjük a látogatást, reméljük, jól érezted magad!</p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${C.accentText}`}>visitKőszeg</p>
                </motion.div>
            ) : (
                <motion.div 
                    key="menu" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.8 }}
                    className={`min-h-screen ${C.bg} ${C.text} font-sans`}
                >
                    <Toaster position="top-center" toastOptions={{
                        style: { background: '#1c1c1c', color: '#fff', border: '1px solid #2a2a2a' }
                    }} />


            {/* ── HEADER ── */}
            <header className={`sticky top-0 z-30 ${C.surface} border-b ${C.border} px-4 py-3`}>
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${C.accentText}`}>
                            visitKőszeg · Digitális Étlap
                        </p>
                        <h1 className="text-base font-black leading-tight">{restaurant?.name}</h1>
                        <p className={`text-xs ${C.muted}`}>🪑 {decodeURIComponent(tableId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowServiceModal(true)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border ${C.border} 
                                ${C.subtext} hover:border-amber-500/50 hover:text-amber-400 transition-colors`}
                        >
                            Segítség
                        </button>
                        {cartCount > 0 && (
                            <button onClick={() => setShowCart(true)}
                                className="relative flex items-center gap-1.5 text-xs font-black px-3 py-1.5 
                                    rounded-full bg-amber-500 text-black">
                                <IoCartOutline className="text-base" />
                                <span>{cartCount}</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── SERVICE CAPSULE ── */}
            <AnimatePresence>
                {(isPayReq || session?.waiter_called) && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
                        <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border
                            ${isPayReq ? 'bg-blue-600 text-white border-blue-500/50' : 'bg-amber-500 text-black border-amber-400/50'}`}>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                                {isPayReq ? <IoCardOutline className="text-xl" /> : <IoCallOutline className="text-xl" />}
                            </div>
                            <div>
                                <p className="font-black text-sm">Kollégánk azonnal érkezik Önhöz!</p>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                                    {isPayReq ? `Fizetés (${session.notes || 'Kártya / Készpénz'})` : 'Segítségkérés'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CONTENT ── */}
            <div className="max-w-lg mx-auto pb-32">

                {/* Category tabs */}
                {menu.length > 0 && (
                    <div className={`sticky top-[68px] z-20 ${C.bg} py-3 px-4 overflow-x-auto`}>
                        <div className="flex gap-2 w-max">
                            {menu.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black
                                        whitespace-nowrap transition-all
                                        ${activeCategory === cat.id
                                            ? 'bg-amber-500 text-black'
                                            : `${C.card} ${C.subtext} hover:text-white border ${C.border}`
                                        }`}>
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu items */}
                <div className="px-4 space-y-3 mt-2">
                    {menu.length === 0 && (
                        <div className={`text-center py-20 ${C.muted}`}>
                            <IoRestaurant className="text-4xl mx-auto mb-3 opacity-30" />
                            <p className="font-black">Az étlap jelenleg nem elérhető</p>
                            <p className="text-xs mt-1">Kérd a pincér segítségét!</p>
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        {activeItems.map((item, i) => (
                            <motion.div key={item.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`${C.card} border ${C.border} rounded-2xl overflow-hidden flex items-stretch`}>
                                {item.image_url && (
                                    <img src={item.image_url} alt={item.name}
                                        className="w-24 h-24 object-cover shrink-0" />
                                )}
                                <div className="flex-1 p-3 flex flex-col justify-between">
                                    <div>
                                        <p className="font-black text-sm leading-snug">{item.name}</p>
                                        {item.description && (
                                            <p className={`text-xs ${C.muted} mt-0.5 line-clamp-2`}>{item.description}</p>
                                        )}
                                        {item.allergens?.length > 0 && (
                                            <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                                <IoLeaf className="text-green-500" />{item.allergens.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`font-black text-sm ${C.accentText}`}>
                                            {(item.price || 0).toLocaleString('hu-HU')} Ft
                                        </span>
                                        <CartControl item={item} cart={cart}
                                            onAdd={() => addToCart(item)}
                                            onRemove={() => removeFromCart(item.id)} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Session order summary */}
                {sessionItems.length > 0 && (
                    <div className="px-4 mt-8">
                        <button onClick={() => setShowOrderSummary(v => !v)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl ${C.card} border ${C.border}`}>
                            <div className="flex items-center gap-2">
                                <IoTimeOutline className={`text-xl ${C.accentText}`} />
                                <div className="text-left">
                                    <p className="font-black text-sm">Leadott rendelések</p>
                                    <p className={`text-xs ${C.muted}`}>{sessionItems.length} tétel · {sessionTotal.toLocaleString('hu-HU')} Ft</p>
                                </div>
                            </div>
                            <span className={`text-xs ${C.muted}`}>{showOrderSummary ? '▲' : '▼'}</span>
                        </button>
                        <AnimatePresence>
                            {showOrderSummary && (
                                <motion.div initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className={`mt-2 ${C.card} border ${C.border} rounded-2xl divide-y divide-[#2a2a2a]`}>
                                        {sessionItems.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {item.served
                                                        ? <IoCheckmarkCircle className="text-green-500 shrink-0" />
                                                        : <IoTimeOutline className={`${C.muted} shrink-0`} />
                                                    }
                                                    <span className="text-sm">{item.qty}× {item.name}</span>
                                                </div>
                                                <span className={`text-sm font-black ${item.served ? 'text-green-400' : C.accentText}`}>
                                                    {(item.price * item.qty).toLocaleString('hu-HU')} Ft
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between px-4 py-3 font-black">
                                            <span>Összesen</span>
                                            <span className={C.accentText}>{sessionTotal.toLocaleString('hu-HU')} Ft</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── FOOTER LINK ── */}
                <div className="mt-16 mb-28 px-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Fedezd fel a várost</p>
                    <h3 className="text-xl font-black mb-3">Többet hoznál ki a pihenésből?</h3>
                    <p className={`text-sm ${C.muted} mb-6 max-w-sm mx-auto`}>
                        Látnivalók, programok, érdekességek és exkluzív kedvezmények egy helyen – a digitális idegenvezetőd a zsebedben!
                    </p>
                    <a href="https://visitkoszeg.hu" target="_blank" rel="noopener noreferrer"
                        className="inline-block bg-amber-500 text-black px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Irány a visitKőszeg →
                    </a>
                </div>
            </div>

            {/* ── CART PANEL ── */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/70 z-40" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`fixed bottom-0 left-0 right-0 z-50 ${C.surface} border-t ${C.border} 
                                rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black">Rendelés áttekintése</h2>
                                <button onClick={() => setShowCart(false)} className={`${C.muted} hover:text-white`}>
                                    <IoClose className="text-xl" />
                                </button>
                            </div>
                            <div className={`divide-y divide-[#2a2a2a]`}>
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-black text-sm">{item.name}</p>
                                            <p className={`text-xs ${C.muted}`}>{item.price.toLocaleString('hu-HU')} Ft / db</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => removeFromCart(item.id)}
                                                className={`w-7 h-7 rounded-full ${C.card} border ${C.border} flex items-center justify-center`}>
                                                <IoRemove className="text-sm" />
                                            </button>
                                            <span className="font-black w-4 text-center">{item.qty}</span>
                                            <button onClick={() => addToCart(item)}
                                                className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center">
                                                <IoAdd className="text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                <div className="flex justify-between font-black text-lg mb-4">
                                    <span>Összesen</span>
                                    <span className={C.accentText}>{cartTotal.toLocaleString('hu-HU')} Ft</span>
                                </div>
                                <button onClick={submitOrder} disabled={submitting}
                                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-base 
                                        active:scale-95 transition-transform disabled:opacity-50">
                                    {submitting ? 'Leadás...' : '🛎️ Rendelés leadása'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── SERVICE MODAL ── */}
            <AnimatePresence>
                {showServiceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowServiceModal(false)} className="absolute inset-0 bg-black/70 z-40" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`relative z-50 w-full max-w-sm ${C.surface} border ${C.border} 
                                rounded-3xl p-6 mx-auto`}>
                            <h2 className="text-lg font-black mb-1">Miben segíthetünk?</h2>
                            <p className={`text-xs ${C.muted} mb-5`}>🪑 {decodeURIComponent(tableId)}</p>
                            <div className="space-y-3">
                                <button onClick={handleCallWaiter}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl ${C.card} border ${C.border}
                                        hover:border-amber-500/50 transition-colors text-left`}>
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                                        <IoCallOutline className="text-black text-xl" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">Pincér hívása</p>
                                        <p className={`text-xs ${C.muted}`}>Személyes segítség kérése</p>
                                    </div>
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleRequestPayment('Készpénz')}
                                        disabled={!sessionItems.length || isPayReq || isPaid}
                                        className={`p-4 rounded-2xl ${C.card} border ${C.border} flex flex-col items-center justify-center gap-2
                                            hover:border-blue-500/50 transition-colors disabled:opacity-40`}>
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                                            <span className="text-xl font-black">Ft</span>
                                        </div>
                                        <p className="font-black text-sm">Készpénz</p>
                                    </button>
                                    <button onClick={() => handleRequestPayment('Bankkártya')}
                                        disabled={!sessionItems.length || isPayReq || isPaid}
                                        className={`p-4 rounded-2xl ${C.card} border ${C.border} flex flex-col items-center justify-center gap-2
                                            hover:border-blue-500/50 transition-colors disabled:opacity-40`}>
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                                            <IoCardOutline className="text-2xl" />
                                        </div>
                                        <p className="font-black text-sm">Bankkártya</p>
                                    </button>
                                </div>
                                {(!sessionItems.length || isPayReq || isPaid) && (
                                    <p className={`text-center text-xs ${C.muted} px-2`}>
                                        {isPaid ? 'Már kifizetve ✅' : isPayReq ? 'Kérés már elküldve' : `Végösszeg: ${sessionTotal.toLocaleString('hu-HU')} Ft`}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setShowServiceModal(false)}
                                className={`w-full text-center mt-4 py-2 text-sm ${C.muted} hover:text-white transition-colors`}>
                                Mégse
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── FLOATING CART BAR ── */}
            {cartCount > 0 && !showCart && (
                <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
                    className="fixed bottom-6 inset-x-4 z-30 max-w-lg mx-auto">
                    <button onClick={() => setShowCart(true)}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl 
                            bg-amber-500 text-black font-black shadow-2xl shadow-amber-500/30">
                        <span className="bg-black/20 rounded-xl px-2 py-0.5 text-sm">{cartCount} tétel</span>
                        <span>Rendelés áttekintése</span>
                        <span className="text-sm">{cartTotal.toLocaleString('hu-HU')} Ft</span>
                    </button>
                </motion.div>
            )}
        </motion.div>
    )}
</AnimatePresence>
    );
}
// ── Sub-components ────────────────────────────

function CartControl({ item, cart, onAdd, onRemove }) {
    const inCart = cart.find(i => i.id === item.id);
    if (!inCart) {
        return (
            <button onClick={onAdd}
                className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center">
                <IoAdd className="text-lg" />
            </button>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <button onClick={onRemove}
                className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <IoRemove className="text-sm" />
            </button>
            <span className="font-black text-sm w-4 text-center">{inCart.qty}</span>
            <button onClick={onAdd}
                className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center">
                <IoAdd className="text-sm" />
            </button>
        </div>
    );
}

// ── Brutal Loader ─────────────────────────────
function BrutalLoader() {
    return (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence>
                <div className="relative flex flex-col items-center">
                    {/* Background Glow (Minimal, and NOT pulsing) */}
                    <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full scale-150" />
                    
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
                        }}
                        className="relative"
                    >
                        <motion.p 
                            initial={{ letterSpacing: "0.1em" }}
                            animate={{ 
                                letterSpacing: "0.6em",
                                transition: { duration: 2.5, ease: "easeOut" }
                            }}
                            className="text-[10px] font-black uppercase text-amber-500/80 mb-4 ml-[0.6em]"
                        >
                            visitKőszeg
                        </motion.p>
                        
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-700 to-transparent mx-auto" />
                        
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                transition: { delay: 0.5, duration: 1.5 } 
                            }}
                            className="text-white text-3xl font-black tracking-tighter mt-6"
                        >
                            Digitális Pincér
                        </motion.h2>

                        {/* Minimal geometric detail */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: 40 }}
                            transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
                            className="h-[1px] bg-amber-500/30 mx-auto mt-6"
                        />
                    </motion.div>
                </div>
            </AnimatePresence>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                Digitális Étlap
            </p>
        </div>
    );
}

function ErrorScreen({ message }) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-8 text-center">
            <IoAlertCircle className="text-5xl text-red-500" />
            <p className="text-zinc-400 text-sm max-w-xs">{message}</p>
        </div>
    );
}
