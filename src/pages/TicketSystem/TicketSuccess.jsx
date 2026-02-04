// Ticket System - Success Page
// Displayed after successful Stripe payment

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaApple, FaHome } from 'react-icons/fa';

export default function TicketSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading (in real app, could verify session)
        setTimeout(() => setLoading(false), 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Feldolgozás...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                {/* Success Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                    {/* Success Icon */}
                    <div className="mb-6">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                            <FaCheckCircle className="text-5xl text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Sikeres vásárlás! 🎉
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                        A jegyed elkészült és hamarosan megkapod emailben!
                    </p>

                    {/* Info Boxes */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                            <FaEnvelope className="text-3xl text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Ellenőrizd az emailedet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                A jegyed QR kóddal együtt megküldtük
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                            <FaApple className="text-3xl text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Apple Wallet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Kattints az emailben a gombra a hozzáadáshoz
                            </p>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-8 text-left">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>⚠️ Fontos:</strong> A jegy csak egyszer használható fel. Kérjük, mutasd fel a QR kódot a belépéskor!
                        </p>
                    </div>

                    {/* Session ID (for debugging) */}
                    {sessionId && (
                        <p className="text-xs text-gray-400 dark:text-gray-600 mb-6 font-mono">
                            Tranzakció ID: {sessionId.substring(0, 20)}...
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FaHome /> Vissza a főoldalra
                        </Link>
                        <Link
                            to="/tickets"
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                        >
                            Új jegy vásárlása
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Ha nem kaptad meg az emailt 5 percen belül, ellenőrizd a spam mappát, vagy írj nekünk: <a href="mailto:info@koszegapp.hu" className="text-indigo-600 hover:underline">info@koszegapp.hu</a>
                </p>
            </div>
        </div>
    );
}
