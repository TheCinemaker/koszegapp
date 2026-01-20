import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrReader } from 'react-qr-reader';

export default function ScanLive() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    // 10 másodperces időzítő a kamera kikapcsolására
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!data && !isClosing) {
                navigate(-1);
            }
        }, 10000); // 10 mp

        return () => clearTimeout(timer);
    }, [navigate, data, isClosing]);

    const handleScan = (result, error) => {
        if (!!result) {
            const scannedData = result?.text;

            // Prevent multiple triggers
            if (scannedData && !isClosing && scannedData !== data) {
                setData(scannedData);

                // 1. VISSZAJELZÉS (Haptic)
                if (navigator.vibrate) navigator.vibrate(50);

                // 2. LEZÁRÁS INDUL
                setIsClosing(true);

                // 3. ÁTLÉPÉS (300ms Apple-idő)
                setTimeout(() => {
                    let gemId = scannedData;
                    if (scannedData.includes('/')) {
                        const parts = scannedData.split('/');
                        gemId = parts[parts.length - 1];
                    }
                    navigate(`/game/gem/${gemId}`);
                }, 300);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0b0c] flex flex-col items-center justify-center relative overflow-hidden">

            {/* HÁTTÉR ANIMÁCIÓK */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-amber-900/10 rounded-full blur-3xl opacity-30 animate-pulse" />
            </div>

            {/* HEADER TEXT */}
            <div className="relative z-20 mb-8 text-center space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/40">
                    Időkapu Keresése...
                </p>
                <h2 className="text-xl font-serif text-white/90">
                    Szkenneld a Horgonyt
                </h2>
            </div>

            {/* KAMERA KERET (NEM FULLSCREEN) */}
            <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 border-2 border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.2)]">

                {/* KAMERA FEED */}
                <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: 'environment' }}
                    scanDelay={500}
                    className="w-full h-full object-cover"
                    videoContainerStyle={{
                        paddingTop: 0,
                        height: '100%',
                        width: '100%'
                    }}
                    videoStyle={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover'
                    }}
                />

                {/* ANIMÁLT SZKENNER CSÍK */}
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20"
                />

                {/* SAROK DÍSZEK */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-500 z-20" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500 z-20" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-500 z-20" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500 z-20" />

            </div>

            {/* EXIT GOMB */}
            <button
                onClick={() => navigate(-1)}
                className="relative z-20 mt-12 text-white/50 text-xs font-sans tracking-widest hover:text-white transition-colors uppercase border border-white/10 px-6 py-3 rounded-full hover:bg-white/5"
            >
                Mégsem
            </button>

            {/* LEZÁRÓ OVERLAY (ÁTMENET) */}
            {isClosing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                >
                    <p className="text-amber-500 font-serif text-xl tracking-widest">
                        KAPCSOLÓDÁS...
                    </p>
                </motion.div>
            )}
        </div>
    );
}
