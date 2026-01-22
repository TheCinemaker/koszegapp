import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoArrowBack, IoRestaurant, IoPerson, IoKey, IoStorefront } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FoodAuthPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form States
    const [restaurantName, setRestaurantName] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Using 'provider' type in auth context (login ID -> email conversion)
            // Ideally we might want a distinct type if avoiding collision is critical, 
            // but 'provider' is likely fine if usernames are unique enough or namespaced.
            const { user } = await login(loginId, password, 'provider');

            if (user) {
                // Check if this user is actually a restaurant owner
                if (user.user_metadata?.role === 'restaurant') {
                    toast.success('Üdv a konyhán! 👨‍🍳');
                    navigate('/food-admin', { replace: true });
                } else {
                    // Prevent hairdressers from logging in here if we want strictness, 
                    // or just let them in and show "No Restaurant" screen.
                    // Strict:
                    // toast.error('Ez a fiók nem étteremhez tartozik!');
                    navigate('/food-admin', { replace: true });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Hibás azonosító vagy jelszó!');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Auth User
            // We use 'provider' namespace for login ID
            const authData = await register(loginId, password, restaurantName, 'restaurant');

            if (authData?.user) {
                const userId = authData.user.id;

                // 2. Create Profile
                await supabase.from('profiles').upsert({
                    id: userId,
                    role: 'restaurant',
                    nickname: loginId,
                    full_name: restaurantName
                });

                // 3. Create Restaurant Entry
                // Generate a slug from name
                const slug = restaurantName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000);

                const { error: restError } = await supabase.from('restaurants').insert({
                    owner_id: userId,
                    name: restaurantName,
                    slug: slug,
                    description: 'Új étterem',
                    access_code: '0000' // Legacy/Placeholder
                });

                if (restError) throw restError;

                toast.success('Sikeres regisztráció! 🍔');
                // Auto-login or redirect
                if (authData.session) {
                    navigate('/food-admin', { replace: true });
                } else {
                    // Should be logged in by register, but if not:
                    await login(loginId, password, 'provider');
                    navigate('/food-admin', { replace: true });
                }
            }
        } catch (error) {
            console.error(error);
            if (error.message?.includes("User already registered")) {
                toast.error('Ez a felhasználónév már létezik! Kérlek válassz másikat vagy lépj be.');
            } else {
                toast.error('Hiba: ' + (error.message || 'Ismeretlen hiba'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-zinc-100 dark:bg-white/5 p-6 border-b border-zinc-200 dark:border-white/10 relative">
                    <div className="absolute top-4 left-4 flex items-center gap-1 opacity-50">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs">Kőszeg</span>
                        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 text-xs">APP</span>
                    </div>
                    <div className="flex justify-center mb-4 text-orange-600 dark:text-orange-500">
                        <IoRestaurant size={48} />
                    </div>
                    <h1 className="text-2xl font-black text-center text-zinc-900 dark:text-white">
                        {isLogin ? 'Étterem Belépés' : 'Új Étterem Regisztráció'}
                    </h1>
                    <p className="text-center text-zinc-500 text-sm mt-1">
                        {isLogin ? 'Kezeld a rendeléseket és a menüt' : 'Csatlakozz a KőszegApp-hoz'}
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">

                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-zinc-500">Étterem Neve</label>
                                <div className="relative">
                                    <IoStorefront className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        required
                                        value={restaurantName}
                                        onChange={e => setRestaurantName(e.target.value)}
                                        className="w-full pl-10 h-12 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Pl. Ínyenc Étterem"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Belépési Azonosító</label>
                            <div className="relative">
                                <IoPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    required
                                    value={loginId}
                                    onChange={e => setLoginId(e.target.value)}
                                    className="w-full pl-10 h-12 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Pl. inyenc_admin"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Jelszó</label>
                            <div className="relative">
                                <IoKey className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 h-12 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-transform active:scale-95 disabled:opacity-50 text-lg"
                        >
                            {loading ? 'Folyamatban...' : (isLogin ? 'Belépés' : 'Regisztráció')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-orange-600 hover:underline font-medium text-sm"
                        >
                            {isLogin
                                ? 'Nincs még fiókod? Regisztrálj!'
                                : 'Már van fiókod? Lépj be!'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
