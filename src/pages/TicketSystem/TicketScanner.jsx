// Ticket System - QR Scanner Page
// For venue staff to validate tickets at entry

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaQrcode, FaCamera } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function TicketScanner() {
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [validating, setValidating] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (scanning && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            scanner.render(onScanSuccess, onScanError);
            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [scanning]);

    const onScanSuccess = async (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        await validateTicket(decodedText);
    };

    const onScanError = (error) => {
        // Ignore scan errors (happens frequently during scanning)
        console.debug('Scan error:', error);
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
                // Play success sound (optional)
                new Audio('/sounds/success.mp3').play().catch(() => { });
            } else {
                toast.error(`❌ ${data.message}`, { duration: 5000 });
                // Play error sound (optional)
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

    const startScanning = () => {
        setScanning(true);
        setLastResult(null);
    };

    const stopScanning = () => {
        setScanning(false);
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">🎟️ Jegy Szkenner</h1>
                    <p className="text-gray-400">Beléptetés QR kód alapján</p>
                </div>

                {/* Scanner Controls */}
                {!scanning ? (
                    <div className="text-center">
                        <button
                            onClick={startScanning}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-colors"
                        >
                            <FaCamera className="text-2xl" />
                            Szkenner indítása
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Scanner Area */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
                        </div>

                        {/* Stop Button */}
                        <button
                            onClick={stopScanning}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                        >
                            Szkenner leállítása
                        </button>
                    </div>
                )}

                {/* Validation Result */}
                {lastResult && (
                    <div className={`mt-8 p-6 rounded-xl ${lastResult.valid
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
                            <div className="mt-4 space-y-2 text-sm bg-black/30 rounded-lg p-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Vásárló:</span>
                                    <span className="font-semibold">{lastResult.ticket.buyerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Esemény:</span>
                                    <span className="font-semibold">{lastResult.ticket.eventName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Vendégek:</span>
                                    <span className="font-semibold">{lastResult.ticket.guestCount} fő</span>
                                </div>
                                {lastResult.ticket.validatedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Validálva:</span>
                                        <span className="font-semibold">
                                            {new Date(lastResult.ticket.validatedAt).toLocaleString('hu-HU')}
                                        </span>
                                    </div>
                                )}
                                {lastResult.usedAt && (
                                    <div className="flex justify-between text-red-400">
                                        <span>Már használva:</span>
                                        <span className="font-semibold">
                                            {new Date(lastResult.usedAt).toLocaleString('hu-HU')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Validating Indicator */}
                {validating && (
                    <div className="mt-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Ellenőrzés...</p>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-12 bg-gray-800 rounded-xl p-6">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <FaQrcode /> Használati útmutató
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li>• Indítsd el a szkennert a gombbal</li>
                        <li>• Tartsd a vendég telefonját/jegyét a kamera elé</li>
                        <li>• A rendszer automatikusan érvényesíti a QR kódot</li>
                        <li>• Zöld = Beléphet, Piros = Nem léphet be</li>
                        <li>• Minden jegy csak egyszer használható fel</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
