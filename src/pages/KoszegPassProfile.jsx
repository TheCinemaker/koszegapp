import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoArrowBack, IoArrowForward, IoSettingsOutline, IoPersonOutline, IoWalletOutline, IoSwapHorizontal, IoPerson, IoLogoGoogle, IoLogoApple } from 'react-icons/io5';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

// --- HELPER COMPONENT: Slimmer Feature Card ---
const FeatureCard = ({ title, subtitle, icon, colorFrom, colorTo, onClick, delay, value }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="
            cursor-pointer 
            relative overflow-hidden
            bg-white dark:bg-[#1a1c2e]
            backdrop-blur-[30px] saturate-150
            rounded-[2rem] 
            border border-white/60 dark:border-white/10 
            shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
            p-3 sm:px-4
            flex items-center 
            min-h-[80px]
            group
        "
    >
        {/* Abstract Background Gradient */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-20 blur-[50px] rounded-full group-hover:opacity-30 transition-opacity duration-500`} />

        <div className="relative z-10 flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorFrom} ${colorTo} flex items-center justify-center text-white text-lg shadow-lg transform group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                        {title}
                    </h3>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 line-clamp-1">
                        {subtitle}
                    </p>
                </div>
            </div>

            {value ? (
                <span className="text-lg font-black text-gray-900 dark:text-white whitespace-nowrap">{value}</span>
            ) : (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-300">
                    <IoArrowForward className="text-xs" />
                </div>
            )}
        </div>
    </motion.div>
);

// --- HELPER COMPONENT: Circular Progress ---
const CircularProgress = ({ value, max = 20000, size = 180, strokeWidth = 8, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value / max, 1);
    const dash = circumference * progress;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-zinc-200 dark:text-zinc-800"
                />
                {/* Foreground Circle (Animated) */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - dash }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                {children}
            </div>
        </div>
    );
};

export default function KoszegPassProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrToken, setQrToken] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isPocketOpen, setIsPocketOpen] = useState(false); // Controls Pocket Reveal
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', address: '' });
    const editFormRef = useRef(null);

    const haptic = (type = 'light') => {
        if (navigator.vibrate) navigator.vibrate(type === 'heavy' ? 20 : 10);
    };

    // 1. Initial Fetch
    useEffect(() => {
        if (!user) {
            // Redirect to Register/Login if not authenticated
            navigate('/pass/register', { replace: true });
            return;
        }

        const fetchKoszegPassProfile = async () => {
            try {
                const { data: userData, error: userError } = await supabase.from('koszegpass_users').select('*').eq('id', user.id).single();

                if (userError && userError.code !== 'PGRST116') throw userError;

                setProfile(userData);
                setEditForm(userData || { full_name: '', email: '', phone: '', address: '' });

                const { data: cardData } = await supabase.from('koszegpass_cards').select('qr_token').eq('user_id', user.id).single();
                const token = cardData?.qr_token || user.id; // Fallback to ID if no token
                setQrToken(token);

                try {
                    const url = await QRCode.toDataURL(token, { width: 400, margin: 2 });
                    setQrCodeUrl(url);
                } catch (qrError) {
                    console.error("QR Generation failed:", qrError);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
                toast.error("Hiba az adatok betöltésekor.");
            } finally {
                setLoading(false);
            }
        };
        fetchKoszegPassProfile();

        // 2. Realtime Subscription
        console.log("Setting up subscription for:", user.id);
        const subscription = supabase
            .channel(`profile_changes_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'koszegpass_users',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    console.log("Realtime update received:", payload);
                    setProfile(prev => ({ ...prev, ...payload.new }));
                    if (payload.new.points !== payload.old?.points) {
                        toast.success(`Pontok frissítve!`, { icon: '🔄' });

                        // Sync with Google Wallet
                        fetch('/.netlify/functions/update-google-pass', {
                            method: 'POST',
                            body: JSON.stringify({
                                user_id: user.id,
                                points: payload.new.points,
                                card_type: payload.new.card_type
                            })
                        }).catch(err => console.error("Wallet sync failed:", err));
                    }
                }
            )
            .subscribe((status) => {
                console.log("Subscription status:", status);
            });

        return () => {
            console.log("Cleaning up subscription");
            supabase.removeChannel(subscription);
        };
    }, [user]); // Depend on user to refetch if user changes

    // Fetch History on open
    useEffect(() => {
        if (showHistory && user) {
            const fetchHistory = async () => {
                const { data } = await supabase
                    .from('koszegpass_points_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                setHistory(data || []);
            };
            fetchHistory();
        }
    }, [showHistory, user]);

    useEffect(() => {
        if (isEditing && editFormRef.current) setTimeout(() => editFormRef.current.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [isEditing]);

    // ... (rest of component logic)



    if (loading) return <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 rounded-full animate-spin" /></div>;

    const handleSave = async () => {
        const { error } = await supabase.from('koszegpass_users').update(editForm).eq('id', user.id);
        if (!error) { setProfile({ ...profile, ...editForm }); setIsEditing(false); toast.success("Mentve!"); }
    };
    const handleLogout = async () => { await logout(); navigate('/pass/register'); };

    const handleGoogleWallet = async () => {
        if (!profile) return;
        const toastId = toast.loading("Google Wallet előkészítése...");
        try {
            const response = await fetch('/.netlify/functions/create-google-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    full_name: profile.full_name,
                    points: profile.points,
                    card_type: profile.card_type,
                    qr_token: qrToken
                })
            });
            const data = await response.json();
            if (response.ok && data.saveUrl) {
                toast.success("Kész! Megnyitás...", { id: toastId });
                window.open(data.saveUrl, '_blank');
            } else {
                throw new Error(data.error || "Hiba történt");
            }
        } catch (error) {
            console.error(error);
            toast.error("Sikertelen hozzáadás: " + error.message, { id: toastId });
        }
    };

    // POCKET ANIMATION VARIANTS
    const pocketVariants = {
        open: {
            top: '320px',
            y: 0,
            transition: { type: "spring", stiffness: 120, damping: 20, mass: 1.2 }
        },
        closed: {
            top: '110px',
            y: [0, 4, 0, 4, 0],
            transition: {
                top: { type: "spring", stiffness: 120, damping: 20, mass: 1.2 },
                y: {
                    duration: 2,
                    times: [0, 0.1, 0.2, 0.3, 1],
                    repeat: 3,
                    repeatDelay: 5,
                    ease: "easeInOut",
                    delay: 1 // Wait for close spring to finish
                }
            }
        },
        dragging: {
            top: '110px',
            y: 0
        }
    };

    // --- LOGIC: POCKET VS REVEAL ---
    // If IS_POCKET_OPEN = TRUE -> We REVEAL the Card (Pocket slides DOWN).
    // If IS_POCKET_OPEN = FALSE (Default) -> We HIDE the Card (Pocket is UP, covering it).
    // TUCKED: Pocket Top = 110px. (Roughly 80px Card Top + 30px Peak)
    // OPEN: Pocket Top = 320px.

    // PROTECTION: Don't render if no user (prevents crash)
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-hidden relative selection:bg-indigo-500/30">

            {/* --- LAYER 1: THE CARD (Fixed / Z-0) --- */}
            {/* Centered horizontally, fixed vertically near top */}
            <div className="fixed top-[80px] left-0 right-0 flex justify-center z-0 px-4">
                <div
                    className="relative w-full max-w-md aspect-[1.586/1] group cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d transition-all duration-700 rounded-[24px]"
                        animate={{
                            rotateY: isFlipped ? 180 : 0,
                            scale: isPocketOpen ? 1.01 : 1,
                            boxShadow: isPocketOpen ? '0 30px 80px rgba(0,0,0,0.35)' : '0 20px 60px rgba(0,0,0,0.25)'
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* FRONT FACE (Refined Design for Peek) */}
                        <div
                            className={`
                                absolute inset-0 backface-hidden rounded-[24px] p-6 shadow-2xl overflow-hidden
                                border border-white/15 backdrop-blur-2xl
                                ${profile?.card_type === 'diamant' ? 'bg-gradient-to-br from-[#1a237e] via-[#0d47a1] to-[#311b92]' :
                                    profile?.card_type === 'gold' ? 'bg-gradient-to-br from-[#5d4037] via-[#795548] to-[#3e2723]' :
                                        profile?.card_type === 'silver' ? 'bg-gradient-to-br from-[#37474f] via-[#455a64] to-[#263238]' :
                                            'bg-gradient-to-br from-[#3E1C16] via-[#5D2B20] to-[#2D120E]' // Bronz
                                }
                            `}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col justify-between pt-0">
                                {/* Top Row: Adjusted for Peek Visibility (Higher up) */}
                                <div className="flex justify-between items-start -mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                                            <IoQrCode size={14} className="text-white" />
                                        </div>
                                        <div>
                                            {/* Name moved to header for peek visibility */}
                                            <h1 className="text-sm font-bold text-white tracking-wide leading-none shadow-black drop-shadow-md">
                                                {profile?.full_name || 'Felhasználó'}
                                            </h1>
                                            <span className="font-black tracking-widest text-white/60 text-[8px] uppercase">KőszegPass</span>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg bg-white/10 text-white border-white/10">
                                        {profile?.card_type || 'BRONZ'}
                                    </div>
                                </div>

                                {/* Middle: Avatar & Status */}
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-white/50 to-white/0 shadow-lg">
                                        <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                                            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <IoPersonCircle size={48} className="text-white/80" />}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-2 py-0.5 w-fit backdrop-blur-sm border border-white/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                                            <p className="text-[9px] text-white/90 font-mono tracking-wide lowercase">aktív</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: ID only (Chip Removed) */}
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-white/50 uppercase tracking-widest mb-1 font-semibold">Kártyaszám</span>
                                        <span className="font-mono text-white/95 tracking-[0.15em] text-sm tabular-nums">•••• {user.id.slice(-4)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BACK FACE */}
                        <div
                            className="absolute inset-0 backface-hidden rounded-[24px] p-6 shadow-2xl overflow-hidden bg-white dark:bg-[#1a1c2e] border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center text-center"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                                <img src={qrCodeUrl} className="w-32 h-32 object-contain" />
                            </div>
                            <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-200 break-all px-4">{user.id}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- LAYER 2: THE POCKET (Foreground / Z-10) --- */}
            {/* Draggable / Animated Sheet that covers the card */}
            <motion.div
                className="fixed bottom-0 left-0 right-0 z-20 bg-[#F2F2F6] dark:bg-[#0F0F0F] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-white/50 dark:border-white/5"
                variants={pocketVariants}
                initial="closed"
                animate={isPocketOpen ? "open" : (isDragging ? "dragging" : "closed")}
                drag="y"
                dragConstraints={isPocketOpen ? { top: -210, bottom: 0 } : { top: 0, bottom: 210 }}
                dragElastic={0.05} // Stiffer elastic
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => {
                    setIsDragging(false);
                    const threshold = 50;
                    const velocityThreshold = 500;

                    // Logic: If dragged far enough OR flicked fast enough
                    if (info.offset.y > threshold || info.velocity.y > velocityThreshold) {
                        if (!isPocketOpen) {
                            setIsPocketOpen(true);
                            haptic('heavy');
                        }
                    } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
                        if (isPocketOpen) {
                            setIsPocketOpen(false);
                            haptic('light');
                        }
                    }
                }}
            >
                {/* Drag Handle */}
                <div className="w-full h-12 flex items-center justify-center rounded-t-[32px]">
                    <div
                        className="w-32 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full cursor-pointer"
                        onClick={() => setIsPocketOpen(!isPocketOpen)}
                    />
                </div>

                {/* Pocket Content (Menu) */}
                <div className="px-6 pt-4 pb-32 h-full overflow-y-auto">
                    {/* Points Summary when Tucked/Open */}
                    <div className="flex flex-col items-center mb-6">
                        <CircularProgress value={profile?.points || 0} size={160}>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                    {profile?.points?.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Pont</span>
                            </div>
                        </CircularProgress>
                    </div>

                    <AnimatePresence mode="wait">
                        {showHistory ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full max-w-md mx-auto"
                            >
                                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#F2F2F6] dark:bg-[#0F0F0F] z-10 py-2">
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center dark:text-white"
                                    >
                                        <IoArrowBack />
                                    </button>
                                    <h3 className="text-xl font-bold dark:text-white">Tranzakciók</h3>
                                </div>

                                <div className="space-y-3 pb-8">
                                    {history.length === 0 ? (
                                        <p className="text-center text-zinc-500 py-8">Nincs még tranzakció.</p>
                                    ) : (
                                        history.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <IoWalletOutline />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900 dark:text-white text-sm">{item.source}</p>
                                                        <p className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleDateString('hu-HU')}</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">+{item.points} P</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                                    <FeatureCard
                                        title="Profil szerkesztése"
                                        subtitle="Személyes adatok"
                                        icon={<IoPerson />}
                                        colorFrom="from-blue-400"
                                        colorTo="to-indigo-600"
                                        delay={0.1}
                                        onClick={() => setIsEditing(!isEditing)}
                                    />
                                    <FeatureCard
                                        title="Egyenleg"
                                        subtitle="Tranzakciók"
                                        icon={<IoWalletOutline />}
                                        colorFrom="from-yellow-400"
                                        colorTo="to-orange-500"
                                        delay={0.2}
                                        onClick={() => setShowHistory(true)}
                                    />
                                    <FeatureCard
                                        title="Kijelentkezés"
                                        subtitle="Biztonságos kilépés"
                                        icon={<IoLogOut />}
                                        colorFrom="from-red-400"
                                        colorTo="to-rose-600"
                                        delay={0.3}
                                        onClick={handleLogout}
                                    />
                                </div>

                                <div className="mt-6 flex justify-center pb-8 border-t border-zinc-200 dark:border-white/10 pt-6">
                                    <button
                                        disabled
                                        className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-6 py-3 rounded-full font-medium shadow-none cursor-not-allowed grayscale"
                                    >
                                        <IoLogoGoogle size={20} />
                                        <span>Google Wallet (Hamarosan)</span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isEditing && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-8 bg-white dark:bg-[#1a1c2e] p-6 rounded-2xl border border-zinc-100 dark:border-white/10 overflow-hidden max-w-md mx-auto">
                                            <h3 className="font-bold text-lg mb-4 dark:text-white">Adatok szerkesztése</h3>
                                            <div className="space-y-3">
                                                <input className="w-full bg-zinc-50 dark:bg-black p-3 rounded-lg border border-zinc-200 dark:border-white/10 dark:text-white" placeholder="Teljes név" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                                                <input className="w-full bg-zinc-50 dark:bg-black p-3 rounded-lg border border-zinc-200 dark:border-white/10 dark:text-white" placeholder="Lakcím" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                                                <input className="w-full bg-zinc-50 dark:bg-black p-3 rounded-lg border border-zinc-200 dark:border-white/10 dark:text-white" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                                <input className="w-full bg-zinc-50 dark:bg-black p-3 rounded-lg border border-zinc-200 dark:border-white/10 dark:text-white" placeholder="Telefon" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                                <button onClick={handleSave} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg active:scale-95 transition-transform">Mentés</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>

        </div>
    );
}