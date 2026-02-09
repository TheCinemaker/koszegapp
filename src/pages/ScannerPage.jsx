import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoScanOutline, IoCheckmarkCircle, IoCloseCircle, IoFlashOutline, IoFlashOffOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ScannerPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [scanResult, setScanResult] = useState(null); // 'valid' | 'invalid' | null | 'error'
    const [isScanning, setIsScanning] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannedUser, setScannedUser] = useState(null);
    const [serverMessage, setServerMessage] = useState(null);

    // API Validation Logic
    const validateToken = async (token) => {
        setIsScanning(false);
        setLoading(true);
        setData(token);

        try {
            const response = await fetch('/.netlify/functions/verify-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const result = await response.json();

            if (result.valid) {
                setScanResult('valid');
                setScannedUser(result.user);
                toast.success(`Sikeres! ${result.user.name}`);
                // Play success sound
            } else {
                setScanResult('invalid');
                // Check if message is in result.message OR result.error
                const msg = result.message || result.error || "Érvénytelen kód!";
                setServerMessage(msg);
                toast.error(msg);
                // Play error sound
            }

        } catch (error) {
            console.error("Scan error:", error);
            setScanResult('error');
            toast.error("Hálózati hiba!");
        } finally {
            setLoading(false);
        }
    };

    // Toggle Mode
    const [mode, setMode] = useState('add'); // 'add' | 'deduct'

    // Add Points Logic (Amount Based)
    const handleTransaction = async (amount) => {
        if (!data || !amount) return;
        setLoading(true);

        const endpoint = mode === 'add' ? '/.netlify/functions/add-points' : '/.netlify/functions/deduct-points';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-scanner-key': 'YOUR_SECRET_KEY' // In prod, this comes from secure storage/auth
                },
                body: JSON.stringify({
                    token: data,
                    amount: parseInt(amount), // Send Amount
                    source: 'Scanner App Prototype'
                }),
            });

            const result = await response.json();

            if (result.success) {
                const msg = mode === 'add'
                    ? `Sikeres jóváírás: +${result.addedPoints} pont! (${amount} Ft)`
                    : `Sikeres beváltás: -${result.deductedPoints} pont!`;

                toast.success(msg, { duration: 4000 });
                // Vibrate pattern
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                // Update local state
                setScannedUser(prev => ({ ...prev, points: result.newPoints }));

                // Auto reset
                setTimeout(resetScanner, 3500);
            } else {
                toast.error(result.message || "Hiba a tranzakció során");
            }
        } catch (error) {
            console.error("Transaction error:", error);
            toast.error("Hálózati hiba!");
            setLoading(false);
        }
    };

    const handleScan = (result, error) => {
        if (!!result && isScanning) {
            validateToken(result?.text);
        }
        if (!!error) {
            // console.info(error);
        }
    };

    const resetScanner = () => {
        setData(null);
        setScanResult(null);
        setScannedUser(null);
        setServerMessage(null);
        setIsScanning(true);
    };

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                    <IoArrowBack className="text-xl" />
                </button>
                <h1 className="text-lg font-bold tracking-wider uppercase">KőszegPass Scanner</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Camera Viewfinder */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
                {isScanning ? (
                    <div className="w-full h-full relative">
                        <QrReader
                            onResult={handleScan}
                            constraints={{ facingMode: 'environment' }}
                            containerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
                            videoStyle={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            scanDelay={500}
                        />
                        {/* Overlay Guide */}
                        <div className="absolute inset-0 border-[40px] border-black/50 mask-rect flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1" />

                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500/50 animate-pulse" />
                            </div>
                        </div>
                        <p className="absolute bottom-10 left-0 right-0 text-center text-white/70 text-sm font-medium">
                            Irányítsd a kamerát a QR kódra
                        </p>
                    </div>
                ) : (
                    /* Result View */
                    <div className={`w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br ${mode === 'add' ? 'from-gray-900 to-black' : 'from-red-900/40 to-black'}`}>

                        {loading ? (
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                                <p className="text-white/70">Feldolgozás...</p>
                            </div>
                        ) : (
                            <>
                                {/* Mode Toggle */}
                                {scanResult === 'valid' && (
                                    <div className="flex bg-white/10 p-1 rounded-full mb-6 border border-white/10">
                                        <button
                                            onClick={() => setMode('add')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'add' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                        >
                                            Jóváírás
                                        </button>
                                        <button
                                            onClick={() => setMode('deduct')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'deduct' ? 'bg-red-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                        >
                                            Beváltás
                                        </button>
                                    </div>
                                )}

                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-2xl ${scanResult === 'valid' ? (mode === 'add' ? 'bg-green-500 text-green-100' : 'bg-amber-500 text-amber-100') : 'bg-red-500 text-red-100'
                                        }`}
                                >
                                    {scanResult === 'valid' ? <IoCheckmarkCircle size={64} /> : <IoCloseCircle size={64} />}
                                </motion.div>

                                <h2 className="text-2xl font-bold mb-2">
                                    {scanResult === 'valid' ? 'Érvényes KőszegPass' : 'Érvénytelen!'}
                                </h2>

                                {scanResult === 'valid' && scannedUser && (
                                    <div className="bg-white/10 rounded-2xl p-6 w-full max-w-sm mb-8 mx-auto text-center border border-white/10 backdrop-blur-md shadow-xl">
                                        <h3 className="text-xl font-bold text-white mb-1">{scannedUser.name}</h3>
                                        <p className="text-white/60 text-sm uppercase tracking-wider mb-4">{scannedUser.cardType} Kártya</p>

                                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/30">
                                            <IoFlashOutline className="text-yellow-400" />
                                            <span className="font-bold text-white text-lg">{scannedUser.points} Pont</span>
                                        </div>
                                    </div>
                                )}

                                {/* Amount Input Form */}
                                {scanResult === 'valid' && (
                                    <div className="w-full max-w-sm mb-6">
                                        <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-bold text-left ml-1">
                                            {mode === 'add' ? 'Vásárlás összege (Ft)' : 'Pontok száma'}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder={mode === 'add' ? "pl. 3900" : "pl. 500"}
                                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                id="amountInput"
                                            />
                                            <button
                                                onClick={() => {
                                                    const val = document.getElementById('amountInput').value;
                                                    if (val) handleTransaction(val);
                                                    else toast.error("Add meg az összeget!");
                                                }}
                                                disabled={loading}
                                                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform disabled:opacity-50 ${mode === 'add' ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gradient-to-br from-red-600 to-orange-700'}`}
                                            >
                                                {mode === 'add' ? 'Jóváírás' : 'Levonás'}
                                            </button>
                                        </div>
                                        {mode === 'add' && <p className="text-white/40 text-[10px] mt-2 text-left ml-1">
                                            Minden 1000 Ft után 1 pont jár. (pl. 3900 Ft = 3 pont)
                                        </p>}
                                    </div>
                                )}

                                {scanResult !== 'valid' && (
                                    <div className="bg-red-500/10 rounded-xl p-4 w-full max-w-xs mb-8 mx-auto text-center border border-red-500/30">
                                        <p className="text-red-300 font-medium">{serverMessage || "A kártya nem található vagy inaktív."}</p>
                                    </div>
                                )}

                                <button
                                    onClick={resetScanner}
                                    className="px-8 py-3 bg-white text-black rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                                >
                                    <IoScanOutline />
                                    Új beolvasás
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
