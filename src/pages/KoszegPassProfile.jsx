import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoArrowBack, IoArrowForward, IoSettingsOutline, IoPersonOutline, IoWalletOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

// --- HELPER COMPONENT: Feature Card ---
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
            rounded-[2.5rem] 
            border border-white/60 dark:border-white/10 
            shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
            p-5
            flex flex-col justify-between 
            h-full min-h-[140px]
            group
        "
    >
        {/* Abstract Background Gradient */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-20 blur-[50px] rounded-full group-hover:opacity-30 transition-opacity duration-500`} />

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} flex items-center justify-center text-white text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                {value && (
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{value}</span>
                )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                {title}
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {subtitle}
            </p>
        </div>

        <div className="relative z-10 flex justify-end mt-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-300">
                <IoArrowForward className="text-sm" />
            </div>
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

    // UX State
    const [showFullId, setShowFullId] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    useEffect(() => {
        const fetchKoszegPassProfile = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('koszegpass_users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching KőszegPass profile:", error);
            } else {
                setProfile(data);
                setEditForm({
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });
                generateQR(user.id);
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

                {/* --- FEATURED: DIGITAL CARD --- */}
                <FadeUp delay={0.1}>
                    <motion.div
                        className="
                            relative overflow-hidden
                            bg-white dark:bg-[#151515]
                            rounded-[2.5rem]
                            border border-zinc-100 dark:border-white/10
                            shadow-2xl shadow-zinc-200/50 dark:shadow-black/50
                            p-6 sm:p-10
                        "
                    >
                        {/* Decorative background blob */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/50 to-transparent dark:from-indigo-900/10 pointer-events-none blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

                        <div className="relative z-10 flex flex-col items-center">

                            {/* THE CARD ITSELF */}
                            <div className="perspective-1000 w-full max-w-md mx-auto">
                                <motion.div
                                    initial={{ rotateX: 5, opacity: 0, scale: 0.95 }}
                                    animate={{ rotateX: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", duration: 1.5, bounce: 0.2 }}
                                    className={`
                                    relative w-full aspect-[1.586/1] rounded-[24px] p-4 sm:p-6 shadow-2xl overflow-hidden group cursor-pointer
                                    border border-white/15 backdrop-blur-2xl transition-all hover:scale-[1.02]
                                    ${profile?.card_type === 'diamant' ? 'bg-gradient-to-br from-[#1a237e] via-[#0d47a1] to-[#311b92]' :
                                            profile?.card_type === 'gold' ? 'bg-gradient-to-br from-[#5d4037] via-[#795548] to-[#3e2723]' :
                                                profile?.card_type === 'silver' ? 'bg-gradient-to-br from-[#37474f] via-[#455a64] to-[#263238]' :
                                                    'bg-gradient-to-br from-[#3E1C16] via-[#5D2B20] to-[#2D120E]' // Bronz (Deep Rich Brown)
                                        }
                                `}>
                                    {/* Noise Texture */}
                                    <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                                    {/* Card Content Grid */}
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
                                        <div className="mt-2 flex justify-between items-center">
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
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: ID & Chip */}
                                        <div className="flex justify-between items-end">
                                            <div
                                                className="flex flex-col cursor-pointer active:opacity-80 transition-opacity max-w-[70%]"
                                                onClick={() => setShowFullId(!showFullId)}
                                            >
                                                <span className="text-[9px] text-white/50 uppercase tracking-widest mb-1 font-semibold shadow-black drop-shadow-sm">
                                                    Azonosító
                                                </span>
                                                <span className={`font-mono text-white/95 tracking-widest tabular-nums shadow-black drop-shadow-sm break-all leading-tight ${showFullId ? 'text-[0.65rem] tracking-tight' : 'text-sm'}`}>
                                                    {showFullId
                                                        ? user.id
                                                        : `•••• ${user.id.substring(user.id.length - 4)}`
                                                    }
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
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </FadeUp>

                {/* --- SETTINGS & ACTIONS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FeatureCard
                        title="Profil Szerkesztése"
                        subtitle={isEditing ? 'Szerkesztés folyamatban...' : 'Email, telefon, cím'}
                        icon={<IoPersonOutline />}
                        colorFrom="from-blue-400"
                        colorTo="to-indigo-600"
                        delay={0.2}
                        onClick={() => setIsEditing(!isEditing)}
                    />

                    <FeatureCard
                        title="QR Felmutatása"
                        subtitle="Belépéshez és kedvezményekhez"
                        icon={<IoQrCode />}
                        colorFrom="from-purple-400"
                        colorTo="to-pink-600"
                        delay={0.25}
                        onClick={() => setShowQrModal(true)}
                    />

                    <FeatureCard
                        title="Egyenleg"
                        subtitle="Gyűjtött pontjaid"
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
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-[#1a1c2e] rounded-[2.5rem] p-8 border border-zinc-100 dark:border-white/10 shadow-xl overflow-hidden"
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
                                <div className="pt-4 flex justify-end gap-2">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-full text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Mégsem</button>
                                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-500 transition-colors">Mentés</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clean Glass Modal for QR */}
                <AnimatePresence>
                    {showQrModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
                                onClick={() => setShowQrModal(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                                className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
                            >
                                <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-[32px] p-8 shadow-2xl pointer-events-auto flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Azonosító Kód</h3>
                                    <p className="text-gray-500 text-sm mb-8">Mutasd fel ezt a kódot a leolvasáshoz.</p>

                                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 mb-8">
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR" className="w-56 h-56 object-contain mix-blend-multiply dark:mix-blend-normal" />
                                        ) : (
                                            <div className="w-56 h-56 bg-gray-200 animate-pulse rounded-2xl" />
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowQrModal(false)}
                                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full active:scale-95 transition-transform"
                                    >
                                        Bezárás
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

