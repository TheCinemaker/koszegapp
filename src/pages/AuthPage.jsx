import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoLogoGoogle, IoPerson, IoKey, IoStorefront, IoArrowBack } from 'react-icons/io5';
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
    const { login, register } = useAuth(); // Added register to context usage
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('client'); // 'client' or 'provider'
    const [isProviderLogin, setIsProviderLogin] = useState(true); // Toggle between provider reg/login
    const [isClientLogin, setIsClientLogin] = useState(true); // Toggle between client reg/login
    const [loading, setLoading] = useState(false);

    // Client Form
    const [clientName, setClientName] = useState('');
    const [clientNick, setClientNick] = useState('');
    const [clientPass, setClientPass] = useState('');

    // Provider Registration Form
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState(''); // For 'egyeb'
    const [providerUsername, setProviderUsername] = useState(''); // Username instead of email
    const [password, setPassword] = useState('');

    // Provider Login Form
    const [loginUsername, setLoginUsername] = useState('');
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

    const handleClientLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Try Client Login
            await login(clientNick, clientPass, 'client');

            // --- DUALITY CHECK ---
            // Even if Client login succeeds, check if this is actually a Provider using the wrong tab.
            try {
                console.log("Client success. Checking for hidden Provider account...");
                await login(clientNick, clientPass, 'provider', true);

                // If we are here, Provider login ALSO succeeded!
                // Prioritize Business Dashboard for owners.
                toast.success('Szia Partner! (Szolgáltató fiók észlelve)');
                navigate('/business', { replace: true });
                return; // Stop here, don't go to client dashboard
            } catch (ignoreProviderError) {
                // Provider login failed, so they are just a client.
                // Continue as normal.
                console.log("No provider account found. Proceeding as client.");
            }

            toast.success('Szia ' + clientNick + '!');
            navigate('/koszegieknek'); // Client Dashboard
        } catch (clientError) {
            console.log("Client login failed, trying provider fallback...");
            try {
                // 2. Fallback: Try Provider Login (if client failed entirely)
                await login(clientNick, clientPass, 'provider');
                toast.success('Sikeres bejelentkezés (Partner)!');
                navigate('/business', { replace: true }); // Provider Dashboard
            } catch (providerError) {
                // Both failed
                console.error(clientError);
                if (providerError.message && providerError.message.includes("Invalid login")) {
                    toast.error('Hibás felhasználónév vagy jelszó!');
                } else {
                    toast.error('Hiba: ' + (providerError.message || "Ismeretlen hiba"));
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClientRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(clientNick, clientPass, clientName, 'client');
            toast.success('Sikeres regisztráció!');
            // Auto login after reg
            await login(clientNick, clientPass, 'client');
            navigate('/koszegieknek');
        } catch (error) {
            console.error(error);
            toast.error('Hiba: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debug: Check which Supabase project we are connecting to
        const sbUrl = import.meta.env.VITE_SUPABASE_URL;
        console.log("Connected to Supabase Project:", sbUrl ? sbUrl.substring(8, 28) + "..." : "Unknown");
    }, []);

    const handleProviderRegister = async (e) => {
        e.preventDefault();
        const finalCategory = category === 'egyeb' ? customCategory : category;

        if (!businessName || !finalCategory || !providerUsername || !password) {
            toast.error('Töltsd ki az összes mezőt!');
            return;
        }

        setLoading(true);
        console.log("Starting registration process...");
        try {
            // 1. Register logic
            const authData = await register(providerUsername, password, businessName, 'provider');
            console.log("Registration API returned:", authData);

            if (authData?.user) {
                const userId = authData.user.id;
                console.log("User created with ID:", userId);

                // 2. Ensuring Profile Exists
                console.log("Upserting profile...");
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        role: 'provider',
                        nickname: providerUsername
                    });

                if (profileError) console.error("Profile upsert warn:", profileError);
                else console.log("Profile upsert success.");

                // 3. CHECK SESSION
                if (authData.session) {
                    console.log("Session received. Navigating to Business Dashboard...");
                    toast.success('Sikeres regisztráció! Üdv a csapatban! 🚀');
                    navigate('/business', { replace: true });
                } else {
                    console.log("No session. Logging in manually...");
                    await login(providerUsername, password, 'provider');
                    console.log("Manual login success. Navigating to Business Dashboard...");
                    toast.success('Sikeres regisztráció! Üdv a csapatban! 🚀');
                    navigate('/business', { replace: true });
                }
            } else {
                console.warn("Registration returned no user object.");
                toast.error("Hiba: A regisztráció nem tért vissza felhasználóval.");
            }

        } catch (error) {
            console.error("Auth Loop Error:", error);
            if (error.message.includes("Email logins are disabled")) {
                toast.error('HIBA: A Supabase-ben az "Email Provider" nincs engedélyezve!');
            } else if (error.message.includes("User already registered")) {
                toast.error('Ez a felhasználónév már foglalt!');
            } else {
                toast.error(error.message || 'Hiba történt!');
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
            // 1. Try Provider Login
            const { user } = await login(loginUsername, loginPassword, 'provider');
            if (user) {
                toast.success('Sikeres bejelentkezés!');
                navigate('/business', { replace: true });
                return;
            }
        } catch (providerError) {
            console.log("Provider login failed, trying client fallback...", providerError);

            // Only try fallback if it was a credential error, not an API error
            try {
                // 2. Fallback: Try Client Login
                // Note: We use the same inputs (loginUsername/loginPassword)
                await login(loginUsername, loginPassword, 'client');
                toast.success('Sikeres bejelentkezés (Vendég)!');
                navigate('/koszegieknek');
            } catch (clientError) {
                console.error("Client fallback failed:", clientError);
                // Show the original provider error if likely relevant, or a generic one
                if (providerError.message && providerError.message.includes("Invalid login")) {
                    toast.error('Hibás felhasználónév vagy jelszó!');
                } else {
                    toast.error('Hiba: ' + (providerError.message || "Ismeretlen hiba"));
                }
            }
        } finally {
            // Only stop loading if we are NOT navigating (to prevent flash)
            // But React handles unmount cleanup, so just ensuring we don't block.
            if (window.location.pathname.includes('/auth')) {
                setLoading(false);
            }
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
                            {activeTab === 'client' ? 'Vendég Belépés' : 'Partner Portál'}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            {activeTab === 'client'
                                ? 'Kezeld foglalásaidat és kedvenceidet'
                                : isProviderLogin ? 'Jelentkezz be a pultba' : 'Regisztráld vállalkozásod'}
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



                    {/* CLIENT TAB */}
                    {activeTab === 'client' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {isClientLogin ? (
                                /* Client Login */
                                <form onSubmit={handleClientLogin}>
                                    <div className="space-y-3">
                                        <p className="text-center text-xs text-zinc-400">Jelentkezz be a fiókodba.</p>
                                        <input
                                            type="text"
                                            name="username"
                                            id="client-login-username"
                                            autoComplete="username"
                                            placeholder="Becenév (Felhasználónév)"
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-blue-500 outline-none dark:text-white"
                                            required
                                            value={clientNick}
                                            onChange={e => setClientNick(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            name="password"
                                            id="client-login-password"
                                            autoComplete="current-password"
                                            placeholder="Jelszó"
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-blue-500 outline-none dark:text-white"
                                            required
                                            value={clientPass}
                                            onChange={e => setClientPass(e.target.value)}
                                        />
                                        <button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition lg:hover:scale-105 active:scale-95">
                                            {loading ? 'Belépés...' : 'Bejelentkezés'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsClientLogin(false)}
                                            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline pt-2"
                                        >
                                            Nincs fiókom, regisztrálok
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* Client Registration */
                                <form onSubmit={handleClientRegister}>
                                    <div className="space-y-3">
                                        <p className="text-center text-xs text-zinc-400">Vendégként csak egy becenév kell.</p>
                                        <input
                                            type="text"
                                            name="name"
                                            id="client-register-name"
                                            autoComplete="name"
                                            placeholder="Teljes Név (Opcionális)"
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-blue-500 outline-none dark:text-white"
                                            value={clientName}
                                            onChange={e => setClientName(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            name="username"
                                            id="client-register-username"
                                            autoComplete="username"
                                            placeholder="Becenév (Felhasználónév) *"
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-blue-500 outline-none dark:text-white"
                                            required
                                            value={clientNick}
                                            onChange={e => setClientNick(e.target.value)}
                                        />
                                        <input
                                            type="password"
                                            name="password"
                                            id="client-register-password"
                                            autoComplete="new-password"
                                            placeholder="Jelszó *"
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-blue-500 outline-none dark:text-white"
                                            required
                                            value={clientPass}
                                            onChange={e => setClientPass(e.target.value)}
                                        />
                                        <button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition lg:hover:scale-105 active:scale-95">
                                            {loading ? 'Fiók létrehozása...' : 'Regisztráció'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsClientLogin(true)}
                                            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline pt-2"
                                        >
                                            Már van fiókom, belépek
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    )}

                    {/* PROVIDER TAB */}
                    {activeTab === 'provider' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {isProviderLogin ? (
                                /* Provider Login */
                                <form onSubmit={handleProviderLogin} className="space-y-4">
                                    <div className="relative">
                                        <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="text"
                                            name="username"
                                            id="provider-login-username"
                                            autoComplete="username"
                                            placeholder="Felhasználónév"
                                            value={loginUsername}
                                            onChange={e => setLoginUsername(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            id="provider-login-password"
                                            autoComplete="current-password"
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
                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
                                    >
                                        {loading ? 'Belépés...' : 'Bejelentkezés'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsProviderLogin(false)}
                                        className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline pt-2"
                                    >
                                        Még nincs fiókom, regisztrálok
                                    </button>
                                </form>
                            ) : (
                                /* Provider Registration */
                                <form onSubmit={handleProviderRegister} className="space-y-4">
                                    <div className="relative">
                                        <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="Cégnév / Szalon neve *"
                                            value={businessName}
                                            onChange={e => setBusinessName(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <select
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white appearance-none"
                                                required
                                            >
                                                <option value="">Válassz kategóriát...</option>
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.icon} {cat.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                                        </div>

                                        {/* Custom Category Input */}
                                        {category === 'egyeb' && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2">
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
                                    </div>

                                    <div className="relative">
                                        <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="text"
                                            name="username"
                                            id="provider-register-username"
                                            autoComplete="username"
                                            placeholder="Felhasználónév (Belépéshez) *"
                                            value={providerUsername}
                                            onChange={e => setProviderUsername(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            id="provider-register-password"
                                            autoComplete="new-password"
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
                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
                                    >
                                        {loading ? 'Fiók létrehozása...' : 'Regisztráció és Tovább'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsProviderLogin(true)}
                                        className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline pt-2"
                                    >
                                        Már van partner fiókom, belépek
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
