import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoScanOutline, IoCheckmarkCircle, IoCloseCircle, IoFlashOutline, IoFlashOffOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ScannerPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [scanResult, setScanResult] = useState(null); // 'valid' | 'invalid' | null
    const [isScanning, setIsScanning] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);

    // Mock Validation Logic
    const validateToken = (token) => {
        setIsScanning(false);
        setData(token);

        // Simple mock check: Must start with "KP-"
        if (token && token.startsWith('KP-')) {
            setScanResult('valid');
            toast.success("Érvényes KőszegPass!");
            // Play success sound logic here later
        } else {
            setScanResult('invalid');
            toast.error("Érvénytelen kód!");
            // Play error sound logic here later
        }
    };

    const handleScan = (result, error) => {
        if (!!result && isScanning) {
            // Found a code
            validateToken(result?.text);
        }
        if (!!error) {
            // console.info(error);
        }
    };

    const resetScanner = () => {
        setData(null);
        setScanResult(null);
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
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-black">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-2xl ${scanResult === 'valid' ? 'bg-green-500 text-green-100' : 'bg-red-500 text-red-100'
                                }`}
                        >
                            {scanResult === 'valid' ? <IoCheckmarkCircle size={64} /> : <IoCloseCircle size={64} />}
                        </motion.div>

                        <h2 className="text-2xl font-bold mb-2">
                            {scanResult === 'valid' ? 'Sikeres Beolvasás!' : 'Érvénytelen Kód'}
                        </h2>

                        <div className="bg-white/10 rounded-xl p-4 w-full max-w-xs mb-8 mx-auto text-center border border-white/10 backdrop-blur-sm">
                            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Beolvasott Token</p>
                            <p className="font-mono text-lg font-bold break-all text-indigo-400">{data}</p>
                        </div>

                        <button
                            onClick={resetScanner}
                            className="px-8 py-3 bg-white text-black rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <IoScanOutline />
                            Új beolvasás
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
