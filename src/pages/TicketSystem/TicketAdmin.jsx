// Ticket System - Admin Panel
// Event management and ticket overview for organizers

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaTicketAlt, FaUsers, FaDownload } from 'react-icons/fa';

export default function TicketAdmin() {
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: 100,
        price: 5000,
        service_fee_percent: 5
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchTickets(selectedEvent.id);
        }
    }, [selectedEvent]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('ticket_events')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Nem sikerült betölteni az eseményeket');
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = async (eventId) => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Nem sikerült betölteni a jegyeket');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('ticket_events')
                .insert({
                    ...formData,
                    organizer_id: user?.id,
                    status: 'active'
                });

            if (error) throw error;

            toast.success('Esemény létrehozva!');
            setShowCreateForm(false);
            setFormData({
                name: '',
                description: '',
                date: '',
                time: '',
                location: '',
                capacity: 100,
                price: 5000,
                service_fee_percent: 5
            });
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Hiba történt az esemény létrehozásakor');
        }
    };

    const exportAttendees = () => {
        if (!tickets.length) {
            toast.error('Nincsenek jegyek exportálásra');
            return;
        }

        const paidTickets = tickets.filter(t => t.status === 'paid' || t.status === 'used');

        const csv = [
            ['Név', 'Email', 'Vendégek', 'Státusz', 'Vásárlás dátuma', 'Használva'],
            ...paidTickets.map(t => [
                t.buyer_name,
                t.buyer_email,
                t.guest_count,
                t.status === 'used' ? 'Belépett' : 'Érvényes',
                new Date(t.created_at).toLocaleString('hu-HU'),
                t.used_at ? new Date(t.used_at).toLocaleString('hu-HU') : '-'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vendegek_${selectedEvent.name}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success('Vendéglista exportálva!');
    };

    const getTicketStats = (eventId) => {
        const eventTickets = tickets.filter(t => t.event_id === eventId);
        const paid = eventTickets.filter(t => t.status === 'paid' || t.status === 'used').length;
        const used = eventTickets.filter(t => t.status === 'used').length;
        const totalGuests = eventTickets
            .filter(t => t.status === 'paid' || t.status === 'used')
            .reduce((sum, t) => sum + t.guest_count, 0);

        return { paid, used, totalGuests };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Jegyrendszer Admin
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Események és jegyek kezelése
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FaPlus /> Új esemény
                    </button>
                </div>

                {/* Create Event Form */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Új esemény létrehozása
                            </h2>

                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Esemény neve
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Leírás
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        rows="3"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Dátum
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Időpont
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Helyszín
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Kapacitás
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Ár (Ft)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Jutalék (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.service_fee_percent}
                                            onChange={(e) => setFormData({ ...formData, service_fee_percent: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        Létrehozás
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Events Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => {
                        const stats = getTicketStats(event.id);
                        return (
                            <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-xl'
                                    }`}
                            >
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {event.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {new Date(event.date).toLocaleDateString('hu-HU')} {event.time}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Eladott jegyek:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{stats.paid}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Vendégek:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {stats.totalGuests} / {event.capacity}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Belépett:</span>
                                        <span className="font-semibold text-green-600">{stats.used}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {event.status === 'active' ? 'Aktív' : event.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Ticket List */}
                {selectedEvent && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Jegyek - {selectedEvent.name}
                            </h2>
                            <button
                                onClick={exportAttendees}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <FaDownload /> Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Vásárló</th>
                                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Email</th>
                                        <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Vendégek</th>
                                        <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Státusz</th>
                                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Vásárlás</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map(ticket => (
                                        <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-700">
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{ticket.buyer_name}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ticket.buyer_email}</td>
                                            <td className="py-3 px-4 text-center text-gray-900 dark:text-white">{ticket.guest_count}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticket.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                                    ticket.status === 'used' ? 'bg-green-100 text-green-800' :
                                                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {ticket.status === 'paid' ? 'Érvényes' :
                                                        ticket.status === 'used' ? 'Belépett' :
                                                            ticket.status === 'pending' ? 'Függőben' :
                                                                ticket.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-sm">
                                                {new Date(ticket.created_at).toLocaleDateString('hu-HU')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
