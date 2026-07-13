import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    IoQrCodeOutline, 
    IoShieldCheckmark, 
    IoCalendar, 
    IoArrowBack, 
    IoInformationCircleOutline, 
    IoSwapHorizontal, 
    IoSparkles
} from 'react-icons/io5';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function PassProfile() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const passId = searchParams.get('id') || '';
    const qrToken = searchParams.get('token') || '';
    
    const [loading, setLoading] = useState(true);
    const [pass, setPass] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        async function fetchPass() {
            if (!passId && !qrToken && !slug) {
                setLoading(false);
                return;
            }

            try {
                let query = supabase.from('koszeg_passes').select('*');

                if (passId) {
                    query = query.eq('id', passId);
                } else if (qrToken) {
                    query = query.eq('qr_token', qrToken);
                } else if (slug) {
                    query = query.eq('slug', slug);
                }

                const { data, error } = await query.single();

                if (error) throw error;

                setPass(data);

                // Generate local QR code URL
                const qrVal = data.qr_token;
                const qrUrl = await QRCode.toDataURL(qrVal, {
                    width: 250,
                    margin: 1,
                    color: { dark: '#0C234B', light: '#FFFFFF' }
                });
                setQrCodeUrl(qrUrl);

            } catch (err) {
                console.error('Error fetching pass:', err);
                toast.error('Nem sikerült betölteni a kártyaadatokat');
            } finally {
                setLoading(false);
            }
        }

        fetchPass();
    }, [passId, qrToken, slug]);

    const handleGoogleWallet = () => {
        if (!pass) return;
        window.location.href = `/.netlify/functions/koszeg-pass-google?passId=${pass.id}`;
    };

    const handleAppleWallet = () => {
        if (!pass) return;
        window.location.href = `/.netlify/functions/koszeg-pass-apple?passId=${pass.id}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0C234B] flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8AF64] mx-auto mb-4"></div>
                    <p className="text-blue-200/60 text-sm">Kártya lekérése...</p>
                </div>
            </div>
        );
    }

    if (!pass) {
        return (
            <div className="min-h-screen bg-[#0C234B] flex items-center justify-center text-white p-4 text-center">
                <div>
                    <h1 className="text-2xl font-black text-red-400 mb-4">Érvénytelen Kártya ⚠️</h1>
                    <p className="text-blue-200/60 mb-6 text-sm">A megadott kártya nem található vagy nem aktív.</p>
                    <Link to="/pass" className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm">
                        Vissza a kezdőlapra
                    </Link>
                </div>
            </div>
        );
    }

    const formatHu = (dateStr) =>
        new Date(dateStr).toLocaleDateString('hu-HU', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });

    const isExpired = new Date() > new Date(pass.expires_at);

    return (
        <div className="min-h-screen bg-[#0C234B] text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10 my-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 text-center shadow-2xl">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <Link 
                            to="/pass" 
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-10 h-10"
                        >
                            <IoArrowBack size={20} />
                        </Link>
                        <h2 className="text-[#C8AF64] font-black text-sm uppercase tracking-widest flex items-center gap-1.5 justify-center">
                            <IoSparkles className="text-yellow-400" /> Személyes Pass
                        </h2>
                        <div className="w-10 h-10" /> {/* Spacer */}
                    </div>

                    {/* 3D Flipping Card Container */}
                    <div className="flex justify-center mb-8">
                        <div
                            className="relative w-full aspect-[1.586/1] group cursor-pointer"
                            style={{ perspective: '1200px' }}
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <motion.div
                                className="w-full h-full relative"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* CARD FRONT FACE */}
                                <div
                                    className="absolute inset-0 rounded-2xl p-5 shadow-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#0d47a1] to-[#311b92] flex flex-col justify-between"
                                    style={{ 
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden'
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-[0.15] bg-[url('/noise.svg')] mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    
                                    {/* Holographic reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 skew-x-12 -translate-y-full group-hover:animate-shine pointer-events-none" />

                                    <div className="z-10 flex justify-between items-start">
                                        <div>
                                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">KŐSZEGPASS</p>
                                            <h3 className="text-lg font-bold tracking-tight text-white leading-tight mt-0.5 max-w-[180px] truncate">{pass.holder_name}</h3>
                                        </div>
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase shadow-lg ${
                                            isExpired ? 'bg-red-500 text-white' : 'bg-[#C8AF64] text-[#0C234B]'
                                        }`}>
                                            {isExpired ? 'Lejárt' : (pass.pass_type === 'family' ? 'Családi' : 'Egyéni')}
                                        </span>
                                    </div>

                                    <div className="z-10 flex justify-between items-end">
                                        <div>
                                            <p className="text-[7px] text-blue-200/40 uppercase tracking-wider font-semibold">Érvényesség</p>
                                            <p className="text-xs font-mono text-[#C8AF64] font-bold mt-0.5">{formatHu(pass.expires_at)}</p>
                                        </div>
                                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 flex items-center justify-center">
                                            <IoQrCodeOutline className="text-lg text-[#C8AF64]" />
                                        </div>
                                    </div>
                                </div>

                                {/* CARD BACK FACE */}
                                <div
                                    className="absolute inset-0 rounded-2xl p-5 shadow-2xl overflow-hidden bg-white text-zinc-950 border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center text-center"
                                    style={{ 
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)' 
                                    }}
                                >
                                    {!isExpired && qrCodeUrl ? (
                                        <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-inner mb-3">
                                            <img src={qrCodeUrl} alt="KőszegPass QR" className="w-28 h-28 object-contain" />
                                        </div>
                                    ) : (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 mb-3 font-bold text-[10px]">
                                            ⚠️ A kártya érvényessége lejárt, a QR-kód letiltva.
                                        </div>
                                    )}
                                    <span className="text-[8px] text-zinc-400 font-mono uppercase tracking-wider mb-0.5">Azonosító</span>
                                    <span className="font-mono text-[9px] font-bold text-zinc-600 break-all px-4">{pass.id}</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Card Flip Hint */}
                    <div className="flex justify-center items-center gap-2 mb-6 pointer-events-none">
                        <IoSwapHorizontal className="text-[#C8AF64] text-xs animate-pulse" />
                        <span className="text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest">
                            Koppints a kártyára a QR-kódhoz!
                        </span>
                    </div>

                    {/* Info list */}
                    <div className="space-y-3 text-xs text-left mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <IoShieldCheckmark className="text-[#C8AF64] text-base" />
                            <span>Státusz: <strong className={isExpired ? 'text-red-400' : 'text-green-400'}>{isExpired ? 'Lejárt' : 'Aktív'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IoCalendar className="text-[#C8AF64] text-base" />
                            <span>Lejárat dátuma: <strong className="text-white">{formatHu(pass.expires_at)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IoInformationCircleOutline className="text-[#C8AF64] text-base" />
                            <span>Típus: <strong className="text-white">{pass.pass_type === 'family' ? 'Családi kártya' : 'Egyéni kártya'}</strong></span>
                        </div>
                    </div>

                    {/* Wallet Buttons */}
                    {!isExpired && (
                        <div className="space-y-3">
                            <button
                                onClick={handleAppleWallet}
                                className="w-full bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                            >
                                🍎 Hozzáadás Apple Wallet-hez
                            </button>
                            
                            <button
                                onClick={handleGoogleWallet}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                            >
                                🔵 Hozzáadás Google Wallet-hez
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}