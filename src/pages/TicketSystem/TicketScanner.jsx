// Ticket System - QR Scanner Page
// For venue staff to validate tickets at entry

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaQrcode, FaCamera } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';

export default function TicketScanner() {
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [validating, setValidating] = useState(false);
    const scannerRef = useRef(null);

    // Clean up scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        console.log('QR Code scanned:', decodedText);

        // Stop scanning immediately to prevent duplicate reads
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                setScanning(false);
            } catch (err) {
                console.warn('Failed to stop scanner after success', err);
            }
        }

        await validateTicket(decodedText);
    };

    const onScanError = (error) => {
        // Ignore internal parse errors (happens frequently during scanning)
    };

    const validateTicket = async (qrCodeToken) => {
        setValidating(true);

        try {
            const response = await fetch('/.netlify/functions/ticket-validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrCodeToken })
            });

            const data = await response.json();
            setLastResult(data);

            if (data.valid) {
                toast.success('✅ Érvényes jegy!', { duration: 5000 });
                // Play success sound (if available)
                new Audio('/sounds/success.mp3').play().catch(() => { });
            } else {
                toast.error(`❌ ${data.message}`, { duration: 5000 });
                // Play error sound (if available)
                new Audio('/sounds/error.mp3').play().catch(() => { });
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Hiba történt a validálás során');
            setLastResult({
                valid: false,
                status: 'error',
                message: 'Hálózati hiba'
            });
        } finally {
            setValidating(false);
        }
    };

    const startScanning = async () => {
        setScanning(true);
        setLastResult(null);

        // Wait for DOM element to be ready
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // FORCE REAR CAMERA
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    onScanSuccess,
                    onScanError
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                toast.error("Nem sikerült elindítani a kamerát. Ellenőrizd a jogosultságokat!");
                setScanning(false);
            }
        }, 100);
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Stop failed", err);
            }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">🎟️ Jegy Szkenner</h1>
                    <p className="text-gray-400">Beléptetés QR kód alapján (Hátsó kamera)</p>
                </div>

                {/* Scanner Controls */}
                {!scanning ? (
                    <div className="text-center">
                        <button
                            onClick={startScanning}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-colors shadow-lg shadow-indigo-500/30"
                        >
                            <FaCamera className="text-2xl" />
                            Szkenner indítása
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Scanner Area */}
                        <div className="bg-gray-800 rounded-xl p-4 shadow-inner">
                            <div id="qr-reader" className="rounded-lg overflow-hidden w-full h-full min-h-[300px] bg-black"></div>
                        </div>

                        {/* Stop Button */}
                        <button
                            onClick={stopScanning}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors shadow-lg"
                        >
                            Szkenner leállítása
                        </button>
                    </div>
                )}

                {/* Validation Result */}
                {lastResult && (
                    <div className={`mt-8 p-6 rounded-xl shadow-xl transition-all duration-500 ${lastResult.valid
                        ? 'bg-green-900/50 border-2 border-green-500'
                        : 'bg-red-900/50 border-2 border-red-500'
                        }`}>
                        <div className="flex items-center gap-4 mb-4">
                            {lastResult.valid ? (
                                <FaCheckCircle className="text-5xl text-green-400" />
                            ) : (
                                <FaTimesCircle className="text-5xl text-red-400" />
                            )}
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {lastResult.valid ? 'Érvényes jegy' : 'Érvénytelen jegy'}
                                </h3>
                                <p className="text-gray-300">{lastResult.message}</p>
                            </div>
                        </div>

                        {/* Ticket Details */}
                        {lastResult.ticket && (
                            <div className="mt-4 space-y-2 text-sm bg-black/30 rounded-lg p-4 backdrop-blur-sm">
                                <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
                                    <span className="text-gray-400">Vásárló:</span>
                                    <span className="font-semibold text-lg">{lastResult.ticket.buyerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Esemény:</span>
                                    <span className="font-semibold text-right">{lastResult.ticket.eventName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Vendégek:</span>
                                    <span className="font-semibold">{lastResult.ticket.guestCount} fő</span>
                                </div>
                                {lastResult.ticket.validatedAt && (
                                    <div className="flex justify-between pt-2 mt-2 border-t border-white/10 text-yellow-300">
                                        <span className="">Validálva:</span>
                                        <span className="font-mono">
                                            {new Date(lastResult.ticket.validatedAt).toLocaleString('hu-HU')}
                                        </span>
                                    </div>
                                )}
                                {lastResult.usedAt && !lastResult.valid && (
                                    <div className="flex justify-between text-red-400 pt-2 border-t border-red-500/30 mt-2">
                                        <span>Már használva:</span>
                                        <span className="font-mono font-bold">
                                            {new Date(lastResult.usedAt).toLocaleString('hu-HU')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!scanning && (
                            <button
                                onClick={startScanning}
                                className="w-full mt-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <FaQrcode /> Következő jegy
                            </button>
                        )}
                    </div>
                )}

                {/* Validating Indicator */}
                {validating && (
                    <div className="mt-8 text-center bg-gray-800 rounded-xl p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400 font-semibold">Ellenőrzés folyamatban...</p>
                    </div>
                )}

                {/* Instructions */}
                {!scanning && !lastResult && !validating && (
                    <div className="mt-12 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-indigo-400">
                            <FaQrcode /> Használati útmutató
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-400 list-disc list-inside">
                            <li>Nyomd meg a <strong>Szkenner indítása</strong> gombot.</li>
                            <li>A böngésző kérni fogja a kamera hozzáférést (Engedélyezd!).</li>
                            <li>Irányítsd a hátlapi kamerát a vendég QR kódjára.</li>
                            <li>A rendszer azonnal visszajelzi az eredményt.</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
