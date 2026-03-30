import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStorefront, IoTime, IoCall, IoMap, IoCheckmark, IoTabletPortraitOutline, IoPhonePortraitOutline, IoPerson, IoKey, IoArrowBack, IoLockClosed } from 'react-icons/io5';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'fodraszat', label: 'Fodrászat', icon: '💇' },
    { id: 'kormos', label: 'Körmös', icon: '💅' },
    { id: 'kozmetikus', label: 'Kozmetikus', icon: '✨' },
    { id: 'masszazs', label: 'Masszázs', icon: '💆' },
    { id: 'egyeb', label: 'Egyéb', icon: '🎨' },
];

export default function ProviderSetup() {
    const { user, login, register, logout } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('landing'); // 'landing', 'auth', 'form', 'success'
    const [authMode, setAuthMode] = useState('register'); // Default to register as most are new users
    const [selectedPackage, setSelectedPackage] = useState('software'); // 'software', 'tablet'
    const [loading, setLoading] = useState(false);

    // Auth Form State
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');

    // Form Stats
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('Kőszeg, ');
    const [description, setDescription] = useState('');

    const [slotDuration, setSlotDuration] = useState(30);
    const [openStart, setOpenStart] = useState('09:00');
    const [openEnd, setOpenEnd] = useState('17:00');
    const [customCategory, setCustomCategory] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Initial fetch to pre-fill if data exists
    useEffect(() => {
        if (user) {
            // Robust role check: metadata OR role OR email prefix
            const isProvider = (user.role === 'provider') ||
                (user.user_metadata?.role === 'provider') ||
                (user.email?.startsWith('provider.'));

            if (isProvider) {
                checkExisting();
                // If we were on auth, but now we are a provider, move to form
                if (step === 'auth') setStep('form');
            } else if (step === 'form') {
                // ONLY bounce back if strictly NOT a provider (and not just "loading")
                setStep('auth');
            }
        }
    }, [user, step]);

    const checkExisting = async () => {
        const { data } = await supabase.from('providers').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
            // If already approved, go to dashboard
            if (data.status === 'active') {
                navigate('/business', { replace: true });
                return;
            }
            // If pending, show success/pending screen
            if (data.status === 'pending') {
                setStep('success');
                return;
            }

            setBusinessName(data.business_name);
            setCategory(data.category);
            setAddress(data.location_address);
            setDescription(data.description);
            if (data.phone) setPhone(data.phone);
            if (data.slot_duration_min) setSlotDuration(data.slot_duration_min);
            if (data.opening_start) setOpenStart(data.opening_start);
            if (data.opening_end) setOpenEnd(data.opening_end);
        } else if (user?.user_metadata?.full_name) {
            setBusinessName(user.user_metadata.full_name);
        }
    };

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        setAuthMode('register'); // Ensure we start on register flow
        const userRole = user?.role || user?.user_metadata?.role;
        if (userRole === 'provider' || user?.email?.startsWith('provider.')) {
            setStep('form');
        } else {
            setStep('auth');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (authMode === 'login') {
                await login(authUsername, authPassword, 'provider');
                toast.success('Sikeres üzleti belépés!');
            } else {
                await register(authUsername, authPassword, businessName || authUsername, 'provider');
                toast.success('Üzleti fiók létrehozva!');
            }
            setStep('form');
        } catch (error) {
            console.error("Auth error:", error);
            toast.error('Hiba: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!termsAccepted) {
            toast.error('Kérjük, fogadd el a szolgáltatói szerződési feltételeket!');
            setLoading(false);
            return;
        }

        try {
            if (!user?.id) {
                toast.error('Bejelentkezés szükséges a mentéshez!');
                navigate('/auth');
                return;
            }

            // Upsert provider details
            const finalCategory = category === 'egyeb' ? customCategory : category;

            const updates = {
                user_id: user.id,
                business_name: businessName,
                category: finalCategory,
                location_address: address,
                description: description || `A(z) ${businessName} hivatalos oldala.`,
                phone: phone,
                slot_duration_min: parseInt(slotDuration),
                opening_start: openStart,
                opening_end: openEnd,
                updated_at: new Date(),
                status: 'pending' // Force pending status
            };

            const { error } = await supabase
                .from('providers')
                .upsert(updates, { onConflict: 'user_id' });

            if (error) throw error;

            // Notify Admin
            try {
                await fetch('/.netlify/functions/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessName,
                        phone,
                        email: user.email,
                        packageType: selectedPackage
                    })
                });
            } catch (notifyError) {
                console.error("Failed to notify admin:", notifyError);
            }

            setStep('success');
            toast.success('Regisztráció elküldve! 🚀');

        } catch (error) {
            console.error(error);
            toast.error('Hiba a mentéskor: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER: SUCCESS / PENDING ---
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IoTime className="text-4xl text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">Jóváhagyásra vár</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                        Köszönjük a regisztrációt! 🎉<br />
                        Kollégáink hamarosan felveszik Veled a kapcsolatot a megadott telefonszámon (<strong>{phone}</strong>), hogy egyeztessük a részleteket és a szerződést.
                    </p>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm text-zinc-500 mb-6">
                        Amint aktiváljuk a fiókodat, emailben értesítünk, és belépés után azonnal használhatod a rendszert.
                    </div>
                    <button onClick={() => navigate('/')} className="text-indigo-600 font-bold hover:underline">
                        Vissza a főoldalra
                    </button>
                </motion.div>
            </div>
        );
    }

    // --- RENDER: LANDING PAGE ---
    if (step === 'landing') {
        return (
            <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto text-center space-y-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm tracking-wide uppercase"
                    >
                        Szolgáltatóknak
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight"
                    >
                        Több idő a vendégekre,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">kevesebb a telefonnyomkodásra.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto"
                    >
                        Modernizáld a vállalkozásod Kőszeg saját időpontfoglaló rendszerével.
                        Nincs többé elfelejtett füzet, nincs éjszakai üzenetváltás.
                    </motion.p>
                </div>

                {/* --- PACKAGES --- */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                    {/* Basic Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 hover:scale-[1.02] transition-transform"
                    >
                        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl mb-6">
                            <IoPhonePortraitOutline className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Saját Eszköz</h3>
                        <p className="text-zinc-500 mb-6">Start csomag, ha a saját telefonodat vagy laptopodat használnád.</p>

                        <div className="text-4xl font-black text-zinc-900 dark:text-white mb-8">
                            5.000 Ft <span className="text-lg font-medium text-zinc-400">/ hó</span>
                        </div>

                        <ul className="space-y-4 mb-8 text-zinc-600 dark:text-zinc-300">
                            <li className="flex items-center gap-3"><IoCheckmark className="text-green-500 text-lg" /> Korlátlan foglalás</li>
                            <li className="flex items-center gap-3"><IoCheckmark className="text-green-500 text-lg" /> 0-24 online naptár</li>
                            <li className="flex items-center gap-3"><IoCheckmark className="text-green-500 text-lg" /> Saját profil a KőszegAPP-ban</li>
                        </ul>

                        <button
                            onClick={() => handleSelectPackage('software')}
                            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            Ezt választom
                        </button>
                    </motion.div>

                    {/* Pro Plan (Tablet) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative bg-zinc-900 dark:bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/30 border border-zinc-800 dark:border-zinc-200 hover:scale-[1.02] transition-transform"
                    >
                        <div className="absolute top-6 right-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                            Ajánlott
                        </div>

                        <div className="w-14 h-14 bg-white/10 dark:bg-zinc-900/10 rounded-2xl flex items-center justify-center text-2xl mb-6">
                            <IoTabletPortraitOutline className="text-white dark:text-zinc-900" />
                        </div>
                        <h3 className="text-2xl font-bold text-white dark:text-zinc-900 mb-2">Tablet + Szoftver</h3>
                        <p className="text-zinc-400 dark:text-zinc-600 mb-6">Prémium megoldás. Mi adjuk a hardvert, neked csak a vendéggel kell foglalkoznod.</p>

                        <div className="text-4xl font-black text-white dark:text-zinc-900 mb-8">
                            15.000 Ft <span className="text-lg font-medium text-zinc-500">/ hó</span>
                        </div>

                        <ul className="space-y-4 mb-8 text-zinc-300 dark:text-zinc-700">
                            <li className="flex items-center gap-3"><IoCheckmark className="text-indigo-400 dark:text-indigo-600 text-lg" /> <strong>MINDEN</strong> a Start csomagból</li>
                            <li className="flex items-center gap-3"><IoCheckmark className="text-indigo-400 dark:text-indigo-600 text-lg" /> <strong>Tabletet biztosítunk</strong> állvánnyal</li>
                            <li className="flex items-center gap-3"><IoCheckmark className="text-indigo-400 dark:text-indigo-600 text-lg" /> "Kioszk mód" - mindig csak a naptár fut</li>
                            <li className="flex items-center gap-3"><IoCheckmark className="text-indigo-400 dark:text-indigo-600 text-lg" /> Kiemelt megjelenés a listában</li>
                        </ul>

                        <button
                            onClick={() => handleSelectPackage('tablet')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-1"
                        >
                            Érdekel a Tablet Csomag 🚀
                        </button>
                    </motion.div>

                </div>
            </div>
        );
    }

    // --- RENDER: REGISTRATION FORM ---
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">

            {/* --- BUSINESS AUTH STEP --- */}
            {step === 'auth' && (
                <div className="max-w-md mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                                <IoLockClosed className="text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                                {authMode === 'login' ? 'Üzleti Belépés' : 'Új Üzleti Fiók'}
                            </h2>
                            <p className="text-zinc-500 text-sm mt-2">
                                A vállalkozói felülethez külön üzleti fiók szükséges.
                            </p>
                        </div>

                        {user &&
                            (user.role || user.user_metadata?.role) !== 'provider' &&
                            !user.email?.startsWith('provider.') && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                                    Jelenleg magánszemélyként vagy belépve ({user.email}). <br />
                                    A folytatáshoz kérjük lépj ki, vagy regisztrálj egy külön üzleti fiókot.
                                    <button onClick={() => logout()} className="block mt-2 font-bold underline text-left">Kijelentkezés</button>
                                </div>
                            )}

                        <form onSubmit={handleAuthAction} className="space-y-4">
                            {authMode === 'register' && (
                                <div className="relative">
                                    <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Cégnév / Vállalkozás neve"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white"
                                        required
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Üzleti felhasználónév"
                                    value={authUsername}
                                    onChange={e => setAuthUsername(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="password"
                                    placeholder="Jelszó"
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                            >
                                {loading ? 'Folyamatban...' : (authMode === 'login' ? 'Belépés' : 'Üzleti fiók létrehozása')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                className="w-full text-sm text-purple-600 dark:text-purple-400 hover:underline pt-2"
                            >
                                {authMode === 'login' ? 'Nincs még üzleti fiókom, regisztrálok' : 'Már van üzleti fiókom, belépek'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('landing')}
                                className="w-full text-sm text-zinc-400 hover:text-zinc-600 pt-4"
                            >
                                Vissza a csomagokhoz
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* --- REGISTRATION FORM --- */}
            {step === 'form' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 mx-auto"
                >
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => setStep('landing')} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                            <IoArrowBack className="text-xl" />
                        </button>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            <span>2. Lépés: Adatok megadása</span>
                        </div>
                        <div className="w-10" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cégnév/vállalkozó neve</label>
                                <div className="relative">
                                    <IoStorefront className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Kategória</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium appearance-none"
                                    required
                                >
                                    <option value="">Válassz...</option>
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                                </select>
                            </div>

                            <AnimatePresence>
                                {category === 'egyeb' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Milyen területen dolgozol? *</label>
                                        <input
                                            type="text"
                                            placeholder="Pl: Tetováló, Könyvelő, stb..."
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                            required
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cím</label>
                                <div className="relative">
                                    <IoMap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Telefon (Kapcsolattartáshoz)</label>
                                <div className="relative">
                                    <IoCall className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="tel"
                                        placeholder="+36 30 ..."
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 focus:outline-none dark:text-white font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TIME SETTINGS */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <IoTime className="text-purple-500" /> Időpontok és Nyitvatartás
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Időpont hossza (perc)</label>
                                    <select
                                        value={slotDuration}
                                        onChange={e => setSlotDuration(e.target.value)}
                                        className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                    >
                                        <option value="15">15 perc</option>
                                        <option value="30">30 perc (Normál)</option>
                                        <option value="45">45 perc</option>
                                        <option value="60">60 perc (1 óra)</option>
                                        <option value="90">90 perc</option>
                                        <option value="120">120 perc</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Nyitás</label>
                                    <input
                                        type="time"
                                        value={openStart}
                                        onChange={e => setOpenStart(e.target.value)}
                                        className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Zárás</label>
                                    <input
                                        type="time"
                                        value={openEnd}
                                        onChange={e => setOpenEnd(e.target.value)}
                                        className="w-full h-10 px-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TERMS AND CONDITIONS */}
                        <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={e => setTermsAccepted(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                Elfogadom a <span className="text-purple-600 dark:text-purple-400 font-bold underline cursor-pointer" onClick={() => window.open('/terms-provider', '_blank')}>Helyi Szolgáltatói Szerződés</span> feltételeit és tudomásul veszem, hogy a regisztráció fizetési kötelezettséggel járhat a választott csomag alapján.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {loading ? 'Mentés...' : 'Regisztráció Küldése 🚀'}
                        </button>
                    </form>
                </motion.div>
            )}
        </div>
    );
}
