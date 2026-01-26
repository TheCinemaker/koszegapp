import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoWallet, IoSave, IoPencil, IoClose, IoChevronForward } from 'react-icons/io5';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';

export default function KoszegPassProfile({ viewMode = 'full' }) {
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
        <div className="min-h-screen bg-[#050511] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-[#050511] text-white flex flex-col items-center justify-center gap-4">
                <p>Jelentkezz be a megtekintéshez.</p>
                <button onClick={() => navigate('/pass/register')} className="text-blue-400 underline">Belépés / Regisztráció</button>
            </div>
        )
    }

    const showCard = viewMode === 'full' || viewMode === 'card';
    const showSettings = viewMode === 'full' || viewMode === 'settings';

    return (
        <div className={`min-h-screen bg-[#050511] text-white relative overflow-hidden ${viewMode === 'full' ? 'pb-32' : 'pb-6'}`}>

            {/* Ambient Background Lights */}
            <div className="fixed top-[-10%] left-[-20%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-20%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative px-4 pt-8 w-full max-w-lg mx-auto flex flex-col items-center">

                {/* Header */}
                <header className="flex justify-between items-center mb-8 w-full">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            KőszegPass
                        </h1>
                        <p className="text-sm text-white/40 font-medium">Digitális Tárca</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                    </div>
                </header>

                {/* Digital Card Design */}
                {showCard && (
                    <div className="perspective-1000 mb-8 w-full">
                        <motion.div
                            initial={{ rotateX: 20, opacity: 0, scale: 0.9 }}
                            animate={{ rotateX: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", duration: 1.5, bounce: 0.2 }}
                            className={`
                            relative w-full aspect-[1.586/1] rounded-[24px] p-4 sm:p-6 shadow-2xl overflow-hidden group cursor-pointer
                            border border-white/15 backdrop-blur-2xl transition-all
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
                                        <span className="font-black tracking-widest text-white/90 text-[10px] uppercase">Official City Pass</span>
                                    </div>
                                    <div className={`
                                        px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-md
                                        ${profile?.card_type === 'diamant' ? 'bg-cyan-400/20 text-cyan-100 border-cyan-400/30' :
                                            'bg-orange-500/20 text-orange-100 border-orange-500/30'}
                                    `}>
                                        {profile?.card_type || 'BRONZ'}
                                    </div>
                                </div>

                                {/* Middle: User Info */}
                                <div className="mt-2 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-white/50 to-white/0">
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
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <p className="text-[10px] text-white/80 font-mono tracking-wide lowercase">aktív</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini QR on Card */}
                                    {qrCodeUrl && (
                                        <div
                                            className="bg-white p-1.5 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setShowQrModal(true)}
                                        >
                                            <img src={qrCodeUrl} alt="QR" className="w-12 h-12 mix-blend-multiply" />
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Row: ID & Chip */}
                                <div className="flex justify-between items-end">
                                    <div
                                        className="flex flex-col cursor-pointer active:opacity-80 transition-opacity"
                                        onClick={() => setShowFullId(!showFullId)}
                                    >
                                        <span className="text-[9px] text-white/50 uppercase tracking-widest mb-1 font-semibold">
                                            Azonosító
                                        </span>
                                        <span className={`font-mono text-white/95 tracking-[0.15em] tabular-nums shadow-black drop-shadow-sm ${showFullId ? 'text-[10px]' : 'text-sm'}`}>
                                            {showFullId
                                                ? user.id
                                                : `•••• ${user.id.substring(user.id.length - 4)}`
                                            }
                                        </span>
                                    </div>
                                    {/* Real-feel Chip */}
                                    <div className="w-11 h-8 rounded-md bg-gradient-to-br from-[#d4af37] via-[#f9e585] to-[#aa8c2c] relative overflow-hidden shadow-inner border border-[#aa8c2c]">
                                        <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md" />
                                        <div className="absolute top-[8px] bottom-[8px] left-0 w-full border-t border-b border-black/10" />
                                        <div className="absolute left-[12px] right-[12px] top-0 h-full border-l border-r border-black/10" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Carousel */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
                                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Egyenleg</span>
                                <div className="flex items-center gap-1.5 text-2xl font-black text-white">
                                    {profile?.points || 0}
                                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/20 px-1.5 py-0.5 rounded">PTS</span>
                                </div>
                            </div>

                            <div
                                onClick={() => setShowQrModal(true)}
                                className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                            >
                                <IoQrCode className="text-2xl text-white mb-0.5" />
                                <span className="text-white text-xs font-bold">Kód Mutatása</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Section (iOS Style) */}
                {showSettings && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-2">
                            <h3 className="text-lg font-bold text-white/90">Személyes Adatok</h3>
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={`text-sm font-bold transition-colors ${isEditing ? 'text-blue-400' : 'text-blue-500'}`}
                            >
                                {isEditing ? 'Kész' : 'Szerkesztés'}
                            </button>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10">

                            {/* Email */}
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-white/60 w-24">Email</span>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="flex-1 bg-transparent text-right text-white focus:outline-none placeholder:text-white/20"
                                        placeholder="Add meg az emailed"
                                    />
                                ) : (
                                    <span className="flex-1 text-right text-white/90 truncate">{profile?.email || 'Nincs megadva'}</span>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-white/60 w-24">Telefon</span>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="flex-1 bg-transparent text-right text-white focus:outline-none placeholder:text-white/20"
                                        placeholder="+36..."
                                    />
                                ) : (
                                    <span className="flex-1 text-right text-white/90 truncate">{profile?.phone || 'Nincs megadva'}</span>
                                )}
                            </div>

                            {/* Address */}
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-white/60 w-24">Cím</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        className="flex-1 bg-transparent text-right text-white focus:outline-none placeholder:text-white/20"
                                        placeholder="Város, Utca..."
                                    />
                                ) : (
                                    <span className="flex-1 text-right text-white/90 truncate">{profile?.address || 'Nincs megadva'}</span>
                                )}
                            </div>
                        </div>

                        {/* Additional Options */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 cursor-pointer">
                            <div className="p-4 flex items-center justify-between group">
                                <span className="text-sm font-medium text-white/90">Értesítések Kezelése</span>
                                <IoChevronForward className="text-white/30 group-hover:text-white/60 transition-colors" />
                            </div>
                            <div className="p-4 flex items-center justify-between group">
                                <span className="text-sm font-medium text-white/90">Adatvédelmi Nyilatkozat</span>
                                <IoChevronForward className="text-white/30 group-hover:text-white/60 transition-colors" />
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full py-4 mt-8 bg-black/40 text-red-500 text-sm font-bold rounded-2xl border border-red-500/10 active:bg-black/60 transition-colors"
                        >
                            Kijelentkezés
                        </button>
                    </div>
                )}

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

