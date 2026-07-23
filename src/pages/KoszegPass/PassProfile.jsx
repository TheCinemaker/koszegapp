import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
    IoShieldCheckmark,
    IoCalendar,
    IoArrowBack,
    IoInformationCircleOutline,
    IoSwapHorizontal,
    IoSparkles,
    IoLogOutOutline
} from 'react-icons/io5';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import PassCard from './PassCard';
import AddToHomeHint from './AddToHomeHint';

export default function PassProfile() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // A hozzáféréshez a token KÖTELEZŐ (nem kitalálható) – a slug önmagában nem elég.
    const [qrToken, setQrToken] = useState(() => {
        const urlToken = searchParams.get('token') || '';
        if (urlToken) {
            localStorage.setItem('koszegpass_token', urlToken);
            return urlToken;
        }
        return localStorage.getItem('koszegpass_token') || '';
    });

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

    const handleLogout = () => {
        if (window.confirm('Biztosan el akarod távolítani ezt a kártyát erről a telefonról?')) {
            localStorage.removeItem('koszegpass_token');
            toast.success('Kártya sikeresen eltávolítva.');
            navigate('/pass');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand dark:border-white mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Kártya lekérése...</p>
                </div>
            </div>
        );
    }

    if (!pass) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white p-4 text-center transition-colors duration-300">
                <div className="max-w-sm">
                    <h1 className="text-2xl font-black text-rose-500 mb-4">Érvénytelen Kártya ⚠️</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm font-medium">
                        A link hiányos vagy érvénytelen. Ha elvesztetted a kártyád linkjét, e-mailben újra elküldjük.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/pass/megkeresem" className="inline-block bg-brand dark:bg-indigo-500 hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-md">
                            Kártyám megkeresése
                        </Link>
                        <Link to="/pass" className="inline-block bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm">
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
        <div className="min-h-screen text-gray-900 dark:text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10 my-6">
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-[30px] rounded-3xl border border-white/60 dark:border-white/10 p-6 sm:p-8 text-center shadow-lg">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <Link 
                            to="/pass" 
                            className="p-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm"
                        >
                            <IoArrowBack size={20} className="text-gray-600 dark:text-gray-300" />
                        </Link>
                        <h2 className="text-brand dark:text-brand-light font-black text-sm uppercase tracking-widest flex items-center gap-1.5 justify-center">
                            <IoSparkles className="text-amber-400" /> Személyes Pass
                        </h2>
                        <button 
                            onClick={handleLogout}
                            className="p-2 bg-white/50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm group"
                            title="Kártya eltávolítása"
                        >
                            <IoLogOutOutline size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-rose-500 transition-colors" />
                        </button>
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
                        <IoSwapHorizontal className="text-brand dark:text-brand-light text-xs animate-pulse" />
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Koppints a kártyára a QR-kódhoz!
                        </span>
                    </div>

                    {/* Info list */}
                    <div className="space-y-3 text-xs text-left mb-6 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-sm">
                        <div className="flex items-center gap-2">
                            <IoShieldCheckmark className="text-brand dark:text-brand-light text-base" />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Státusz: <strong className={isExpired ? 'text-rose-500' : 'text-emerald-500'}>{isExpired ? 'Lejárt' : 'Aktív'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IoCalendar className="text-brand dark:text-brand-light text-base" />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Lejárat dátuma: <strong className="text-gray-900 dark:text-white">{formatHu(pass.expires_at)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IoInformationCircleOutline className="text-brand dark:text-brand-light text-base" />
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Típus: <strong className="text-gray-900 dark:text-white">{pass.pass_type === 'family' ? 'Családi kártya' : 'Egyéni kártya'}</strong></span>
                        </div>
                    </div>

                    {/* Kezdőképernyőre tipp (Wallet-alternatíva) */}
                    {!isExpired && <AddToHomeHint />}

                    {/* Wallet Buttons */}
                    {!isExpired && (
                        <div className="flex gap-4 justify-center items-center">
                            <button
                                onClick={handleAppleWallet}
                                className="h-12 flex-1 flex items-center justify-center rounded-xl bg-black border border-zinc-800 hover:bg-zinc-900 hover:scale-[1.02] active:scale-95 transition-all outline-none px-4"
                                title="Add to Apple Wallet"
                            >
                                <img
                                    src="/addToAppleWallet.svg"
                                    alt="Add to Apple Wallet"
                                    className="h-8 w-auto object-contain"
                                />
                            </button>
                            
                            <button
                                onClick={handleGoogleWallet}
                                className="h-12 flex-1 flex items-center justify-center rounded-xl bg-black border border-zinc-800 hover:bg-zinc-900 hover:scale-[1.02] active:scale-95 transition-all outline-none px-4"
                                title="Add to Google Wallet"
                            >
                                <img
                                    src="/images/google_badges/hu_add_to_google_wallet_add-wallet-badge.svg"
                                    alt="Add to Google Wallet"
                                    className="h-8 w-auto object-contain"
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}