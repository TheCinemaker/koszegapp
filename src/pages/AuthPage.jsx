
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { IoArrowBack, IoPerson, IoMail, IoKey, IoHappy } from 'react-icons/io5';

export default function AuthPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/koszegieknek'; // Redirect target

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                toast.success('Sikeres bejelentkezés!');
            } else {
                if (!nickname) throw new Error('A becenév megadása kötelező!');
                await register(email, password, fullName, nickname);
                toast.success('Sikeres regisztráció!');
            }
            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Hiba történt. Ellenőrizd az adatokat.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 text-blue-500" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 text-purple-500" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative z-10 border border-white/50 dark:border-white/10"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                    <IoArrowBack size={24} />
                </button>

                <div className="text-center mb-8 pt-6">
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
                        {isLogin ? 'Üdv újra!' : 'Csatlakozz!'}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        {isLogin ? 'Jelentkezz be a fiókodba' : 'Kőszeg Beauty & Locals fiók létrehozása'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {!isLogin && (
                        <>
                            <div className="relative">
                                <IoPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Teljes név"
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="relative">
                                <IoHappy className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Becenév (szolgáltatók így látnak)"
                                    required
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all dark:text-white"
                                />
                            </div>
                        </>
                    )}

                    <div className="relative">
                        <IoMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="email"
                            placeholder="Email cím"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div className="relative">
                        <IoKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="password"
                            placeholder="Jelszó"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-blue-500 focus:outline-none transition-all dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 mt-4"
                    >
                        {loading ? 'Folyamatban...' : (isLogin ? 'Bejelentkezés' : 'Regisztráció')}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        {isLogin ? "Nincs még fiókod?" : "Már regisztráltál?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-bold text-blue-600 hover:underline"
                        >
                            {isLogin ? 'Regisztrálj most!' : 'Jelentkezz be!'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
