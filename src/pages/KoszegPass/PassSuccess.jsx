import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { IoCheckmarkCircle, IoMail, IoHome, IoSwapHorizontal, IoLinkOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import PassCard from './PassCard';

export default function PassSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const isKiosk = localStorage.getItem('kiosk_mode') === 'true' || searchParams.get('kiosk') === 'true';

    const [loading, setLoading] = useState(true);
    const [pass, setPass] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);

    const handleKioskFinish = () => {
        localStorage.removeItem('koszegpass_token');
        navigate('/buy-pass');
    };

    useEffect(() => {
        async function fetchPassData() {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // A confirm function a hiteles forrás: a Stripe-tól ellenőrzi, hogy
                // tényleg fizettek-e, és ha a webhook nem futott le (pl. dev branch
                // deploy), akkor ő hozza létre a passt + küldi az emailt. Idempotens.
                const res = await fetch(
                    `/.netlify/functions/koszeg-pass-confirm?session_id=${encodeURIComponent(sessionId)}`
                );
                const payload = await res.json();

                if (!res.ok) {
                    throw new Error(payload.error || `Confirm failed (${res.status})`);
                }

                const row = payload.pass;
                if (!row) {
                    setLoading(false);
                    return;
                }

                setPass(row);

                if (!isKiosk) {
                    localStorage.setItem('koszegpass_token', row.qr_token);
                }

                // Generate local QR code for display pointing to the direct pass link URL
                const targetUrl = `${window.location.origin}/pass/profile?token=${row.qr_token}`;
                const qrUrl = await QRCode.toDataURL(targetUrl, {
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

        fetchPassData();
    }, [sessionId]);

    const handleGoogleWallet = () => {
        if (!pass) return;
        window.location.href = `/.netlify/functions/koszeg-pass-google?passId=${pass.id}`;
    };

    const handleAppleWallet = () => {
        if (!pass) return;
        window.location.href = `/.netlify/functions/koszeg-pass-apple?passId=${pass.id}`;
    };

    // A kártya állandó, személyes linkje (token-alapú – bármikor megnyitható)
    const passLink = pass
        ? `${window.location.origin}/p/${pass.slug}?token=${pass.qr_token}`
        : '';

    const handleCopyLink = async () => {
        if (!passLink) return;
        try {
            await navigator.clipboard.writeText(passLink);
            toast.success('Link kimásolva! Mentsd el egy biztos helyre.');
        } catch {
            toast.error('Nem sikerült a másolás – jelöld ki és másold kézzel.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand dark:border-white mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Pass adatok lekérése...</p>
                </div>
            </div>
        );
    }

    if (!pass) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white p-4 text-center transition-colors duration-300">
                <div>
                    <h1 className="text-2xl font-black text-rose-500 mb-4">Hiba történt ⚠️</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Nem található KőszegPass ehhez a fizetési tranzakcióhoz.</p>
                    <Link to="/pass" className="inline-block bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm">
                        Vissza a főoldalra
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10">
                <div className="bg-white/70 dark:bg-white/5 backdrop-blur-[30px] rounded-3xl border border-white/60 dark:border-white/10 p-6 sm:p-8 text-center shadow-lg">
                    
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <IoCheckmarkCircle className="text-5xl text-emerald-400" />
                    </div>

                    <h1 className="text-2xl font-black text-brand dark:text-white mb-2">
                        {isKiosk ? 'Köszönjük a vásárlást! 🎉' : 'Sikeres Vásárlás! 🎉'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-8">
                        {isKiosk ? 'A KőszegPass kártya elkészült és aktív.' : 'KőszegPass kártyád elkészült és aktív.'}
                    </p>

                    {/* Kártya vagy Kiosk QR Kód */}
                    {isKiosk ? (
                        <div className="flex flex-col items-center mb-6">
                            <div className="bg-white p-5 rounded-3xl inline-block mx-auto mb-4 border border-gray-200 shadow-sm">
                                <img src={qrCodeUrl} alt="KőszegPass QR kód" className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto" />
                                <p className="text-brand text-[10px] font-black uppercase tracking-wider mt-3">
                                    Szkennelje be telefonjával!
                                </p>
                            </div>
                            <div className="bg-brand/10 border border-brand/20 dark:bg-indigo-500/10 dark:border-indigo-500/20 rounded-2xl p-4 mb-6 text-center text-xs text-brand dark:text-indigo-400 font-semibold leading-relaxed max-w-sm">
                                📱 Szkennelje be ezt a QR-kódot a telefonja kamerájával a kártya letöltéséhez és telefonra mentéséhez!
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Kártya */}
                            <div className="mb-2">
                                <PassCard
                                    holderName={pass.holder_name}
                                    passType={pass.pass_type}
                                    serial={pass.serial}
                                    expiresAt={pass.expires_at}
                                    qrCodeUrl={qrCodeUrl}
                                    isExpired={false}
                                    isFlipped={isFlipped}
                                    onToggle={() => setIsFlipped(!isFlipped)}
                                />
                            </div>

                            {/* Flip hint */}
                            <div className="flex justify-center items-center gap-2 mb-8 pointer-events-none">
                                <IoSwapHorizontal className="text-brand dark:text-brand-light text-xs animate-pulse" />
                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                    Koppints a kártyára a QR-kódhoz!
                                </span>
                            </div>
                        </>
                    )}

                    {/* Csak ha nem kiosk mód (személyes vásárlás) */}
                    {!isKiosk && (
                        <>
                            {/* Wallet Buttons */}
                            <div className="flex gap-4 justify-center items-center mb-6">
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

                            {/* Állandó, személyes link */}
                            <div className="bg-[#C8AF64]/10 border border-[#C8AF64]/25 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                                    <IoLinkOutline className="text-[#C8AF64]" /> A személyes linked
                                </p>
                                <p className="text-[10px] text-blue-100/60 leading-relaxed mb-3">
                                    Ezzel bármikor megnyithatod a kártyád – Wallet nélkül is. Mentsd el, vagy tedd ki a telefonod kezdőképernyőjére!
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={passLink}
                                        onFocus={(e) => e.target.select()}
                                        className="flex-1 min-w-0 bg-black/25 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-blue-100/70 font-mono truncate focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="shrink-0 bg-[#C8AF64] hover:bg-[#d8bf74] text-[#0C234B] font-black px-4 rounded-lg text-xs transition-colors"
                                    >
                                        Másolás
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email note */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex gap-3 text-left mb-8">
                        <div className="text-xl shrink-0 text-[#C8AF64]">
                            <IoMail />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white mb-0.5">
                                {isKiosk ? 'Küldtünk egy e-mailt a vendégnek' : 'Küldtünk egy emailt'}
                            </p>
                            <p className="text-[10px] text-blue-100/50 leading-relaxed">
                                {isKiosk 
                                    ? 'A kártyát tartalmazó levelet, a Wallet linkeket, a személyes megnyitó linket és a számlát is kiküldtük a megadott e-mail címre.'
                                    : 'A kártyádat tartalmazó levelet, a Wallet linkeket, ezt a személyes linket és a számládat is elküldtük a vásárláskor megadott email címre.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {isKiosk ? (
                            <button
                                onClick={handleKioskFinish}
                                className="flex-1 bg-gradient-to-r from-[#C8AF64] to-[#e4cc7d] hover:scale-[1.01] active:scale-95 text-[#0C234B] font-black h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-lg"
                            >
                                Kész / Új Vásárlás Indítása
                            </button>
                        ) : (
                            <Link
                                to="/pass"
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
                            >
                                <IoHome size={16} />
                                Főoldalra
                            </Link>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
