// Ticket System - Purchase Page
// Isolated ticket purchase interface with Stripe integration

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTicketAlt, FaCreditCard } from 'react-icons/fa';

export default function TicketPurchase() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    // Form state
    const [buyerName, setBuyerName] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [guestCount, setGuestCount] = useState(1);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('ticket_events')
                .select('*')
                .eq('status', 'active')
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Nem sikerült betölteni az eseményeket');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();

        if (!selectedEvent) {
            toast.error('Válassz egy eseményt!');
            return;
        }

        if (!buyerName.trim() || !buyerEmail.trim()) {
            toast.error('Töltsd ki az összes mezőt!');
            return;
        }

        if (guestCount < 1) {
            toast.error('Legalább 1 vendéget adj meg!');
            return;
        }

        setPurchasing(true);

        try {
            // Call checkout function
            const response = await fetch('/.netlify/functions/ticket-create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent.id,
                    buyerName: buyerName.trim(),
                    buyerEmail: buyerEmail.trim(),
                    guestCount,
                    ticketType: 'general'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Hiba történt a vásárlás során');
            }

            // Redirect to Stripe Checkout
            window.location.href = data.checkoutUrl;
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.message || 'Hiba történt a vásárlás során');
            setPurchasing(false);
        }
    };

    const calculateTotal = () => {
        if (!selectedEvent) return 0;
        const ticketPrice = parseFloat(selectedEvent.price) * guestCount;
        const serviceFee = ticketPrice * (parseFloat(selectedEvent.service_fee_percent) / 100);
        return ticketPrice + serviceFee;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Betöltés...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        🎟️ Jegyvásárlás
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Válassz eseményt és vásárolj jegyet egyszerűen
                    </p>
                </div>

                {/* Events List */}
                {!selectedEvent && (
                    <div className="grid gap-6 md:grid-cols-2 mb-8">
                        {events.length === 0 ? (
                            <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                                <FaTicketAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Jelenleg nincsenek elérhető események
                                </p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        {event.name}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-indigo-500" />
                                            <span>{new Date(event.date).toLocaleDateString('hu-HU')} {event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-indigo-500" />
                                            <span>{event.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaUsers className="text-indigo-500" />
                                            <span>{event.capacity} fő kapacitás</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-indigo-600">
                                                {parseInt(event.price).toLocaleString()} Ft
                                            </span>
                                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                                Vásárlás
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Purchase Form */}
                {selectedEvent && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                        >
                            ← Vissza az eseményekhez
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {selectedEvent.name}
                        </h2>

                        <form onSubmit={handlePurchase} className="space-y-6">
                            {/* Buyer Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Neved
                                </label>
                                <input
                                    type="text"
                                    value={buyerName}
                                    onChange={(e) => setBuyerName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Kovács János"
                                    required
                                />
                            </div>

                            {/* Buyer Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Email cím
                                </label>
                                <input
                                    type="email"
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="pelda@email.hu"
                                    required
                                />
                            </div>

                            {/* Guest Count */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Vendégek száma
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Price Summary */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-3">
                                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>Jegyár ({guestCount} fő)</span>
                                    <span>{(parseFloat(selectedEvent.price) * guestCount).toLocaleString()} Ft</span>
                                </div>

                                {parseFloat(selectedEvent.service_fee_percent) > 0 && (
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>Kezelési díj ({selectedEvent.service_fee_percent}%)</span>
                                        <span>
                                            {(parseFloat(selectedEvent.price) * guestCount * parseFloat(selectedEvent.service_fee_percent) / 100).toLocaleString()} Ft
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-300 dark:border-gray-700">
                                    <span>Összesen</span>
                                    <span>{calculateTotal().toLocaleString()} Ft</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={purchasing}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {purchasing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Átirányítás...
                                    </>
                                ) : (
                                    <>
                                        <FaCreditCard /> Fizetés Stripe-pal
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
