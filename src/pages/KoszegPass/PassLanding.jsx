import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IoQrCodeOutline, IoWalletOutline, IoRibbonOutline, IoCardOutline, IoArrowForward } from 'react-icons/io5';
import { FadeUp } from '../../components/AppleMotion';

export default function PassLanding() {
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const hotel = searchParams.get('hotel') || searchParams.get('hotel_source') || '';

    const handleStartRegister = () => {
        const target = hotel ? `/pass/register?hotel=${encodeURIComponent(hotel)}` : '/pass/register';
        navigate(target);
    };

    return (
        <div className="min-h-screen bg-[#0C234B] text-white pb-32 pt-20 px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-2xl mx-auto z-10 relative">
                {/* Header */}
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-[#C8AF64] to-white bg-clip-text text-transparent mb-2 tracking-tight">
                        KőszegPass
                    </h1>
                    <p className="text-blue-200/70 font-semibold tracking-wide text-sm uppercase">
                        A Te személyes útmutatód és kedvezménykártyád
                    </p>
                </header>

                {/* Mascot Card Image */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-8 bg-zinc-950 aspect-[1.3] flex flex-col justify-end"
                >
                    <img 
                        src="/images/koszegpass_mascot.jpg" 
                        alt="KőszegPass Kabala Család" 
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-[#C8AF64] text-[#0C234B] text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-lg">
                        2026 EDITION
                    </div>

                    <div className="relative p-6 z-10">
                        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">DIGITÁLIS KEDVEZMÉNYKÁRTYA</p>
                        <h2 className="text-2xl font-black text-white">Fedezd fel Kőszeget kedvezményekkel!</h2>
                    </div>
                </motion.div>

                {/* Main CTA */}
                <FadeUp delay={0.2}>
                    <button
                        onClick={handleStartRegister}
                        className="w-full bg-gradient-to-r from-[#C8AF64] to-[#e4cc7d] hover:scale-[1.02] active:scale-95 text-[#0C234B] font-black text-lg py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mb-8"
                    >
                        <span>Kártya igénylése</span>
                        <IoArrowForward size={20} />
                    </button>
                </FadeUp>

                {/* Benefits */}
                <div className="space-y-4 mb-8">
                    <FadeUp delay={0.3}>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                <IoRibbonOutline size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">Azonnali Kedvezmények</h3>
                                <p className="text-sm text-blue-100/60 leading-relaxed">
                                    Vásárláskor mutasd fel a kártyát Kőszeg múzeumaiban, éttermeiben és helyi üzleteiben az azonnali x% kedvezményért.
                                </p>
                            </div>
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.4}>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                                <IoWalletOutline size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">Apple & Google Wallet támogatás</h3>
                                <p className="text-sm text-blue-100/60 leading-relaxed">
                                    Vásárlás után egy kattintással elmentheted a telefonod digitális tárcájába (Wallet). Nem kell appot telepítened!
                                </p>
                            </div>
                        </div>
                    </FadeUp>

                    <FadeUp delay={0.5}>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                <IoCardOutline size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">Egy évig érvényes</h3>
                                <p className="text-sm text-blue-100/60 leading-relaxed">
                                    A kártya a vásárlás napjától számítva pontosan 1 évig érvényes. Minden évben egyedi új dizájnnal és kabalákkal érkezik.
                                </p>
                            </div>
                        </div>
                    </FadeUp>
                </div>

                {/* Plans / Pricing */}
                <FadeUp delay={0.6}>
                    <h3 className="text-xl font-black text-center text-[#C8AF64] mb-6">KőszegPass árak</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                            <h4 className="font-bold text-white text-lg mb-1">Egyéni Pass</h4>
                            <p className="text-xs text-blue-200/50 mb-4">Egy személy részére</p>
                            <p className="text-3xl font-black text-[#C8AF64]">4 000 Ft</p>
                            <p className="text-[10px] text-blue-100/40 mt-1">/ 1 év érvényesség</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-[#C8AF64]/30 rounded-2xl p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-[#C8AF64] text-[#0C234B] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                POPULÁRIS
                            </div>
                            <h4 className="font-bold text-white text-lg mb-1">Családi Pass</h4>
                            <p className="text-xs text-blue-200/50 mb-4">2 felnőtt + gyermekek részére</p>
                            <p className="text-3xl font-black text-[#C8AF64]">10 000 Ft</p>
                            <p className="text-[10px] text-blue-100/40 mt-1">/ 1 év érvényesség</p>
                        </div>
                    </div>
                </FadeUp>

                {hotel && (
                    <p className="text-center text-xs text-blue-200/40 mt-8 italic">
                        Kódot szkenneltél a szállásodon: <strong className="text-blue-200">{hotel}</strong>. 
                        A regisztráció után a szálláshelyed automatikusan rögzítésre kerül.
                    </p>
                )}
            </div>
        </div>
    );
}
