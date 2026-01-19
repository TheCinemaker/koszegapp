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
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">

            {/* KAMERA FEED */}
            <div className="absolute inset-0 w-full h-full">
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
            </div>

            {/* FINOM KERET (REAGÁL A LEZÁRÁSRA) */}
            <motion.div
                initial={{ opacity: 0.3 }}
                animate={isClosing
                    ? { scale: 0.95, opacity: 0 }
                    : { opacity: [0.3, 0.6, 0.3] }
                }
                transition={{
                    duration: isClosing ? 0.25 : 3,
                    ease: isClosing ? 'easeInOut' : 'easeInOut',
                    repeat: isClosing ? 0 : Infinity
                }}
                className="
          absolute
          inset-12
          md:inset-32
          border
          border-white/40
          rounded-2xl
          pointer-events-none
          z-10
        "
            />

            {/* EXIT GOMB */}
            <div className="absolute top-6 left-6 z-30">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white/50 text-sm font-sans tracking-widest hover:text-white transition-colors uppercase"
                >
                    Vissza
                </button>
            </div>

            {/* DEBUG / HTTP FALLBACK SZIMULÁTOR */}
            {/* Csak akkor jelenjen meg, ha nem tudjuk elérni a kamerát biztonsági okokból, vagy dev módban vagyunk */}
            <div className="absolute top-20 left-4 right-4 z-40 flex flex-col items-center gap-2 pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center w-full max-w-sm">
                    <p className="text-[10px] text-red-300 uppercase tracking-widest mb-3">
                        ⚠️ Teszt Mód (Kamera Szimulátor)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleScan({ text: 'https://koszeg.hu/game/gem/varoshaza' })}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase py-2 rounded border border-white/10"
                        >
                            QR: Városháza
                        </button>
                        <button
                            onClick={() => handleScan({ text: 'https://koszeg.hu/game/gem/jurisics-ter' })}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase py-2 rounded border border-white/10"
                        >
                            QR: Jurisics Tér
                        </button>
                        <button
                            onClick={() => handleScan({ text: 'https://koszeg.hu/game/gem/ovaros-falak' })}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase py-2 rounded border border-white/10"
                        >
                            QR: Falak
                        </button>
                        <button
                            onClick={() => handleScan({ text: 'https://koszeg.hu/game/gem/varkor' })}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase py-2 rounded border border-white/10"
                        >
                            QR: Várkör
                        </button>
                    </div>
                    <p className="text-[9px] text-white/30 mt-2">
                        (Mivel HTTP-n a böngésző tiltja a kamerát)
                    </p>
                </div>
            </div>

            {/* HALK SZÖVEG */}
            <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none z-20 px-6">
                <p className="text-white/80 font-serif text-lg leading-relaxed shadow-black drop-shadow-md">
                    Megtaláltad a titkot rejtő jelet.
                </p>
                <p className="text-white/50 text-xs uppercase tracking-[0.2em] mt-2 font-mono">
                    Tartsd fölé a kamerát, hogy kinyíljon a kapu.
                </p>
            </div>

            {/* LEZÁRÓ OVERLAY (ÁTMENET) */}
            {isClosing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed inset-0 bg-black z-50"
                />
            )}
        </div>
    );
}
