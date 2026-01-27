import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoArrowBack, IoArrowForward, IoSettingsOutline, IoPersonOutline, IoWalletOutline, IoSwapHorizontal } from 'react-icons/io5';
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

export default function KoszegPassProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        phone: '',
        address: ''
    });

    // Refs
    const editFormRef = useRef(null);

    // UX State
    const [isFlipped, setIsFlipped] = useState(false);

    // Auto-scroll to edit form
    useEffect(() => {
        if (isEditing && editFormRef.current) {
            setTimeout(() => {
                editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isEditing]);

    useEffect(() => {
        const fetchKoszegPassProfile = async () => {
            if (!user) return;

            // Fetch User Profile
            const { data: userData, error: userError } = await supabase
                .from('koszegpass_users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (userError) {
                console.error("Error fetching KőszegPass profile:", userError);
            } else {
                setProfile(userData);
                setEditForm({
                    email: userData.email || '',
                    phone: userData.phone || '',
                    address: userData.address || ''
                });

                // Fetch Secure Card Token (NEW)
                const { data: cardData, error: cardError } = await supabase
                    .from('koszegpass_cards')
                    .select('qr_token')
                    .eq('user_id', user.id)
                    .single();

                if (cardData?.qr_token) {
                    generateQR(cardData.qr_token); // Use Token
                } else {
                    // Fallback to ID if no token yet (or wait for trigger)
                    console.warn("No card token found, falling back to ID");
                    generateQR(user.id);
                }
            }
            setLoading(false);
        };

        fetchKoszegPassProfile();
    }, [user]);

    const generateQR = async (text) => {
        try {
            const url = await QRCode.toDataURL(text, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            setQrCodeUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        const { error } = await supabase
            .from('koszegpass_users')
            .update({
                email: editForm.email,
                phone: editForm.phone,
                address: editForm.address
            })
            .eq('id', user.id);

        if (error) {
            console.error("Save error:", error);
            toast.error("Hiba a mentés során!");
        } else {
            setProfile(prev => ({ ...prev, ...editForm }));
            setIsEditing(false);
            toast.success("Adatok frissítve! 💾");
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/pass/register');
        toast.success("Sikeres kijelentkezés.");
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex flex-col items-center justify-center gap-4">
                <p className="text-zinc-500 dark:text-zinc-400">Jelentkezz be a megtekintéshez.</p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/auth')} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold">Belépés</button>
                    <button onClick={() => navigate('/pass/register')} className="px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-bold">Regisztráció</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden pt-2 pb-24">

            {/* --- HERO SECTION --- */}
            <div className="relative pt-12 pb-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="w-12 h-12 shrink-0 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                            <IoArrowBack className="text-xl text-zinc-900 dark:text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">KőszegPass</h1>
                            <p className="text-indigo-600 dark:text-indigo-400 font-bold flex flex-wrap items-center gap-1 leading-tight">
                                <span> {profile?.full_name || user.user_metadata?.full_name || 'Felhasználó'} </span>
                                <span className="text-zinc-500 font-normal dark:text-zinc-400 text-sm">Digitális Tárca</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

                {/* --- FEATURED: 3D FLIP CARD --- */}
                <FadeUp delay={0.1}>
                    <div className="flex justify-center perspective-1000">
                        <div
                            className="relative w-full max-w-md aspect-[1.586/1] group cursor-pointer"
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{ perspective: '1000px' }}
                        >
                            <motion.div
                                className="w-full h-full relative preserve-3d transition-all duration-700"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* --- FRONT FACE (Design) --- */}
                                <div
                                    className={`
                                        absolute inset-0 backface-hidden rounded-[24px] p-4 sm:p-6 shadow-2xl overflow-hidden
                                        border border-white/15 backdrop-blur-2xl
                                        ${profile?.card_type === 'diamant' ? 'bg-gradient-to-br from-[#1a237e] via-[#0d47a1] to-[#311b92]' :
                                            profile?.card_type === 'gold' ? 'bg-gradient-to-br from-[#5d4037] via-[#795548] to-[#3e2723]' :
                                                profile?.card_type === 'silver' ? 'bg-gradient-to-br from-[#37474f] via-[#455a64] to-[#263238]' :
                                                    'bg-gradient-to-br from-[#3E1C16] via-[#5D2B20] to-[#2D120E]' // Bronz (Deep Rich Brown)
                                        }
                                    `}
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    {/* Noise Texture */}
                                    <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        {/* Top Row: Logo & Rank */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                                                    <IoQrCode size={18} className="text-white" />
                                                </div>
                                                <span className="font-black tracking-widest text-white/90 text-[10px] uppercase shadow-black drop-shadow-md">Official City Pass</span>
                                            </div>
                                            <div className={`
                                                px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-md shadow-lg
                                                ${profile?.card_type === 'diamant' ? 'bg-cyan-400/20 text-cyan-100 border-cyan-400/30' :
                                                    'bg-orange-500/20 text-orange-100 border-orange-500/30'}
                                            `}>
                                                {profile?.card_type || 'BRONZ'}
                                            </div>
                                        </div>

                                        {/* Middle: User Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-white/50 to-white/0 shadow-lg">
                                                <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                                                    {profile?.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <IoPersonCircle size={48} className="text-white/80" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-md">
                                                    {profile?.full_name || user.user_metadata?.full_name || 'Felhasználó'}
                                                </h1>
                                                <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-2 py-0.5 w-fit mt-1 backdrop-blur-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                    <p className="text-[10px] text-white/80 font-mono tracking-wide lowercase">aktív • érintsd meg</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: ID & Chip */}
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-white/50 uppercase tracking-widest mb-1 font-semibold shadow-black drop-shadow-sm">
                                                    Kártyaszám
                                                </span>
                                                <span className="font-mono text-white/95 tracking-[0.15em] text-sm tabular-nums shadow-black drop-shadow-sm">
                                                    •••• {user.id.substring(user.id.length - 4)}
                                                </span>
                                            </div>
                                            {/* Real-feel Chip */}
                                            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#d4af37] via-[#f9e585] to-[#aa8c2c] relative overflow-hidden shadow-xl border border-[#aa8c2c]/50">
                                                <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md" />
                                                <div className="absolute top-[8px] bottom-[8px] left-0 w-full border-t border-b border-black/10" />
                                                <div className="absolute left-[12px] right-[12px] top-0 h-full border-l border-r border-black/10" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hint */}
                                    <div className="absolute bottom-3 right-1/2 translate-x-1/2 text-[10px] text-white/40 font-bold uppercase tracking-widest pointer-events-none">
                                        Kattints a kódhoz
                                    </div>
                                </div>

                                {/* --- BACK FACE (Data / QR) --- */}
                                <div
                                    className="absolute inset-0 backface-hidden rounded-[24px] p-6 shadow-2xl overflow-hidden bg-white dark:bg-[#1a1c2e] border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center text-center"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Digitális Azonosító</h3>

                                    <div className="bg-white p-2 rounded-xl shadow-inner border border-zinc-100 mb-4">
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR" className="w-32 h-32 object-contain mix-blend-multiply" />
                                        ) : (
                                            <div className="w-32 h-32 bg-gray-100 animate-pulse rounded-xl" />
                                        )}
                                    </div>

                                    <div className="bg-zinc-100 dark:bg-black/30 px-3 py-2 rounded-lg w-full mb-4">
                                        <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500 mb-1 uppercase text-center">Teljes Azonosító (UUID)</p>
                                        <p className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-200 break-all text-center leading-tight">
                                            {user.id}
                                        </p>
                                    </div>

                                    <div className="absolute bottom-4 flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                        <IoSwapHorizontal />
                                        Visszafordít
                                    </div>
                                </div>

                            </motion.div>
                        </div>
                    </div>
                </FadeUp>

                {/* --- ADD TO WALLET BUTTONS --- */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* Apple Wallet */}
                    <button onClick={() => toast("Apple Wallet implementáció folyamatban...")} className="hover:scale-105 transition-transform">
                        <img src="/addToAppleWallet.svg" alt="Add to Apple Wallet" className="h-12" />
                    </button>

                    {/* Google Wallet (Custom implementation to match style) */}
                    <button
                        onClick={() => toast("Google Wallet implementáció folyamatban...")}
                        className="h-12 px-6 bg-black text-white rounded-[32px] flex items-center gap-3 hover:scale-105 transition-transform shadow-lg border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6 fill-current">
                            {/* Simple Wallet-like icon path or Google G logo */}
                            <path d="M327.3 226.5c4.1-5.6 6.6-12.5 6.6-20.1 0-18.7-15.2-33.9-33.9-33.9 -18.7 0-33.9 15.2-33.9 33.9 0 18.7 15.2 33.9 33.9 33.9 5.8 0 11.2-1.5 16-4.1l-24.9-42.6h-7.8v75.9h7.8L327.3 226.5zM263.7 206.4c0-21.4 17.4-38.8 38.8-38.8 21.4 0 38.8 17.4 38.8 38.8 0 21.4-17.4 38.8-38.8 38.8 -21.4 0-38.8-17.4-38.8-38.8z" />
                            {/* Or better, simple text + icon */}
                            <path d="M24 10.5h2.8v11h-2.8v-11zM14.5 17.5c-3.5 0-5.8-2.3-5.8-5.8s2.3-5.8 5.8-5.8 5.8 2.3 5.8 5.8 -2.3 5.8-5.8 5.8zm0-9.8c-2.3 0-4.1 1.7-4.1 4s1.7 4 4.1 4 4.1-1.7 4.1-4 -1.7-4-4.1-4z" transform="scale(12)" />
                            {/* Just using a generic wallet icon to keep it clean if no asset */}
                            <path d="M461.6 109.6l-54.9 31.8c-13.8 8-30.7 7.1-43.8-2.3L286.2 87.5c-18.1-13-42.6-11.6-59.2 3.4L64 239.5V88h384v21.6zM64 286v138h384V146.4L256 322 64 147.2" opacity=".4" /><path d="M64 88h384v336H64z" fill="none" class="fa-secondary" /><path d="M125.2 376.8c7.5-3.3 16.2.2 19.5 7.7 3.3 7.5-.2 16.2-7.7 19.5 -7.5 3.3-16.2-.2-19.5-7.7 -3.4-7.4 .1-16.1 7.7-19.5zM448 376c0 13.3-10.7 24-24 24H88c-13.3 0-24-10.7-24-24V88c0-13.3 10.7-24 24-24h360c13.3 0 24 10.7 24 24v288zM416 117.6V88H96v29.6l160 145.4 160-145.4zM96 376h320V166.4L256 312 96 166.4V376z" />
                        </svg>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-bold tracking-wide">Add to</span>
                            <span className="text-sm font-bold">Google Wallet</span>
                        </div>
                    </button>
                </div>

                {/* --- SETTINGS & ACTIONS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FeatureCard
                        title="Profilom"
                        subtitle={isEditing ? 'Szerkesztés...' : 'Adatok módosítása'}
                        icon={<IoPersonOutline />}
                        colorFrom="from-blue-400"
                        colorTo="to-indigo-600"
                        delay={0.2}
                        onClick={() => setIsEditing(!isEditing)}
                    />

                    <FeatureCard
                        title="Egyenleg"
                        subtitle="Elérhető pontok"
                        icon={<IoWalletOutline />}
                        value={`${profile?.points || 0} PTS`}
                        colorFrom="from-yellow-400"
                        colorTo="to-orange-500"
                        delay={0.3}
                        onClick={() => { }} // Maybe history later
                    />

                    <FeatureCard
                        title="Kijelentkezés"
                        subtitle="Fiók elhagyása"
                        icon={<IoLogOut />}
                        colorFrom="from-red-400"
                        colorTo="to-rose-600"
                        delay={0.35}
                        onClick={handleLogout}
                    />
                </div>

                {/* --- EDIT FORM SECTION (CONDITIONAL) --- */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            ref={editFormRef}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-[#1a1c2e] rounded-[2.5rem] p-8 border border-zinc-100 dark:border-white/10 shadow-xl overflow-hidden mt-4"
                        >
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Személyes Adatok Szerkesztése</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Telefon</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Cím</label>
                                    <input
                                        type="text"
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-2 text-sm">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-full text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Mégsem</button>
                                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-500 transition-colors">Mentés</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
