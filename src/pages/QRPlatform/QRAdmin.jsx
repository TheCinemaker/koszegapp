import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoRestaurant, IoAdd, IoClose, IoCheckmarkCircle, IoTimeOutline,
    IoCardOutline, IoTrashOutline, IoPencil, IoAlertCircle,
    IoLogOutOutline, IoChevronDown, IoChevronUp,
    IoEyeOutline, IoEyeOffOutline, IoStorefrontOutline, IoRefresh
} from 'react-icons/io5';
import { supabase } from '../../lib/supabaseClient';
import {
    getMyQRRestaurant, registerQRRestaurant,
    getActiveOrders, getQRMenuAdmin,
    markItemServed, closeTable, acknowledgeWaiterCall,
    saveQRCategory, deleteQRCategory,
    saveQRItem, deleteQRItem, toggleQRItemAvailability,
    uploadQRItemImage
} from '../../api/qrService';
import toast, { Toaster } from 'react-hot-toast';

// ─────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────
const C = {
    bg: 'bg-zinc-950',
    surface: 'bg-zinc-900',
    card: 'bg-zinc-800',
    border: 'border-zinc-700/50',
    accentText: 'text-amber-400',
    text: 'text-zinc-100',
    muted: 'text-zinc-500',
    subtext: 'text-zinc-400',
    btn: 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
};

