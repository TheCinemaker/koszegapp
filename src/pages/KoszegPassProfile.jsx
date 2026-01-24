import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogOut, IoPersonCircle, IoQrCode, IoWallet, IoSave, IoPencil } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function KoszegPassProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        address: ''
    });

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

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-6 pb-24">

            {/* Header Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <IoPersonCircle size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{profile?.full_name || user.user_metadata?.full_name || 'Felhasználó'}</h2>
                        <p className="text-blue-200 text-sm">@{profile?.username || 'user'}</p>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <div className="px-3 py-1 bg-black/20 rounded-lg text-xs font-mono border border-white/10 uppercase tracking-widest">
                        PASS ID: {user.id.substring(0, 8)}
                    </div>
                </div>
            </div>

            {/* Config / Data Section */}
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

            {/* Sections */}
            <div className="space-y-4">
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

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <IoWallet size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">tárca (Hamarosan)</h3>
                            <p className="text-xs text-zinc-500">Kuponok és egyenleg</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8">
                <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                    <IoLogOut size={20} />
                    Kijelentkezés
                </button>
            </div>

        </div>
    );
}
