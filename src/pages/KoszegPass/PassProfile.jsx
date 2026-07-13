import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
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
import PassCard from './PassCard';
import AddToHomeHint from './AddToHomeHint';

export default function PassProfile() {
    const [searchParams] = useSearchParams();
    // A hozzáféréshez a token KÖTELEZŐ (nem kitalálható) – a slug önmagában nem elég.
    const qrToken = searchParams.get('token') || '';

    const [loading, setLoading] = useState(true);
    const [pass, setPass] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        async function fetchPass() {
            if (!qrToken) {
                setLoading(false);
                return;
            }

            try {
                // Csak a nem érzékeny mezőket adja vissza (security definer RPC).
                const { data, error } = await supabase
                    .rpc('get_koszeg_pass_by_token', { p_token: qrToken });

                if (error) throw error;

                const row = Array.isArray(data) ? data[0] : data;
                if (!row) {
                    setLoading(false);
                    return;
                }

                setPass(row);

                // A QR-t magából a tokenből generáljuk (nem kérjük le az adatbázisból).
                const qrUrl = await QRCode.toDataURL(qrToken, {
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
    }, [qrToken]);

    // A kezdőképernyőre kitett ikon szép nevéhez (iOS a dokumentum címét használja)
    useEffect(() => {
        if (!pass) return;
        const prev = document.title;
        document.title = 'KőszegPass';
        return () => { document.title = prev; };
    }, [pass]);

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
                <div className="max-w-sm">
                    <h1 className="text-2xl font-black text-red-400 mb-4">Érvénytelen Kártya ⚠️</h1>
                    <p className="text-blue-200/60 mb-6 text-sm">
                        A link hiányos vagy érvénytelen. Ha elvesztetted a kártyád linkjét, e-mailben újra elküldjük.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/pass/megkeresem" className="inline-block bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] px-6 py-3 rounded-xl font-bold transition-all text-sm">
                            Kártyám megkeresése
                        </Link>
                        <Link to="/pass" className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm">
                            Vissza a kezdőlapra
                        </Link>
                    </div>
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

                    {/* Kártya */}
                    <div className="mb-8">
                        <PassCard
                            holderName={pass.holder_name}
                            passType={pass.pass_type}
                            serial={pass.serial}
                            expiresAt={pass.expires_at}
                            qrCodeUrl={qrCodeUrl}
                            isExpired={isExpired}
                            isFlipped={isFlipped}
                            onToggle={() => setIsFlipped(!isFlipped)}
                        />
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

                    {/* Kezdőképernyőre tipp (Wallet-alternatíva) */}
                    {!isExpired && <AddToHomeHint />}

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