const TABS = [
    { id: 'tables', label: '🪑 Asztalok' },
    { id: 'menu', label: '📋 Étlap szerkesztő' },
    { id: 'links', label: '🔗 Asztal linkek' },
];

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function QRAdmin() {
    const [authUser, setAuthUser] = useState(null);
    const [qrRestaurant, setQrRestaurant] = useState(null);
    const [verifying, setVerifying] = useState(true);
    const [activeTab, setActiveTab] = useState('tables');

    // ── LIFTED ORDER STATE ────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [connStatus, setConnStatus] = useState('connecting');
    const [isBusy, setIsBusy] = useState(false);
    const [syncNonce, setSyncNonce] = useState(0); // Forces local component reset

    const loadOrders = useCallback(async (isManual = false) => {
        if (!qrRestaurant?.id) return;
        if (isManual) setRefreshing(true);
        try {
            const data = await getActiveOrders(qrRestaurant.id);
            setOrders(data);
            if (isManual) toast.success('Adatok frissítve!');
        } catch { toast.error('Hiba a rendelések betöltésekor.'); }
        finally { 
            setLoadingOrders(false); 
            setRefreshing(false);
        }
    }, [qrRestaurant?.id]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Auto-refresh is now handled by the isolated HeaderTimer component 
    // to prevent the entire dashboard from re-rendering every second.

    // Realtime subscription
    useEffect(() => {
        if (!qrRestaurant?.id) return;
        const channel = supabase
            .channel(`qradmin-${qrRestaurant.id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'qr_orders',
                filter: `qr_restaurant_id=eq.${qrRestaurant.id}`
            }, (payload) => {
                const newOrder = payload.new;
                const closed = ['paid', 'cancelled'];
                if (payload.eventType === 'INSERT' && !closed.includes(newOrder.status)) {
                    setOrders(prev => [newOrder, ...prev]);
                    toast('🪑 Új asztal aktiválva!', { icon: '🔔' });
                } else if (payload.eventType === 'UPDATE') {
                    if (closed.includes(newOrder.status)) {
                        setOrders(prev => prev.filter(o => o.id !== newOrder.id));
                    } else {
                        setOrders(prev => prev.map(o => o.id === newOrder.id ? newOrder : o));
                    }
                }
            })
            .subscribe((status) => {
                setConnStatus(status);
            });
        return () => supabase.removeChannel(channel);
    }, [qrRestaurant?.id]);

    // ── Focus Recovery ────────────────────────────────────
    // When the tab is backgrounded, timers and connections might freeze.
    // This effect ensures that when the user returns, the UI is "un-stuck".
    useEffect(() => {
        const handleWakeUp = () => {
            if (document.visibilityState === 'visible' || document.hasFocus()) {
                setRefreshing(false);
                setIsBusy(false);
                setSyncNonce(n => n + 1); // Trigger local resets
                if (qrRestaurant?.id) {
                    loadOrders(true);
                    toast.loading('Kapcsolat frissítése...', { duration: 1000, id: 'sync-toast' });
                }
            }
        };

        window.addEventListener('focus', handleWakeUp);
        window.addEventListener('visibilitychange', handleWakeUp);
        return () => {
            window.removeEventListener('focus', handleWakeUp);
            window.removeEventListener('visibilitychange', handleWakeUp);
        };
    }, [qrRestaurant?.id, loadOrders]);

    // ── Auth: Direct Supabase, NO global useAuth() ────────
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setAuthUser(session.user);
                // Look up from qr_restaurants ONLY – NOT from restaurants!
                const rest = await getMyQRRestaurant(session.user.id);
                setQrRestaurant(rest);
                if (rest) document.title = `${rest.name} – Digitális Pincér`;
            }
            setVerifying(false);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setAuthUser(session.user);
                const rest = await getMyQRRestaurant(session.user.id);
                setQrRestaurant(rest);
            } else {
                setAuthUser(null);
                setQrRestaurant(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        toast.success('Kijelentkezve');
    }, []);

    const handleRegistered = useCallback((restaurant) => {
        setQrRestaurant(restaurant);
        document.title = `${restaurant.name} – Digitális Pincér`;
    }, []);

    const resetCountdown = useCallback(() => {
        // We trigger an event or use a ref if needed, but for now 
        // shifting most countdown logic inside the sub-component.
    }, []);

    // ── Render states ─────────────────────────────────────
    if (verifying) return <FullScreenLoader label="Hitelesítés..." />;

    // 1. Nincs bejelentkezve → saját login (NEM /eats-auth!)
    if (!authUser) return <QRLoginScreen />;

    // 2. Be van lépve, de nincs qr_restaurant regisztrálva → regisztrációs form
    if (!qrRestaurant) return (
        <QRRegisterScreen
            userId={authUser.id}
            userEmail={authUser.email}
            onRegistered={handleRegistered}
            onLogout={handleLogout}
        />
    );

    // 3. Minden rendben → admin dashboard
    return (
        <div className={`min-h-screen ${C.bg} ${C.text} font-sans`}>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#27272a', color: '#fff', border: '1px solid #3f3f46' }
            }} />

            <header className={`${C.surface} border-b ${C.border} px-4 py-3 sticky top-0 z-30`}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${C.accentText}`}>
                            visitKőszeg · Digitális Pincér
                        </p>
                        <h1 className="font-black text-base">{qrRestaurant.name}</h1>
                    </motion.div>
                    <button onClick={handleLogout}
                        className={`flex items-center gap-1.5 ${C.muted} hover:text-white text-xs font-bold transition-colors`}>
                        <IoLogOutOutline /> Kilépés
                    </button>
                </div>
                <div className="max-w-6xl mx-auto flex items-center justify-between mt-3">
                    <div className="flex gap-1">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-amber-500 text-black'
                                        : `${C.card} ${C.subtext} border ${C.border} hover:text-white`}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'tables' && (
                        <HeaderTimer 
                            onRefresh={() => loadOrders(true)} 
                            refreshing={refreshing} 
                            isBusy={isBusy}
                        />
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 transition-all">
                {activeTab === 'tables' && (
                    <TablesView 
                        qrRestaurantId={qrRestaurant.id} 
                        orders={orders} 
                        loading={loadingOrders}
                        connStatus={connStatus}
                        setIsBusy={setIsBusy}
                    />
                )}
                {activeTab === 'menu' && <MenuEditor qrRestaurantId={qrRestaurant.id} />}
                {activeTab === 'links' && <QRLinksView qrRestaurant={qrRestaurant} />}
            </main>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: HeaderTimer (Isolated countdown to avoid re-renders)
// ─────────────────────────────────────────────────────────────
const HeaderTimer = memo(({ onRefresh, refreshing, isBusy }) => {
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (refreshing || isBusy) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onRefresh();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [refreshing, isBusy, onRefresh]);

    // Reset when manually refreshed
    useEffect(() => {
        if (refreshing) setTimeLeft(60);
    }, [refreshing]);

    return (
        <button 
            onClick={onRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${C.border} ${C.card} 
                text-[10px] font-black transition-all active:scale-95 disabled:opacity-50
                ${refreshing ? '' : 'hover:border-zinc-500'}`}
        >
            <IoRefresh className={refreshing ? '' : ''} />
            <span className="hidden sm:inline">Kényszerített frissítés</span>
            <span className={`min-w-[1.5rem] ${timeLeft < 10 ? 'text-amber-500' : 'text-zinc-500'}`}>{timeLeft}s</span>
        </button>
    );
});

// ══════════════════════════════════════════════
// SAJÁT LOGIN KÉPERNYŐ
// ══════════════════════════════════════════════
function QRLoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('login'); // 'login' | 'signup'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (mode === 'login') {
            const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
            if (authErr) setError('Hibás email vagy jelszó.');
        } else {
            const { error: authErr } = await supabase.auth.signUp({ email, password });
            if (authErr) setError('Regisztráció sikertelen: ' + authErr.message);
            else toast.success('Fiók létrehozva! Kérjük erősítsd meg az emailt, majd lépj be.');
        }
        setLoading(false);
    };

    return (
        <div className={`min-h-screen ${C.bg} flex items-center justify-center px-4`}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IoStorefrontOutline className="text-3xl text-amber-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-2">visitKőszeg</p>
                    <h1 className="text-2xl font-black text-white">Digitális Pincér</h1>
                    <p className={`text-sm mt-1 ${C.muted}`}>
                        {mode === 'login' ? 'Étterem admin belépés' : 'Új fiók regisztrálása'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Email cím</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="etterem@email.hu"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                                text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Jelszó</label>
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} required value={password}
                                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 pr-10 text-sm
                                    text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors" />
                            <button type="button" onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                {showPw ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold
                            bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2">
                            <IoAlertCircle className="shrink-0" /> {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-black text-sm
                            active:scale-95 transition-transform disabled:opacity-50">
                        {loading ? '...' : mode === 'login' ? 'Belépés →' : 'Fiók létrehozása →'}
                    </button>
                </form>

                <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
                    className={`w-full text-center mt-5 text-xs ${C.muted} hover:text-white transition-colors`}>
                    {mode === 'login' ? 'Még nincs fiókom → Regisztráció' : '← Vissza a belépéshez'}
                </button>
            </motion.div>
        </div>
    );
}

// ══════════════════════════════════════════════
// ÉTTEREM REGISZTRÁCIÓS KÉPERNYŐ
// (qr_restaurants táblába ment – NEM restaurants!)
// ══════════════════════════════════════════════
function QRRegisterScreen({ userId, userEmail, onRegistered, onLogout }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Az étterem neve kötelező.'); return; }
        setLoading(true);
        try {
            const rest = await registerQRRestaurant({ userId, name, address, phone });
            onRegistered(rest);
            toast.success('Étterem sikeresen regisztrálva! 🎉');
        } catch (err) {
            setError('Hiba a regisztrációkor: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${C.bg} flex items-center justify-center px-4`}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IoStorefrontOutline className="text-3xl text-amber-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-1">Digitális Pincér</p>
                    <h1 className="text-xl font-black text-white">Étterem regisztrálása</h1>
                    <p className={`text-xs mt-1 ${C.muted}`}>{userEmail}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Étterem neve *</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            placeholder="pl. Kőszegi Söröző"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                                text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Cím</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                            placeholder="pl. Kőszeg, Fő tér 1."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                                text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Telefonszám</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="+36 30 123 4567"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                                text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 transition-colors" />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold
                            bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2">
                            <IoAlertCircle className="shrink-0" /> {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-4 rounded-xl bg-amber-500 text-black font-black text-sm
                            active:scale-95 transition-transform disabled:opacity-50">
                        {loading ? 'Regisztrálás...' : '🚀 Étterem aktiválása'}
                    </button>
                </form>

                <button onClick={onLogout}
                    className={`w-full text-center mt-5 text-xs ${C.muted} hover:text-white transition-colors`}>
                    Kilépés
                </button>
            </motion.div>
        </div>
    );
}

// ══════════════════════════════════════════════
// TAB 3: ASZTAL LINKEK & QR GENERATOR
// ══════════════════════════════════════════════
function QRLinksView({ qrRestaurant }) {
    const [tableInput, setTableInput] = useState('');
    const [tables, setTables] = useState(['1-es', '2-es', '3-as', 'VIP-1', 'Terasz-1']);
    const BASE = window.location.origin;

    const makeLink = (tableId) =>
        `${BASE}/menu/${qrRestaurant.id}/${encodeURIComponent(tableId)}`;

    const copyLink = (tableId) => {
        navigator.clipboard.writeText(makeLink(tableId));
        toast.success(`🔗 Link másolva: ${tableId}`);
    };

    const addTable = () => {
        const t = tableInput.trim();
        if (!t) return;
        if (tables.includes(t)) { toast.error('Ez az asztal már szerepel a listán.'); return; }
        setTables(prev => [...prev, t]);
        setTableInput('');
    };

    const removeTable = (t) => setTables(prev => prev.filter(x => x !== t));

    return (
        <div className="max-w-2xl space-y-6">
            {/* Restaurant ID info */}
            <div className={`${C.surface} border ${C.border} rounded-2xl p-5`}>
                <p className={`text-xs font-black uppercase tracking-widest ${C.accentText} mb-2`}>Étterem azonosító</p>
                <p className={`text-xs ${C.muted} mb-1`}>Ez az ID kell minden QR kódba (qr_restaurants.id):</p>
                <div className="flex items-center gap-3">
                    <code className={`flex-1 text-xs font-mono bg-zinc-800 border ${C.border} rounded-xl px-3 py-2.5 text-amber-300 break-all`}>
                        {qrRestaurant.id}
                    </code>
                    <button
                        onClick={() => { navigator.clipboard.writeText(qrRestaurant.id); toast.success('ID másolva!'); }}
                        className={`${C.btn} bg-zinc-700 text-zinc-300 hover:text-white border ${C.border} shrink-0`}>
                        Másolás
                    </button>
                </div>
            </div>

            {/* Table link generator */}
            <div className={`${C.surface} border ${C.border} rounded-2xl p-5`}>
                <p className={`text-xs font-black uppercase tracking-widest ${C.accentText} mb-1`}>Asztal linkek</p>
                <p className={`text-xs ${C.muted} mb-4`}>Minden asztalhoz generálj linket — ezt kell QR kódba tenni, vagy SMS-ben elküldeni.</p>

                {/* Add table */}
                <div className="flex gap-2 mb-4">
                    <input
                        value={tableInput}
                        onChange={e => setTableInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTable()}
                        placeholder="pl. 4-es, Terasz-2, VIP-2..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm
                            text-white placeholder-zinc-600 outline-none focus:border-amber-500/50 transition-colors"
                    />
                    <button onClick={addTable}
                        className={`${C.btn} bg-amber-500 text-black flex items-center gap-1`}>
                        <IoAdd /> Hozzáad
                    </button>
                </div>

                {/* Table list */}
                <div className="space-y-2">
                    {tables.map(tableId => (
                        <div key={tableId}
                            className={`flex items-center gap-3 p-3 ${C.card} border ${C.border} rounded-xl`}>
                            <span className="font-black text-sm shrink-0">🪑 {tableId}</span>
                            <code className={`flex-1 text-[10px] font-mono ${C.muted} truncate`}>
                                /menu/{qrRestaurant.id}/{encodeURIComponent(tableId)}
                            </code>
                            <div className="flex gap-1.5 shrink-0">
                                <button
                                    onClick={() => window.open(makeLink(tableId), '_blank')}
                                    className={`${C.btn} bg-zinc-700 text-zinc-300 text-[10px] hover:text-white border ${C.border}`}>
                                    Teszt
                                </button>
                                <button
                                    onClick={() => copyLink(tableId)}
                                    className={`${C.btn} bg-amber-500 text-black text-[10px]`}>
                                    Másolás
                                </button>
                                <button
                                    onClick={() => removeTable(tableId)}
                                    className={`${C.btn} ${C.card} text-red-400 border border-red-500/20 text-[10px]`}>
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* URL format explanation */}
            <div className={`${C.surface} border border-zinc-700/30 rounded-2xl p-5`}>
                <p className={`text-xs font-black uppercase tracking-widest text-zinc-500 mb-3`}>URL formátum</p>
                <code className={`text-xs font-mono text-zinc-400 block`}>
                    {BASE}/menu/<span className="text-amber-400">[étterem-id]</span>/<span className="text-blue-400">[asztal-neve]</span>
                </code>
                <p className={`text-xs ${C.muted} mt-3`}>
                    A vendég beolvassa a QR kódot → azonnal megnyílik a digitális étlap → rendelhet, pincért hívhat, fizethet. Bejelentkezés nem szükséges.
                </p>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════
const TablesView = memo(({ qrRestaurantId, orders, loading, connStatus, setIsBusy, syncNonce }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);

    const displayOrders = useMemo(() => {
        return Object.values(orders.reduce((acc, o) => {
            const current = acc[o.table_id];
            if (!current) {
                acc[o.table_id] = o;
            } else {
                const oLen = o.items?.length || 0;
                const cLen = current.items?.length || 0;
                if (oLen > cLen) acc[o.table_id] = o;
                else if (oLen === cLen && new Date(o.created_at) > new Date(current.created_at)) acc[o.table_id] = o;
            }
            return acc;
        }, {})).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }, [orders]);

    const handleSelect = useCallback((order) => {
        setSelectedOrder(s => s?.id === order.id ? null : order);
    }, []);

    const handleAck = useCallback(async (o) => { 
        setIsBusy(true);
        try { 
            const dupes = orders.filter(d => d.table_id === o.table_id);
            await Promise.race([
                Promise.all(dupes.map(dup => acknowledgeWaiterCall(dup.id))),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]);
        } catch (e) { 
            toast.error(e.message === 'Timeout' ? 'Időtúllépés! Próbáld újra.' : 'Hiba történt a jelzés nyugtázásakor.'); 
        } 
        finally { setIsBusy(false); }
    }, [orders, setIsBusy]);

    const handleServe = useCallback(async (o, itemId) => { 
        setIsBusy(true);
        try { 
            const dupes = orders.filter(d => d.table_id === o.table_id);
            await Promise.race([
                Promise.all(dupes.map(dup => markItemServed(dup.id, itemId, dup.items))),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]);
        } catch (e) { 
            toast.error(e.message === 'Timeout' ? 'A szerver nem válaszol. Próbáld újra!' : 'Hiba történt a felszolgáláskor.'); 
        } 
        finally { setIsBusy(false); }
    }, [orders, setIsBusy]);

    const handleClose = useCallback(async (id) => { 
        if (!window.confirm('Biztosan lezárod az asztalt?')) return;
        setIsBusy(true);
        try { 
            const target = displayOrders.find(o => o.id === id);
            const allIds = orders.filter(o => o.table_id === target.table_id).map(o => o.id);
            await Promise.race([
                Promise.all(allIds.map(dupId => closeTable(dupId))),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]);
            toast.success('✅ Asztal lezárva'); 
        } catch (e) { 
            toast.error(e.message === 'Timeout' ? 'Időtúllépés a lezárásnál!' : 'Hiba történt az asztal lezárásakor.'); 
        } 
        finally { setIsBusy(false); }
    }, [orders, displayOrders, setIsBusy]);

    if (loading) return <FullScreenLoader label="Rendelések betöltése..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black italic">Aktív asztalok</h2>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${C.border} bg-black/20`}>
                        <div className={`w-2 h-2 rounded-full ${
                            connStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
                            connStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {connStatus === 'SUBSCRIBED' ? 'Élő rendszer' : 'Megszakadt'}
                        </span>
                    </div>
                </div>
            </div>

            {displayOrders.length === 0 ? (
                <div className={`text-center py-24 ${C.muted}`}>
                    <IoRestaurant className="text-5xl mx-auto mb-4 opacity-20" />
                    <p className="font-black text-lg text-zinc-600">Nincs aktív asztal</p>
                    <p className="text-sm mt-1">A vendégek beolvasása után itt jelennek meg</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayOrders.map(order => (
                        <TableCard key={order.id} order={order}
                            selected={selectedOrder?.id === order.id}
                            onSelect={() => handleSelect(order)}
                            onServeItem={handleServe}
                            onCloseTable={handleClose}
                            onAck={handleAck}
                            syncNonce={syncNonce}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ══════════════════════════════════════════════
const TableCard = memo(({ order, selected, onSelect, onServeItem, onCloseTable, onAck, syncNonce }) => {
    const [working, setWorking] = useState(false);

    // Force-reset local loading state when a global sync happens
    useEffect(() => {
        setWorking(false);
    }, [syncNonce]);

    const unserved = order.items?.filter(i => !i.served) || [];
    const isPayReq = order.status === 'payment_requested';
    const waiterCalled = order.waiter_called;

    const wrapAction = async (fn, ...args) => {
        if (working) return;
        setWorking(true);
        try { await fn(...args); }
        finally { setWorking(false); }
    };

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`${C.surface} border rounded-2xl overflow-hidden cursor-pointer transition-all
                ${working ? 'opacity-70 pointer-events-none' : ''}
                ${isPayReq ? 'border-blue-500/70 shadow-blue-500/10 shadow-lg'
                    : waiterCalled ? 'border-amber-500/70 shadow-amber-500/10 shadow-lg'
                        : selected ? 'border-zinc-500' : C.border}
                hover:border-zinc-500`}
            onClick={onSelect}>
            <div className={`px-4 py-3 flex items-center justify-between border-b ${C.border}`}>
                <div>
                    <p className="font-black text-lg">🪑 {order.table_id}</p>
                    <p className={`text-xs ${C.muted}`}>
                        {new Date(order.created_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {waiterCalled && <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">🙋 SEGÍTSÉG</span>}
                    {isPayReq && <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full">💳 FIZETÉS ({order.notes ? order.notes.toUpperCase() : 'KÁRTYA/KÉSZPÉNZ'})</span>}
                </div>
            </div>
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className={`text-sm ${C.subtext}`}>{order.items?.length || 0} féle tétel</p>
                    <p className={`font-black ${C.accentText}`}>{(order.total_price || 0).toLocaleString('hu-HU')} Ft</p>
                </div>
                {unserved.length > 0 && <p className="text-xs text-orange-400 font-bold mt-1">⏳ {unserved.length} tétel kint van még</p>}
            </div>
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className={`border-t ${C.border} px-4 py-3 space-y-2`}>
                            {order.items?.map((item, i) => (
                                <div key={item.uid || i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.served ? <IoCheckmarkCircle className="text-green-500 shrink-0" /> : <IoTimeOutline className="text-orange-400 shrink-0" />}
                                        <div className="flex flex-col">
                                            <span className={`text-sm ${item.served ? C.muted : C.text} font-bold`}>{item.qty}× {item.name}</span>
                                            {item.ordered_at && !item.served && (
                                                <span className="text-[9px] text-zinc-500 uppercase font-black">
                                                    Rendelve: {new Date(item.ordered_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!item.served && (
                                        <button onClick={e => { e.stopPropagation(); wrapAction(onServeItem, order, item.uid); }}
                                            className="text-[10px] font-black bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded-lg">
                                            Kiment ✓
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className={`pt-3 mt-2 border-t flex flex-wrap gap-2
                                ${isPayReq ? 'border-blue-500/50' : waiterCalled ? 'border-amber-500/50' : C.border}`}>
                                {waiterCalled && (
                                    <button onClick={e => { e.stopPropagation(); wrapAction(onAck, order); }}
                                        className="w-full flex items-center justify-center gap-2 text-xs font-black bg-amber-500 text-black px-3 py-2.5 rounded-xl">
                                        <IoCheckmarkCircle className="text-base" /> {working ? 'Feldolgozás...' : 'Segítségnyújtás OK (Jelzés törlése)'}
                                    </button>
                                )}
                                <button onClick={e => { e.stopPropagation(); wrapAction(onCloseTable, order.id); }}
                                    className={`w-full flex items-center justify-center gap-2 text-xs font-black border px-3 py-2.5 rounded-xl
                                        ${isPayReq ? 'bg-blue-600 text-white border-transparent' : `${C.card} text-red-400 border-red-500/30 w-auto text-center justify-center mx-auto`}`}>
                                    {working ? '...' : isPayReq ? '💳 Fizetés elfogadva – Asztal lezárása' : 'Asztal lezárása'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

// ══════════════════════════════════════════════
// TAB 2: ÉTLAP SZERKESZTŐ
// ══════════════════════════════════════════════
function MenuEditor({ qrRestaurantId }) {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [activeCatId, setActiveCatId] = useState(null);
    const [expandedCat, setExpandedCat] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadMenu = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getQRMenuAdmin(qrRestaurantId);
            setMenu(data);
            if (data.length > 0 && !expandedCat) setExpandedCat(data[0].id);
        } catch { toast.error('Hiba az étlap betöltésekor.'); }
        finally { setLoading(false); }
    }, [qrRestaurantId]);

    useEffect(() => { loadMenu(); }, [loadMenu]);

    const handleSaveCat = async (formData) => {
        setSaving(true);
        try {
            await saveQRCategory(qrRestaurantId, { ...formData, ...(editingCat ? { id: editingCat.id } : { sort_order: menu.length }) }, !editingCat);
            toast.success(editingCat ? 'Kategória frissítve' : 'Kategória létrehozva');
            setShowCatModal(false);
            loadMenu();
        } catch (e) { toast.error('Hiba: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleSaveItem = async (formData) => {
        setSaving(true);
        try {
            let finalImageUrl = formData.image_url;
            
            // Ha van kiválasztott fájl, töltsük fel
            if (formData.file) {
                toast.loading('Kép optimalizálása és feltöltése...', { id: 'upload' });
                finalImageUrl = await uploadQRItemImage(formData.file, qrRestaurantId);
                toast.success('Kép feltöltve!', { id: 'upload' });
            }

            const cleanData = { ...formData };
            delete cleanData.file; // Ne küldjük el a DB-be
            
            await saveQRItem(qrRestaurantId, { 
                ...cleanData, 
                image_url: finalImageUrl,
                price: parseInt(formData.price) || 0, 
                category_id: activeCatId, 
                ...(editingItem ? { id: editingItem.id } : { sort_order: 0 }) 
            }, !editingItem);

            toast.success(editingItem ? 'Étel frissítve' : 'Étel hozzáadva');
            setShowItemModal(false);
            loadMenu();
        } catch (e) { 
            toast.error('Hiba: ' + e.message, { id: 'upload' }); 
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <FullScreenLoader label="Étlap betöltése..." />;

    return (
        <div className="space-y-3 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-bold">QR Étlap</p>
                    <p className={`text-xs ${C.muted}`}>Teljesen izolált – semmi köze az EATS-hez</p>
                </div>
                <button onClick={() => { setEditingCat(null); setShowCatModal(true); }}
                    className={`flex items-center gap-1.5 ${C.btn} bg-amber-500 text-black`}>
                    <IoAdd /> Új kategória
                </button>
            </div>

            {menu.length === 0 && (
                <div className={`text-center py-16 ${C.muted} ${C.surface} rounded-2xl border ${C.border}`}>
                    <IoRestaurant className="text-4xl mx-auto mb-3 opacity-20" />
                    <p className="font-bold">Még nincs QR étlap</p>
                    <p className="text-xs mt-1">Add hozzá az első kategóriát a kezdéshez</p>
                </div>
            )}

            {menu.map(cat => (
                <div key={cat.id} className={`${C.surface} border ${C.border} rounded-2xl overflow-hidden`}>
                    <div className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b ${C.border}`}
                        onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{cat.icon}</span>
                            <div>
                                <p className="font-black text-sm">{cat.name}</p>
                                <p className={`text-xs ${C.muted}`}>{cat.items?.length || 0} tétel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); setEditingCat(cat); setShowCatModal(true); }}
                                className={`${C.btn} ${C.card} ${C.subtext} border ${C.border} p-1.5`}><IoPencil /></button>
                            <button onClick={e => { e.stopPropagation(); if (confirm('Törlöd a kategóriát?')) deleteQRCategory(cat.id).then(loadMenu).catch(e => toast.error(e.message)); }}
                                className={`${C.btn} ${C.card} text-red-400 border ${C.border} p-1.5`}><IoTrashOutline /></button>
                            {expandedCat === cat.id ? <IoChevronUp className={C.muted} /> : <IoChevronDown className={C.muted} />}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedCat === cat.id && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-3 space-y-2">
                                    {cat.items?.map(item => (
                                        <div key={item.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl ${C.card} border ${C.border} ${!item.is_available ? 'opacity-50' : ''}`}>
                                            {item.image_url && <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{item.name}</p>
                                                <p className={`text-xs ${C.accentText} font-black`}>{(item.price || 0).toLocaleString('hu-HU')} Ft</p>
                                                {item.description && <p className={`text-xs ${C.muted} truncate`}>{item.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => toggleQRItemAvailability(item.id, item.is_available).then(loadMenu)}
                                                    className={`text-[10px] font-black px-2 py-1 rounded-lg border
                                                        ${item.is_available ? 'bg-green-900/30 border-green-700/50 text-green-400' : 'bg-red-900/30 border-red-700/50 text-red-400'}`}>
                                                    {item.is_available ? 'ELÉRHETŐ' : 'ELFOGYOTT'}
                                                </button>
                                                <button onClick={() => { setEditingItem(item); setActiveCatId(cat.id); setShowItemModal(true); }}
                                                    className={`${C.btn} ${C.card} ${C.subtext} border ${C.border} p-1.5`}><IoPencil className="text-sm" /></button>
                                                <button onClick={() => { if (confirm('Törlöd az ételt?')) deleteQRItem(item.id).then(loadMenu).catch(e => toast.error(e.message)); }}
                                                    className={`${C.btn} ${C.card} text-red-400 border ${C.border} p-1.5`}><IoTrashOutline className="text-sm" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => { setEditingItem(null); setActiveCatId(cat.id); setShowItemModal(true); }}
                                        className={`w-full py-3 rounded-xl border-2 border-dashed ${C.border} flex items-center justify-center gap-2
                                            text-xs font-bold ${C.muted} hover:text-amber-400 hover:border-amber-500/40 transition-colors`}>
                                        <IoAdd /> Új étel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            <AnimatePresence>
                {showCatModal && (
                    <FormModal title={editingCat ? 'Kategória szerkesztése' : 'Új kategória'}
                        onClose={() => setShowCatModal(false)} onSubmit={handleSaveCat} saving={saving}
                        fields={[
                            { key: 'name', label: 'Kategória neve *', placeholder: 'pl. Italok', required: true, value: editingCat?.name || '' },
                            { key: 'description', label: 'Leírás', placeholder: 'Opcionális', value: editingCat?.description || '' },
                            { key: 'icon', label: 'Ikon (emoji)', placeholder: '🍺', value: editingCat?.icon || '🍽️' },
                        ]} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showItemModal && (
                    <FormModal title={editingItem ? 'Étel szerkesztése' : 'Új étel'}
                        onClose={() => setShowItemModal(false)} onSubmit={handleSaveItem} saving={saving}
                        fields={[
                            { key: 'name', label: 'Étel neve *', placeholder: 'pl. Soproni Korsó 0.5l', required: true, value: editingItem?.name || '' },
                            { key: 'description', label: 'Leírás', placeholder: 'Opcionális', value: editingItem?.description || '' },
                            { key: 'price', label: 'Ár (Ft) *', type: 'number', placeholder: '850', required: true, value: editingItem?.price || '' },
                            { key: 'file', label: 'Fénykép feltöltése', type: 'file', value: null },
                            { key: 'image_url', label: 'Kép URL (vagy hagyd üresen feltöltéskor)', placeholder: 'https://...', value: editingItem?.image_url || '' },
                        ]} />
                )}
            </AnimatePresence>
        </div>
    );
}

function FormModal({ title, onClose, onSubmit, saving, fields }) {
    const [formData, setFormData] = useState(Object.fromEntries(fields.map(f => [f.key, f.value ?? ''])));
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/70" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl max-h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-base">{title}</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><IoClose className="text-xl" /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="space-y-3">
                    {fields.map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">{field.label}</label>
                            {field.type === 'file' ? (
                                <div className="space-y-2">
                                    <input type="file" accept="image/*"
                                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.files[0] }))}
                                        className="w-full text-zinc-500 text-xs file:mr-4 file:py-2 file:px-4
                                            file:rounded-xl file:border-0 file:text-[10px] file:font-black
                                            file:bg-zinc-800 file:text-zinc-400 hover:file:bg-zinc-700 transition-all cursor-pointer" />
                                    {formData[field.key] && (
                                        <p className="text-[10px] text-amber-500 font-bold">Kiválasztva: {formData[field.key].name}</p>
                                    )}
                                </div>
                            ) : (
                                <input type={field.type || 'text'} required={field.required} placeholder={field.placeholder}
                                    value={formData[field.key]}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm
                                        text-white placeholder-zinc-600 outline-none focus:border-amber-500/50 transition-colors" />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-400">Mégse</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-black text-sm disabled:opacity-50">
                            {saving ? 'Mentés...' : '💾 Mentés'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function FullScreenLoader({ label }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">{label}</p>
        </div>
    );
}
