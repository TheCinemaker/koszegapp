import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { IoArrowBack, IoLogoGoogle, IoPerson, IoKey, IoStorefront, IoBriefcase } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇' },
    { id: 'kormos', label: 'Körmös', icon: '💅' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨' },
];

export default function AuthPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/koszegieknek';

    const [activeTab, setActiveTab] = useState('client'); // 'client' or 'provider'
    const [isProviderLogin, setIsProviderLogin] = useState(false); // Toggle between provider reg/login
    const [loading, setLoading] = useState(false);

    // Provider Registration Form
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Provider Login Form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/koszegieknek`
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error(error);
            toast.error('Google bejelentkezés sikertelen!');
        }
    };

    const handleProviderRegister = async (e) => {
        e.preventDefault();
        if (!businessName || !category || !email || !password) {
            toast.error('Töltsd ki az összes mezőt!');
            return;
        }

        setLoading(true);
        try {
            // Register user with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        business_name: businessName,
                        category,
                        role: 'provider'
                    }
                }
            });

            if (error) throw error;

            toast.success('Sikeres regisztráció!');
            navigate('/provider-setup', { replace: true });
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Regisztráció sikertelen!');
        } finally {
            setLoading(false);
        }
    };

    const handleProviderLogin = async (e) => {
        e.preventDefault();
        if (!loginEmail || !loginPassword) {
            toast.error('Add meg az email-t és jelszót!');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword
            });

            if (error) throw error;

            toast.success('Sikeres bejelentkezés!');
            navigate('/business-dashboard', { replace: true });
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Bejelentkezés sikertelen!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950 flex items-center justify-center p-6">
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
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-white/10">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                            {activeTab === 'client' ? 'Bejelentkezés' : 'Szolgáltató'}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            {activeTab === 'client'
                                ? 'Foglalj időpontot egyszerűen'
                                : isProviderLogin ? 'Jelentkezz be' : 'Regisztrálj szolgáltatóként'}
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

                    {/* Client Tab */}
                    {activeTab === 'client' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all font-bold text-zinc-700 dark:text-white shadow-sm"
                            >
                                <IoLogoGoogle className="text-xl text-red-500" />
                                Bejelentkezés Google-lel
                            </button>
                        </motion.div>
                    )}

                    {/* Provider Tab */}
                    {activeTab === 'provider' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {!isProviderLogin ? (
                                /* Provider Registration */
                                <form onSubmit={handleProviderRegister} className="space-y-4">
                                    <div className="relative">
                                        <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="Szalon neve *"
                                            value={businessName}
                                            onChange={e => setBusinessName(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Kategória *</label>
                                        <select
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        >
                                            <option value="">Válassz...</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.icon} {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="email"
                                            placeholder="Email *"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
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
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Folyamatban...' : 'Regisztráció'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsProviderLogin(true)}
                                        className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        Már regisztráltam
                                    </button>
                                </form>
                            ) : (
                                /* Provider Login */
                                <form onSubmit={handleProviderLogin} className="space-y-4">
                                    <div className="relative">
                                        <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={loginEmail}
                                            onChange={e => setLoginEmail(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
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
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Folyamatban...' : 'Bejelentkezés'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsProviderLogin(false)}
                                        className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        Még nincs fiókom
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
