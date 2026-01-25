import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoWallet, IoSave, IoPencil } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function KoszegPassProfile({ viewMode = 'full' }) { // viewMode: 'full' | 'card' | 'settings'
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        email: '',
        phone: '',
        address: ''
    });

    // UX State
    const [showFullId, setShowFullId] = useState(false);

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
            }
            setLoading(false);
        };

        fetchKoszegPassProfile();
    }, [user]);

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

    if (loading) return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">Betöltés...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center gap-4">
                <p>Jelentkezz be a megtekintéshez.</p>
                <button onClick={() => navigate('/pass/register')} className="text-blue-400 underline">Belépés / Regisztráció</button>
            </div>
        )
    }

    const showCard = viewMode === 'full' || viewMode === 'card';
    const showSettings = viewMode === 'full' || viewMode === 'settings';

    return (
        <div className={`min-h-screen bg-zinc-900 text-white p-6 ${viewMode === 'full' ? 'pb-24' : 'pb-6'}`}>

            {/* Digital Card Design */}
            {showCard && (
                <>
                    <div className={`
                        relative w-full aspect-[1.586/1] rounded-3xl p-6 shadow-2xl overflow-hidden mb-8 transition-all
                        ${profile?.card_type === 'diamant' ? 'bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 border border-cyan-500/30' :
                            profile?.card_type === 'gold' ? 'bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-900 border border-yellow-500/30' :
                                profile?.card_type === 'silver' ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800 border border-gray-400/30' :
                                    'bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 border border-orange-500/30' // Bronz
                        }
                    `}>
                        {/* Background Effects (Holographic for Diamant) */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-2xl transform -translate-x-5 translate-y-5" />

                        {/* Card Content Grid */}
                        <div className="relative z-10 h-full flex flex-col justify-between">

                            {/* Top Row: Logo & Rank */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                        <IoQrCode size={20} className="text-white/80" />
                                    </div>
                                    <span className="font-bold tracking-wider text-white/90 text-sm">KŐSZEG PASS</span>
                                </div>
                                <div className={`
                                    px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border backdrop-blur-sm
                                    ${profile?.card_type === 'diamant' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]' :
                                        profile?.card_type === 'gold' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40' :
                                            profile?.card_type === 'silver' ? 'bg-gray-400/20 text-gray-200 border-gray-400/40' :
                                                'bg-orange-500/20 text-orange-200 border-orange-400/40'}
                                `}>
                                    {profile?.card_type || 'BRONZ'}
                                </div>
                            </div>

                            {/* Middle: User Info */}
                            <div className="mt-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-transparent p-[1px]">
                                        <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <IoPersonCircle size={48} className="text-white/80" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white tracking-wide shadow-black drop-shadow-md">
                                            {profile?.full_name || user.user_metadata?.full_name || 'Felhasználó'}
                                        </h1>
                                        <p className="text-xs text-white/60 font-mono">@{profile?.username || 'user'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: ID & Chip */}
                            <div className="flex justify-between items-end">
                                <div
                                    className="flex flex-col cursor-pointer active:opacity-80 transition-opacity"
                                    onClick={() => setShowFullId(!showFullId)}
                                    title="Kattints a teljes azonosítóhoz"
                                >
                                    <span className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">
                                        {showFullId ? 'TELJES AZONOSÍTÓ' : 'KÁRTYASZÁM'}
                                    </span>
                                    <span className={`font-mono text-white/90 tracking-widest tabular-nums ${showFullId ? 'text-[10px]' : 'text-sm'}`}>
                                        {showFullId
                                            ? user.id.toUpperCase()
                                            : `${user.id.substring(0, 4)} •••• •••• ${user.id.substring(user.id.length - 4).toUpperCase()}`
                                        }
                                    </span>
                                </div>
                                {/* Chip Visual */}
                                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200/40 to-yellow-500/40 border border-yellow-300/30 relative overflow-hidden">
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20" />
                                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-black/20" />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Stats & Points */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <IoWallet size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Ponty Egyenleg</h3>
                                    <p className="text-xs text-zinc-500">{profile?.points || 0} pont (1000 Ft = 1 pont)</p>
                                </div>
                            </div>
                            <div className="font-mono text-2xl font-bold text-purple-400">
                                {profile?.points || 0}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <IoQrCode size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Saját QR Kód</h3>
                                    <p className="text-xs text-zinc-500">Belépéshez scanneld</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Config / Data Section */}
            {showSettings && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-zinc-400">Adatok (Szállás/Kaja)</h3>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`p-2 rounded-full transition-colors ${isEditing
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                                }`}
                        >
                            {isEditing ? <IoSave size={20} /> : <IoPencil size={20} />}
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">

                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Email Cím</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder="pelda@email.hu"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            ) : (
                                <p className="text-zinc-300 font-mono tracking-wide">
                                    {profile?.email || <span className="text-zinc-600 italic">Nincs megadva</span>}
                                </p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Telefonszám</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+36 30 ..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            ) : (
                                <p className="text-zinc-300 font-mono tracking-wide">
                                    {profile?.phone || <span className="text-zinc-600 italic">Nincs megadva</span>}
                                </p>
                            )}
                        </div>

                        {/* Address Field */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Cím (Szállításhoz)</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    placeholder="9730 Kőszeg, Fő tér..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            ) : (
                                <p className="text-zinc-300">
                                    {profile?.address || <span className="text-zinc-600 italic">Nincs megadva</span>}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Actions for Settings Mode */}
            {showSettings && (
                <div className="mt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                        <IoLogOut size={20} />
                        Kijelentkezés
                    </button>
                </div>
            )}

        </div>
    );
}
