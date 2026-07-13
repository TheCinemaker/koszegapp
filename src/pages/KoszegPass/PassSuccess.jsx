import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { IoCheckmarkCircle, IoMail, IoDownload, IoHome, IoQrCodeOutline } from 'react-icons/io5';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function PassSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [pass, setPass] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        async function fetchPassData() {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch pass based on Stripe session ID
                const { data, error } = await supabase
                    .from('koszeg_passes')
                    .select('*')
                    .eq('stripe_session_id', sessionId)
                    .single();

                if (error) throw error;
                
                setPass(data);

                // Generate local QR code for display
                const qrVal = data.qr_token;
                const qrUrl = await QRCode.toDataURL(qrVal, {
                    width: 200,
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0C234B] flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8AF64] mx-auto mb-4"></div>
                    <p className="text-blue-200/60 text-sm">Pass adatok lekérése...</p>
                </div>
            </div>
        );
    }

    if (!pass) {
        return (
            <div className="min-h-screen bg-[#0C234B] flex items-center justify-center text-white p-4 text-center">
                <div>
                    <h1 className="text-2xl font-black text-red-400 mb-4">Hiba történt ⚠️</h1>
                    <p className="text-blue-200/60 mb-6 text-sm">Nem található KőszegPass ehhez a fizetési tranzakcióhoz.</p>
                    <Link to="/pass" className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all text-sm">
                        Vissza a főoldalra
                    </Link>
                </div>
            </div>
        );
    }

    const formatHu = (dateStr) =>
        new Date(dateStr).toLocaleDateString('hu-HU', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });

    return (
        <div className="min-h-screen bg-[#0C234B] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full z-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 text-center shadow-2xl">
                    
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IoCheckmarkCircle className="text-5xl text-green-400" />
                    </div>

                    <h1 className="text-2xl font-black bg-gradient-to-r from-white via-[#C8AF64] to-white bg-clip-text text-transparent mb-2">
                        Sikeres Vásárlás! 🎉
                    </h1>
                    <p className="text-blue-200/60 text-xs mb-8">
                        KőszegPass kártyád elkészült és aktív.
                    </p>

                    {/* Pass Card Display */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg p-5 text-left aspect-[1.58] mb-6 flex flex-col justify-between bg-zinc-950">
                        <img 
                            src="/images/koszegpass_mascot.jpg" 
                            alt="Mascot" 
                            className="absolute inset-0 w-full h-full object-cover opacity-30" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C234B] via-black/30 to-transparent" />
                        
                        <div className="z-10 flex justify-between items-start">
                            <div>
                                <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">KŐSZEGPASS</p>
                                <h3 className="text-base font-bold tracking-tight text-white leading-tight mt-0.5">{pass.holder_name}</h3>
                            </div>
                            <span className="text-[9px] bg-[#C8AF64] text-[#0C234B] font-black px-2 py-0.5 rounded-full uppercase">
                                {pass.pass_type === 'family' ? 'Családi' : 'Egyéni'}
                            </span>
                        </div>

                        <div className="z-10 flex justify-between items-end">
                            <div>
                                <p className="text-[7px] text-blue-200/40 uppercase tracking-wider">Érvényesség</p>
                                <p className="text-[10px] font-mono text-[#C8AF64] font-bold">{formatHu(pass.expires_at)}</p>
                            </div>
                            <div className="bg-white p-1 rounded-lg">
                                <IoQrCodeOutline className="text-2xl text-[#0C234B]" />
                            </div>
                        </div>
                    </div>

                    {/* QR Code Scan Display */}
                    {qrCodeUrl && (
                        <div className="bg-white rounded-2xl p-4 w-48 h-48 mx-auto mb-8 shadow-xl flex items-center justify-center border border-white/10">
                            <img src={qrCodeUrl} alt="KőszegPass QR" className="w-full h-full" />
                        </div>
                    )}

                    {/* Wallet Buttons */}
                    <div className="space-y-3 mb-6">
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

                    {/* Email note */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex gap-3 text-left mb-8">
                        <div className="text-xl shrink-0 text-[#C8AF64]">
                            <IoMail />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white mb-0.5">Küldtünk egy emailt</p>
                            <p className="text-[10px] text-blue-100/50 leading-relaxed">
                                A kártyádat tartalmazó levelet, a Wallet linkeket és a számládat megküldtük a megadott email címre (<strong className="text-white">{pass.holder_email}</strong>).
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Link
                            to="/pass"
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
                        >
                            <IoHome size={16} />
                            Főoldalra
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
