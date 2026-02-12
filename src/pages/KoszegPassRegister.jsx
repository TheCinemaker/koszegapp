import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Added import
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { IoArrowBack, IoPerson, IoLockClosed, IoIdCard, IoInformationCircleOutline, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function KoszegPassRegister() {
    const { t } = useTranslation('auth'); // Load namespace 
    const { register, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true); // Default to Login
    const [showInfo, setShowInfo] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        username: '',
        password: '',
        phone: '',
        address: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (form.password.length < 6) {
            toast.error(t('errors.passwordLength'));
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                // --- LOGIN LOGIC ---
                // We use 'client' because KőszegPass users are just clients in the auth system context
                await login(form.username, form.password, 'client');
                toast.success(t('koszegPass.successLogin'));
                navigate('/pass/profile', { replace: true });

            } else {
                // --- REGISTER LOGIC ---
                // 1. Create Auth User (Role: koszegpass)
                const authData = await register(form.username, form.password, form.fullName, 'koszegpass');

                if (authData?.user) {
                    const userId = authData.user.id;

                    // 2. Insert into ISOLATED koszegpass_users table
                    // We use UPSERT to avoid race conditions with the Auth Trigger which also creates this row.
                    const { error: dbError } = await supabase
                        .from('koszegpass_users')
                        .upsert({
                            id: userId,
                            username: form.username,
                            full_name: form.fullName,
                            phone: form.phone,
                            address: form.address
                        })
                        .select(); // Ensure we wait for completion

                    if (dbError) {
                        // If conflict ignore handles it, great. If not, log it.
                        console.warn("DB Insert warning:", dbError);
                    }

                    toast.success(t('koszegPass.successRegister'));

                    // Auto Login if needed
                    if (!authData.session) {
                        await login(form.username, form.password, 'client');
                    }

                    navigate('/pass/profile', { replace: true });
                }
            }

        } catch (error) {
            console.error(error);
            if (error.message?.includes("already registered") || error.message?.includes("unique constraint")) {
                toast.error(t('errors.usernameTaken'));
            } else if (error.message?.includes("Invalid login")) {
                toast.error(t('errors.invalidCredentials'));
            } else {
                toast.error(t('errors.genericError') + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/20 blur-[100px] rounded-full pointing-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full pointing-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10"
            >
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors order-1">
                        <IoArrowBack size={20} />
                    </button>
                    {/* Info Button - Order 2 */}
                    <button onClick={() => setShowInfo(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors order-3 text-blue-400">
                        <IoInformationCircleOutline size={22} />
                    </button>
                    {/* Toggle Button - Order 2 (Centered-ish via flex) */}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 order-2 mx-auto"
                    >
                        {isLogin ? t('koszegPass.switchRegister') : t('koszegPass.switchLogin')}
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {isLogin ? t('koszegPass.loginTitle') : t('koszegPass.registerTitle')}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2">
                        {isLogin ? t('koszegPass.loginSubtitle') : t('koszegPass.registerSubtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Username (Always needed) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-zinc-500 ml-1">{t('koszegPass.usernameLabel')}</label>
                        <div className="relative">
                            <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                required
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                className="w-full h-12 bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
                                placeholder={t('koszegPass.usernamePlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Full Name & Extra Fields (Register Only) */}
                    {!isLogin && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-zinc-500 ml-1">{t('koszegPass.fullNameLabel')}</label>
                                <div className="relative">
                                    <IoIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        required
                                        value={form.fullName}
                                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                                        className="w-full h-12 bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
                                        placeholder={t('koszegPass.fullNamePlaceholder')}
                                    />
                                </div>
                            </div>

                            {/* Optional: Phone & Address (Can be added later in profile too) */}
                            {/* <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Telefonszám (Opcionális)</label>
                                <input 
                                    type="text" 
                                    value={form.phone}
                                    onChange={e => setForm({...form, phone: e.target.value})}
                                    className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
                                    placeholder="+36 30 ..."
                                />
                            </div> */}
                        </motion.div>
                    )}

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-zinc-500 ml-1">{t('koszegPass.passwordLabel')}</label>
                        <div className="relative">
                            <IoLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full h-12 bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
                                placeholder={t('koszegPass.passwordPlaceholder')}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading
                            ? (isLogin ? t('koszegPass.loginLoading') : t('koszegPass.registerLoading'))
                            : (isLogin ? t('koszegPass.loginButton') : t('koszegPass.registerButton'))}
                    </button>

                </form>

            </motion.div>

            {/* INFO MODAL */}
            <AnimatePresence>
                {showInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInfo(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowInfo(false)}
                                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <IoClose size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-indigo-500/30">
                                    💎
                                </div>
                                <h2 className="text-xl font-bold text-white">{t('koszegPass.info.title')}</h2>
                            </div>

                            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                                <p dangerouslySetInnerHTML={{ __html: t('koszegPass.info.description') }}></p>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-xl">🛍️</span>
                                        <div>
                                            <strong className="block text-white text-xs uppercase tracking-wide mb-1">{t('koszegPass.info.pointsTitle')}</strong>
                                            <span>{t('koszegPass.info.pointsDesc')}</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-xl">🏷️</span>
                                        <div>
                                            <strong className="block text-white text-xs uppercase tracking-wide mb-1">{t('koszegPass.info.discountsTitle')}</strong>
                                            <span>{t('koszegPass.info.discountsDesc')}</span>
                                        </div>
                                    </li>
                                </ul>
                                <p className="text-xs text-zinc-500 italic text-center pt-2">
                                    {t('koszegPass.info.footer')}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowInfo(false)}
                                className="w-full py-3 mt-6 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                {t('koszegPass.info.button')}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
