import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoQrCodeOutline, IoWalletOutline, IoRibbonOutline, IoTimeOutline, IoCheckmarkCircle, IoInformationCircle } from 'react-icons/io5';
import { FadeUp } from '../components/AppleMotion';
import toast from 'react-hot-toast';

const CityPass = () => {
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'buy'
    const [selectedPlan, setSelectedPlan] = useState(null);

    const plans = [
        { id: '24h', name: '24 órás Turista', price: '2.500 Ft', color: 'from-blue-500 to-indigo-600', benefits: ['Ingyenes múzeumok', '10% étterem kedvezmény', 'Ingyenes buszjegy'] },
        { id: '48h', name: '48 órás Hétvége', price: '4.500 Ft', color: 'from-purple-500 to-pink-600', benefits: ['Minden, ami 24h', '+ Strand belépő', '+ Borkóstoló kupon'] },
        { id: 'year', name: 'Éves Kőszeg Kártya', price: '12.000 Ft', color: 'from-amber-400 to-orange-600', benefits: ['Korlátlan múzeum', 'Exkluzív rendezvények', 'Városi parkolás', 'VIP státusz'] }
    ];

    const handleBuy = (plan) => {
        toast.loading("Fizetés feldolgozása...", { duration: 1500 });
        setTimeout(() => {
            toast.success("Sikeres vásárlás! A kártyád aktív.");
            setActiveTab('active');
        }, 1500);
    };

    return (
        <div className="min-h-screen pb-32 pt-20 px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-50/50 via-white/50 to-purple-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -z-10 pointer-events-none" />
            <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-2xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
                        Kőszeg City Pass
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Egy kártya. Ezer élmény.</p>
                </header>

                {/* Toggle */}
                <div className="flex p-1 bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/40 dark:border-white/5 shadow-sm">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'active' ? 'bg-white dark:bg-gray-800 shadow-md text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Kártyám
                    </button>
                    <button
                        onClick={() => setActiveTab('buy')}
                        className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'buy' ? 'bg-white dark:bg-gray-800 shadow-md text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Vásárlás
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'active' ? (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {/* DIGITAL CARD DISPLAY */}
                            <div className="relative group perspective-1000">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 rounded-[2rem]" />
                                <div className="relative aspect-[1.58] rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#1a1c2e] to-[#2d3748] border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-white">
                                    {/* Texture */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                    <div className="flex justify-between items-start z-10">
                                        <div>
                                            <p className="text-xs font-bold text-white/60 tracking-widest uppercase mb-1">CITY PASS</p>
                                            <h2 className="text-2xl font-bold tracking-tight">Kőszeg Kártya</h2>
                                        </div>
                                        <IoRibbonOutline className="text-3xl text-yellow-400" />
                                    </div>

                                    <div className="z-10 flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-medium text-white/50 mb-1">TULAJDONOS</p>
                                            <p className="font-mono font-bold text-lg tracking-wider">KOVÁCS JÁNOS</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl">
                                            <IoQrCodeOutline className="text-4xl text-black" />
                                        </div>
                                    </div>

                                    {/* Holographic Strip simulation */}
                                    <div className="absolute bottom-6 left-0 right-0 h-12 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 mix-blend-overlay pointer-events-none" />
                                </div>
                            </div>

                            {/* Status Info */}
                            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <IoCheckmarkCircle className="text-2xl" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Aktív Státusz</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Érvényes: 2024.12.31.</p>
                                    </div>
                                </div>
                                <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Részletek</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-white/10 text-center">
                                    <p className="text-sm text-gray-500 mb-1">Megtakarítva</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">12.500 Ft</p>
                                </div>
                                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/50 dark:border-white/10 text-center">
                                    <p className="text-sm text-gray-500 mb-1">Hátralévő napok</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">245</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                {/* Apple Wallet Button - Re-enabled for PassSource */}
                                <a
                                    href="YOUR_PASSSOURCE_LINK_HERE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full transition-transform active:scale-95"
                                >
                                    <img src="/addToAppleWallet.svg" alt="Add to Apple Wallet" className="h-[48px] w-auto mx-auto" />
                                </a>

                                {/* Google Wallet Button */}
                                <a
                                    href="YOUR_GOOGLE_WALLET_LINK_HERE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-white text-black border border-gray-200 py-3.5 rounded-2xl font-bold text-center shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                                        <path fill="#4285F4" d="M23.49 12.275c0-.85-.075-1.7-.225-2.51H12v4.76h6.445c-.275 1.485-1.12 2.74-2.4 3.6v3h3.89c2.275-2.095 3.585-5.18 3.585-8.85z" />
                                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.075 7.94-2.9l-3.89-3c-1.07.725-2.445 1.15-4.05 1.15-3.125 0-5.77-2.11-6.72-4.96H1.36v3.115C3.435 21.525 7.425 24 12 24z" />
                                        <path fill="#FBBC05" d="M5.28 14.29c-.245-.735-.38-1.52-.38-2.29s.135-1.555.385-2.29V6.595H1.36c-.85 1.695-1.34 3.625-1.34 5.67s.49 3.975 1.34 5.67l3.92-3.645z" />
                                        <path fill="#EA4335" d="M12 4.75c1.765 0 3.35.605 4.6 1.795l3.415-3.415C17.95 1.19 15.235 0 12 0 7.425 0 3.435 2.475 1.36 6.595l3.92 3.645c.95-2.85 3.595-4.96 6.72-4.96z" />
                                    </svg>
                                    Add to Google Wallet
                                </a>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="buy"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {plans.map((plan, index) => (
                                <FadeUp key={plan.id} delay={index * 0.1}>
                                    <div
                                        className={`
                                            relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 cursor-pointer
                                            ${selectedPlan === plan.id
                                                ? 'bg-white dark:bg-gray-800 border-indigo-500 shadow-xl scale-[1.02]'
                                                : 'bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 hover:bg-white/60'}
                                        `}
                                        onClick={() => setSelectedPlan(plan.id)}
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.color} opacity-20 blur-[40px] rounded-full -mr-10 -mt-10`} />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-bold dark:text-white">{plan.name}</h3>
                                                {selectedPlan === plan.id && <IoCheckmarkCircle className="text-2xl text-indigo-600" />}
                                            </div>

                                            <p className="text-3xl font-black mb-6 dark:text-white">{plan.price}</p>

                                            <ul className="space-y-2 mb-6">
                                                {plan.benefits.map((b, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <IoCheckmarkCircle className="text-green-500 shrink-0" />
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBuy(plan); }}
                                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-gradient-to-r ${plan.color}`}
                                            >
                                                Kiválasztás
                                            </button>
                                        </div>
                                    </div>
                                </FadeUp>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CityPass;
