import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    IoWalletOutline, 
    IoRibbonOutline, 
    IoCardOutline, 
    IoArrowForward, 
    IoSwapHorizontal 
} from 'react-icons/io5';
import { FadeUp } from '../../components/AppleMotion';
import PassCard from './PassCard';
import QRCode from 'qrcode';

export default function PassLanding() {
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const hotel = searchParams.get('hotel') || searchParams.get('hotel_source') || '';

    const [isFlipped, setIsFlipped] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        // Generálunk egy bemutató QR-kódot a mintakártyához
        QRCode.toDataURL('https://visitkoszeg.hu/pass', {
            width: 200,
            margin: 1,
            color: { dark: '#0C234B', light: '#FFFFFF' }
        })
        .then(setQrCodeUrl)
        .catch((err) => console.error('Failed to generate mock QR:', err));
    }, []);

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

                {/* Interactive PassCard Preview (Bábus kép helyett a valódi, csillogó, pörgethető kék kártya) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 flex flex-col items-center"
                >
                    <div className="w-full max-w-sm">
                        <PassCard
                            holderName="MINTA JÁNOS"
                            passType="individual"
                            serial={1}
                            expiresAt={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()}
                            qrCodeUrl={qrCodeUrl}
                            isExpired={false}
                            isFlipped={isFlipped}
                            onToggle={() => setIsFlipped(!isFlipped)}
                        />
                    </div>
                    
                    {/* Flip Hint */}
                    <div className="flex justify-center items-center gap-1.5 mt-3 text-blue-200/40 pointer-events-none">
                        <IoSwapHorizontal size={12} className="animate-pulse text-[#C8AF64]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            Koppints a kártyára a bemutató forgatásához!
                        </span>
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
                                    Vásárláskor mutasd fel a kártyát Kőszeg múzeumaiban, éttermeiben és helyi üzleteiben az azonnali kedvezményekért.
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
                                    Vásárlás után egy kattintással elmentheted a telefonod digitális tárcájába (Wallet). Nem kell külön applikációt letöltened!
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
                                    A kártya a vásárlás napjától számítva pontosan 1 évig érvényes. Minden évben megújuló egyedi dizájnnal és kedvezményekkel vár.
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
