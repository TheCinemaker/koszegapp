import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { IoCheckmarkCircle, IoCloseCircle, IoCamera, IoCard, IoArrowBack } from 'react-icons/io5';
import { Html5Qrcode } from 'html5-qrcode';
import { Link } from 'react-router-dom';

// Pre-defined partner list for scanner tracking
const PARTNERS = [
    { id: 'tourinform', name: 'Tourinform Iroda' },
    { id: 'jurisics-castle', name: 'Jurisics Vár és Múzeum' },
    { id: 'rajnis-etterem', name: 'Rajnis Étterem' },
    { id: 'kisbolt-sark', name: 'Sarki Vegyesbolt' },
    { id: 'arany-strucc', name: 'Arany Strucc Hotel' }
];

export default function PassScanner() {
    const [selectedPartner, setSelectedPartner] = useState(PARTNERS[0].id);
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [validating, setValidating] = useState(false);
    const [manualToken, setManualToken] = useState('');
    const scannerRef = useRef(null);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async () => {
        setScanning(true);
        setLastResult(null);

        // Allow some time for container to mount
        setTimeout(async () => {
            try {
                const html5Qrcode = new Html5Qrcode('scanner-container');
                scannerRef.current = html5Qrcode;

                await html5Qrcode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    onScanSuccess,
                    onScanError
                );
            } catch (err) {
                console.error('Failed to start camera:', err);
                toast.error('Nem sikerült hozzáférni a kamerához');
                setScanning(false);
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setScanning(false);
            } catch (err) {
                console.error('Failed to stop camera:', err);
            }
        }
    };

    const onScanSuccess = async (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        await stopScanner();
        await validatePass(decodedText);
    };

    const onScanError = (error) => {
        // Quiet debug
    };

    const validatePass = async (token) => {
        if (!token.trim()) return;
        setValidating(true);
        const loadToast = toast.loading('Kártya validálása...');

        try {
            // Call Netlify function with both token and partner ID to log scan
            const response = await fetch('/.netlify/functions/koszeg-pass-validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, partnerId: selectedPartner })
            });

            const data = await response.json();
            setLastResult(data);

            if (data.valid) {
                toast.success(`Érvényes Pass: ${data.holder_name}`, { duration: 5000 });
                // Play success sound if supported by browser policy
                new Audio('/sounds/success.mp3').play().catch(() => { });
            } else {
                toast.error(`Sikertelen ellenőrzés: ${data.message}`, { duration: 5000 });
                new Audio('/sounds/error.mp3').play().catch(() => { });
            }

        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Hiba történt a kártya ellenőrzésekor');
        } finally {
            toast.dismiss(loadToast);
            setValidating(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        validatePass(manualToken);
    };

    return (
        <div className="min-h-screen bg-[#0C234B] text-white p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full mx-auto z-10 py-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link to="/pass" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-10 h-10">
                        <IoArrowBack size={20} />
                    </Link>
                    <h1 className="text-lg font-black text-[#C8AF64] uppercase tracking-wider">Elfogadóhelyi Scanner</h1>
                    <div className="w-10 h-10" />
                </div>

                {/* Partner Selector */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                    <label className="text-[10px] font-black uppercase text-blue-200/50 tracking-wider block mb-2">Aktív Elfogadóhely</label>
                    <select
                        value={selectedPartner}
                        onChange={e => setSelectedPartner(e.target.value)}
                        className="w-full h-12 bg-black/30 border border-white/10 rounded-xl px-3 outline-none text-sm text-white focus:border-[#C8AF64]/40"
                    >
                        {PARTNERS.map(p => (
                            <option className="bg-[#0C234B]" key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Scan Area */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center shadow-xl mb-6 min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
                    {scanning ? (
                        <div className="w-full aspect-square max-w-[280px] bg-black/40 rounded-2xl overflow-hidden relative border border-white/20">
                            <div id="scanner-container" className="w-full h-full" />
                            {/* Scanning line animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-red-500 top-1/2 animate-bounce" />
                            <button
                                onClick={stopScanner}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs backdrop-blur-md"
                            >
                                Mégse
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-4xl text-blue-400 mx-auto">
                                <IoCamera />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">QR-kód Beolvasás</h3>
                                <p className="text-[10px] text-blue-200/50 mt-1 max-w-[200px] mx-auto">
                                    Olvasd be a vendég KőszegPass kártyáját a statisztika rögzítéséhez.
                                </p>
                            </div>
                            <button
                                onClick={startScanner}
                                className="bg-[#C8AF64] hover:scale-[1.02] active:scale-95 text-[#0C234B] font-black py-3.5 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 mx-auto"
                            >
                                <IoCamera size={16} />
                                Kamera indítása
                            </button>
                        </div>
                    )}
                </div>

                {/* Scan Results */}
                {lastResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-2xl p-5 mb-6 ${
                            lastResult.valid 
                                ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                    >
                        <div className="flex gap-4 items-start">
                            <div className="text-3xl shrink-0">
                                {lastResult.valid ? <IoCheckmarkCircle className="text-green-400" /> : <IoCloseCircle className="text-red-400" />}
                            </div>
                            <div className="space-y-1 text-xs">
                                <h4 className="font-black text-sm uppercase tracking-wide">
                                    {lastResult.valid ? 'ÉRVÉNYES PASS ✅' : 'ÉRVÉNYTELEN ❌'}
                                </h4>
                                {lastResult.valid ? (
                                    <>
                                        <p><span className="opacity-60">Kártyatulajdonos:</span> <strong className="text-white">{lastResult.holder_name}</strong></p>
                                        <p><span className="opacity-60">Kártyatípus:</span> <strong className="text-white">{lastResult.pass_type_label}</strong></p>
                                        <p><span className="opacity-60">Hátralévő napok:</span> <strong className="text-white">{lastResult.days_remaining} nap</strong></p>
                                    </>
                                ) : (
                                    <p className="text-red-200">{lastResult.message}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Manual Token input fallback */}
                <form onSubmit={handleManualSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <label className="text-[10px] font-black uppercase text-blue-200/50 tracking-wider block mb-2">Manuális Azonosító Beírás</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualToken}
                            onChange={e => setManualToken(e.target.value)}
                            className="flex-1 h-11 bg-black/20 border border-white/10 rounded-xl px-3 outline-none text-xs text-white focus:border-[#C8AF64]/40"
                            placeholder="Írd be a pass azonosítóját..."
                        />
                        <button
                            type="submit"
                            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                            <IoCard size={14} />
                            Ellenőrzés
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
