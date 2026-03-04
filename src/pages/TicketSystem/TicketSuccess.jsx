// Ticket System - Success Page
// Displayed after successful Stripe payment

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaApple, FaHome, FaDownload } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function TicketSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);

    useEffect(() => {
        async function fetchTicketData() {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*, ticket_events(*)')
                    .eq('stripe_session_id', sessionId)
                    .single();

                if (error) throw error;
                setTicket(data);
            } catch (err) {
                console.error('Error fetching ticket:', err);
                // We still show the success page, just without direct links
            } finally {
                setLoading(false);
            }
        }

        fetchTicketData();
    }, [sessionId]);

    const handleGoogleWallet = () => {
        if (!ticket) {
            toast.error('Jegyadatok nem találhatók');
            return;
        }

        // Direct redirect to the Netlify function which now returns a 302
        window.location.href = `/.netlify/functions/ticket-generate-google-pass?ticketId=${ticket.id}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Jegyadatok lekérése...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                {/* Success Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center border border-white/20">
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
                        A jegyed elkészült és hamarosan megkapod emailben is!
                    </p>

                    {/* Info Boxes */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                            <FaEnvelope className="text-2xl text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                Email
                            </h3>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400">
                                A jegyet QR kóddal megküldtük
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                            <FaApple className="text-2xl text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                Apple Wallet
                            </h3>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400">
                                Kattints az emailben a gombra
                            </p>
                        </div>

                        {/* Google Wallet Interactive Card */}
                        <button
                            onClick={handleGoogleWallet}
                            disabled={!ticket}
                            className={`bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 transition-all text-center w-full
                                ${!ticket ? 'opacity-50' : 'hover:scale-105 hover:shadow-lg hover:border-blue-400 cursor-pointer'}
                            `}
                        >
                            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#4285F4" d="M23.49 12.275c0-.85-.075-1.7-.225-2.51H12v4.76h6.445c-.275 1.485-1.12 2.74-2.4 3.6v3h3.89c2.275-2.095 3.585-5.18 3.585-8.85z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.075 7.94-2.9l-3.89-3c-1.07.725-2.445 1.15-4.05 1.15-3.125 0-5.77-2.11-6.72-4.96H1.36v3.115C3.435 21.525 7.425 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.28 14.29c-.245-.735-.38-1.52-.38-2.29s.135-1.555.385-2.29V6.595H1.36c-.85 1.695-1.34 3.625-1.34 5.67s.49 3.975 1.34 5.67l3.92-3.645z" />
                                    <path fill="#EA4335" d="M12 4.75c1.765 0 3.35.605 4.6 1.795l3.415-3.415C17.95 1.19 15.235 0 12 0 7.425 0 3.435 2.475 1.36 6.595l3.92 3.645c.95-2.85 3.595-4.96 6.72-4.96z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                Google Wallet
                            </h3>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400">
                                Kattints a hozzáadáshoz
                            </p>
                        </button>
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
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-md"
                        >
                            <FaHome /> Vissza a főoldalra
                        </Link>
                        <Link
                            to="/tickets"
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md"
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
