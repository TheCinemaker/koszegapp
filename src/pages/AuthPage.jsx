import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoPerson, IoKey, IoStorefront, IoArrowBack } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇' },
    { id: 'kormos', label: 'Körmös', icon: '💅' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨' },
];

export default function AuthPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Mode: 'client' or 'provider'
    const [activeTab, setActiveTab] = useState('client');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Provider Registration Form
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [providerUsername, setProviderUsername] = useState('');
    const [password, setPassword] = useState('');

    // Provider Login Form
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    useEffect(() => {
        // Debug connection
        const sbUrl = import.meta.env.VITE_SUPABASE_URL;
        console.log("AuthPage - Project:", sbUrl ? sbUrl.substring(8, 20) + "..." : "Unknown");
    }, []);

    const handleProviderRegister = async (e) => {
        e.preventDefault();
        const finalCategory = category === 'egyeb' ? customCategory : category;

        if (!businessName || !finalCategory || !providerUsername || !password) {
            toast.error('Töltsd ki az összes mezőt!');
            return;
        }

        setLoading(true);
        try {
            // 1. Register Logic (Role: provider)
            const authData = await register(providerUsername, password, businessName, 'provider');

            if (authData?.user) {
                const userId = authData.user.id;

                // 2. Create Appointment Provider Entry
                // Note: Profile creation is handled by the DB Trigger now (consolidated_auth_setup.sql)
                const { error: provError } = await supabase
                    .from('providers')
                    .insert({
                        user_id: userId,
                        business_name: businessName,
                        category: finalCategory,
                        slug: businessName.toLowerCase().replace(/ /g, '-')
                    });

                if (provError && !provError.message.includes('duplicate')) {
                    console.error("Provider insert error:", provError);
                    toast.error("Hiba a szolgáltatói adatok mentésekor.");
                } else {
                    toast.success('Sikeres partner regisztráció! 🚀');
                    navigate('/business', { replace: true });
                }
            }
        } catch (error) {
            console.error("Reg Error:", error);
            if (error.message.includes("already registered")) {
                toast.error('Ez a felhasználónév már foglalt!');
            } else {
                toast.error('Hiba: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProviderLogin = async (e) => {
        e.preventDefault();
        if (!loginUsername || !loginPassword) {
            toast.error('Hiányzó adatok!');
            return;
        }

        setLoading(true);
        try {
            const { user } = await login(loginUsername, loginPassword, 'provider');
            if (user) {
                // Check if user is actually a provider
                if (user.user_metadata?.role === 'restaurant') {
                    toast.success("Ez egy étterem fiók! Átirányítás...");
                    navigate('/food-admin');
                } else {
                    toast.success('Sikeres belépés!');
                    navigate('/business', { replace: true });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Hibás felhasználónév vagy jelszó!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-purple-950 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <IoArrowBack /> Vissza
                </button>

                {/* Auth Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-white/10 relative overflow-hidden">

                    {/* Decorative Header */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />

                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                            {activeTab === 'client' ? 'Vendég Belépés' : 'Partner Portál'}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            {activeTab === 'client'
                                ? 'Használd a KőszegPass-t a belépéshez'
                                : (isLogin ? 'Jelentkezz be a szolgáltatói pultba' : 'Regisztráld vállalkozásod')}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'client'
                                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-md'
                                : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                        >
                            Vendég
                        </button>
                        <button
                            onClick={() => setActiveTab('provider')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'provider'
                                ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-md'
                                : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                        >
                            Szolgáltató
                        </button>
                    </div>

                    {activeTab === 'client' ? (
                        <div className="text-center space-y-4 py-8">

                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-5xl shadow-lg border border-white/20"
                            >
                                💳
                            </motion.div>

                            <p className="text-zinc-600 dark:text-zinc-300 text-sm px-4 leading-relaxed">
                                A <strong>KőszegApp</strong> összes funkciójához (Foglalás, KőszegPass, Kedvezmények) egyetlen univerzális fiókra van szükséged.
                            </p>

                            <div className="pt-2">
                                <button
                                    onClick={() => navigate('/pass/register')}
                                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-blue-500/20"
                                >
                                    Login with KőszegPass
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">UNIFIED</span>
                                </button>
                                <p className="text-xs text-zinc-400 mt-3">
                                    Nincs még fiókod? A gombra kattintva regisztrálhatsz is.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* PROVIDER FORMS */
                        isLogin ? (
                            /* LOGIN FORM */
                            <form onSubmit={handleProviderLogin} className="space-y-4">
                                <div className="relative">
                                    <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Felhasználónév"
                                        value={loginUsername}
                                        onChange={e => setLoginUsername(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="password"
                                        placeholder="Jelszó"
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                                >
                                    {loading ? 'Belépés...' : 'Bejelentkezés'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(false)}
                                    className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline pt-2"
                                >
                                    Még nincs partner fiókom, regisztrálok
                                </button>
                            </form>
                        ) : (
                            /* REGISTER FORM */
                            <form onSubmit={handleProviderRegister} className="space-y-4">
                                <div className="relative">
                                    <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Cégnév / Szalon neve *"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white appearance-none"
                                        required
                                    >
                                        <option value="">Válassz kategóriát...</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {category === 'egyeb' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                        <input
                                            type="text"
                                            placeholder="Írd be a tevékenységet..."
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            className="w-full h-10 px-4 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600 focus:border-purple-500 outline-none text-sm dark:text-white"
                                            required
                                        />
                                    </motion.div>
                                )}

                                <div className="relative">
                                    <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Felhasználónév (Belépéshez) *"
                                        value={providerUsername}
                                        onChange={e => setProviderUsername(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="password"
                                        placeholder="Jelszó *"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-white/10 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                                >
                                    {loading ? 'Fiók létrehozása...' : 'Regisztráció'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsLogin(true)}
                                    className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline pt-2"
                                >
                                    Már van partner fiókom, belépek
                                </button>
                            </form>
                        )
                    )}
                </div>
            </motion.div>
        </div>
    );
}
