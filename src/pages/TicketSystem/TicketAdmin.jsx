// Ticket System - Admin Panel
// Event management and ticket overview for organizers

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaTicketAlt, FaUsers, FaDownload, FaArchive } from 'react-icons/fa';

export default function TicketAdmin() {
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [cityEvents, setCityEvents] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: 100,
        price: 5000,
        service_fee_percent: 5,
        category: 'Koncert',
        is_evergreen: false,
        payment_type: 'paid', // 'paid' or 'on_site_reservation'
        image_url: ''
    });

    useEffect(() => {
        fetchEvents();
        fetchCityEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchTickets(selectedEvent.id);
        }
    }, [selectedEvent]);

    const fetchCityEvents = async () => {
        try {
            const res = await fetch('/data/events.json');
            if (res.ok) {
                const data = await res.json();
                setCityEvents(data);
            }
        } catch (error) {
            console.error('Error fetching city events:', error);
        }
    };

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
            setUploadingImage(true);
            const { data: { user } } = await supabase.auth.getUser();

            let finalImageUrl = formData.image_url;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('ticket-images')
                    .upload(filePath, imageFile);

                if (uploadError) {
                    throw new Error(`Képfeltöltési hiba: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('ticket-images')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrl;
            }

            if (editingEventId) {
                const { error } = await supabase
                    .from('ticket_events')
                    .update({
                        ...formData,
                        image_url: finalImageUrl
                    })
                    .eq('id', editingEventId);

                if (error) throw error;
                toast.success('Esemény frissítve!');
            } else {
                const { error } = await supabase
                    .from('ticket_events')
                    .insert({
                        ...formData,
                        image_url: finalImageUrl,
                        organizer_id: user?.id,
                        status: 'active'
                    });

                if (error) throw error;
                toast.success('Esemény létrehozva!');
            }

            setShowCreateForm(false);
            setImageFile(null);
            setEditingEventId(null);
            setFormData({
                name: '',
                description: '',
                date: '',
                time: '',
                location: '',
                capacity: 100,
                price: 5000,
                service_fee_percent: 5,
                category: 'Koncert',
                is_evergreen: false,
                payment_type: 'paid',
                image_url: ''
            });
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error(error.message || 'Hiba történt az esemény létrehozásakor. Ellenőrizd az adatbázis kapcsolatot!');
        } finally {
            setUploadingImage(false);
        }
    };

    const archiveEvent = async (eventId) => {
        if (!window.confirm('Biztosan archiválod ezt az eseményt?')) return;

        try {
            const { error } = await supabase
                .from('ticket_events')
                .update({ status: 'archived' })
                .eq('id', eventId);

            if (error) throw error;

            toast.success('Esemény archiválva');
            fetchEvents();
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
        } catch (error) {
            console.error('Error archiving event:', error);
            toast.error(`Hiba történt az archiválás során: ${error.message || ''}`);
        }
    };

    const deleteEvent = async (eventId) => {
        const eventTickets = tickets.filter(t => t.event_id === eventId);
        if (eventTickets.length > 0) {
            toast.error('Nem törölhető esemény eladott jegyekkel! Használd az archiválást.');
            return;
        }

        if (!window.confirm('Biztosan véglegesen törlöd ezt az eseményt?')) return;

        try {
            const { error } = await supabase
                .from('ticket_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            toast.success('Esemény törölve');
            fetchEvents();
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Hiba történt a törlés során');
        }
    };

    const exportAttendees = () => {
        if (!tickets.length) {
            toast.error('Nincsenek jegyek exportálásra');
            return;
        }

        const validTickets = tickets.filter(t => t.status === 'paid' || t.status === 'used' || t.status === 'reserved');

        const csv = [
            ['Név', 'Email', 'Vendégek', 'Státusz', 'Vásárlás/Foglalás dátuma', 'Használva'],
            ...validTickets.map(t => [
                t.buyer_name,
                t.buyer_email,
                t.guest_count,
                t.status === 'used' ? 'Belépett' : t.status === 'reserved' ? 'Foglalt' : 'Érvényes',
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
        const valid = eventTickets.filter(t => t.status === 'paid' || t.status === 'used' || t.status === 'reserved').length;
        const used = eventTickets.filter(t => t.status === 'used').length;
        const totalGuests = eventTickets
            .filter(t => t.status === 'paid' || t.status === 'used' || t.status === 'reserved')
            .reduce((sum, t) => sum + t.guest_count, 0);

        return { valid, used, totalGuests };
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
                        onClick={() => {
                            setEditingEventId(null);
                            setFormData({
                                name: '',
                                description: '',
                                date: '',
                                time: '',
                                location: '',
                                capacity: 100,
                                price: 5000,
                                service_fee_percent: 5,
                                category: 'Koncert',
                                is_evergreen: false,
                                payment_type: 'paid',
                                image_url: ''
                            });
                            setShowCreateForm(true);
                        }}
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
                                {editingEventId ? 'Esemény szerkesztése' : 'Új esemény létrehozása'}
                            </h2>

                            {!editingEventId && cityEvents.length > 0 && (
                                <div className="mb-6 p-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                                    <label className="block text-sm font-bold text-purple-700 dark:text-purple-400 mb-2">
                                        ⚡ Városi Naptár Esemény Betöltése (Opcionális)
                                    </label>
                                    <select 
                                        className="w-full p-2.5 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                                        onChange={(e) => {
                                            const ev = cityEvents.find(c => c.id === e.target.value);
                                            if(ev) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    name: ev.name || '',
                                                    date: ev.date || '',
                                                    time: ev.time || '',
                                                    location: ev.location || '',
                                                    description: ev.description || '',
                                                    category: (ev.tags && ev.tags[0]) ? (['Színház', 'Koncert', 'Kiállítás', 'Bemutató', 'Fesztivál', 'Sport', 'Városnézés'].includes(ev.tags[0]) ? ev.tags[0] : 'Egyéb') : 'Koncert'
                                                }));
                                                toast.success('Adatok sikeresen betöltve a Városi Naptárból!');
                                                // Reset the select back to default after populating
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="">-- Válassz egyet az automatikus kitöltéshez --</option>
                                        {cityEvents.map(ce => (
                                            <option key={ce.id} value={ce.id}>{ce.date} - {ce.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">
                                        Ha választasz a listából, a gép automatikusan kitölti az űrlapot az applikációból, így a soft-link azonnali lesz a visitkoszeg.hu főoldallal! Dátum és Név egyezése szükséges a felismeréshez.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Esemény borítóképe (Plakát, Logó)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                    {imageFile && <p className="text-xs text-green-600 mt-1">✓ Kiválasztva: {imageFile.name}</p>}
                                </div>

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

                                {!formData.is_evergreen && (
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
                                                required={!formData.is_evergreen}
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
                                                required={!formData.is_evergreen}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Kategória
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            required
                                        >
                                            <option value="Színház">Színház</option>
                                            <option value="Koncert">Koncert</option>
                                            <option value="Kiállítás">Kiállítás</option>
                                            <option value="Bemutató">Bemutató</option>
                                            <option value="Fesztivál">Fesztivál</option>
                                            <option value="Sport">Sport</option>
                                            <option value="Városnézés">Városnézés</option>
                                            <option value="Egyéb">Egyéb</option>
                                        </select>
                                    </div>
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

                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Ár (Ft)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                required
                                            />
                                        </div>

                                        {formData.payment_type === 'paid' ? (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Jutalék (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.service_fee_percent}
                                                    onChange={(e) => setFormData({ ...formData, service_fee_percent: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 border border-dashed border-gray-300 dark:border-gray-700">
                                                <p className="text-xs text-gray-500 italic">
                                                    Helyszíni fizetés, nincs online jutalék.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 py-2">
                                        <input
                                            type="checkbox"
                                            id="is_evergreen"
                                            checked={formData.is_evergreen}
                                            onChange={(e) => {
                                                const isEvergreen = e.target.checked;
                                                setFormData({
                                                    ...formData,
                                                    is_evergreen: isEvergreen,
                                                    date: isEvergreen ? '2029-12-31' : new Date().toISOString().split('T')[0],
                                                    time: isEvergreen ? '00:00' : '18:00'
                                                });
                                            }}
                                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_evergreen" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Örökérvényű (Múzeumi belépő)
                                        </label>
                                    </div>

                                    {/* Payment Type Selection */}
                                    <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mt-2">
                                        <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3">
                                            💰 Fizetés és Értékesítés módja
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, payment_type: 'paid' })}
                                                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.payment_type === 'paid'
                                                    ? 'bg-indigo-600 text-white shadow-lg'
                                                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                Stripe (Online fizetés)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    payment_type: 'on_site_reservation',
                                                    service_fee_percent: 0
                                                })}
                                                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.payment_type === 'on_site_reservation'
                                                    ? 'bg-amber-500 text-white shadow-lg'
                                                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                Foglalás (Helyszíni fizetés)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={uploadingImage}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {uploadingImage ? 'Feltöltés...' : (editingEventId ? 'Mentés' : 'Létrehozás')}
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

                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8 max-w-xs mx-auto sm:mx-0">
                    <button
                        onClick={() => { setActiveTab('active'); setSelectedEvent(null); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Aktív
                    </button>
                    <button
                        onClick={() => { setActiveTab('archived'); setSelectedEvent(null); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'archived'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Archívum
                    </button>
                </div>

                {/* Events Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events
                        .filter(event => {
                            const isExpired = !event.is_evergreen && new Date(event.date) < new Date().setHours(0, 0, 0, 0);
                            if (activeTab === 'active') {
                                return event.status === 'active' && !isExpired;
                            } else {
                                return event.status === 'archived' || (isExpired && !event.is_evergreen);
                            }
                        })
                        .map(event => {
                            const stats = getTicketStats(event.id);
                            const isExpired = !event.is_evergreen && new Date(event.date) < new Date().setHours(0, 0, 0, 0);

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer transition-all ${selectedEvent?.id === event.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-xl'} ${isExpired ? 'opacity-50 grayscale-[0.5] border-dashed border-2 border-gray-300 dark:border-gray-700' : ''}`}
                                >
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {event.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {event.is_evergreen ? 'Szezonális / Bármikor' : `${new Date(event.date).toLocaleDateString('hu-HU')} ${event.time}`}
                                    </p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Foglalások/Jegyek:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{stats.valid}</span>
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

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center group">
                                        <div className="flex gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {event.status === 'active' ? 'Aktív' : event.status === 'archived' ? 'Archivált' : event.status}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${event.payment_type === 'on_site_reservation' ? 'text-amber-600 bg-amber-500/10 border border-amber-500/20' : 'text-indigo-600 bg-indigo-500/10'}`}>
                                                {event.payment_type === 'on_site_reservation' ? 'Foglalós' : 'Online'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {event.status !== 'archived' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingEventId(event.id);
                                                        setFormData({
                                                            name: event.name || '',
                                                            description: event.description || '',
                                                            date: event.date || '',
                                                            time: event.time || '',
                                                            location: event.location || '',
                                                            capacity: event.capacity || 100,
                                                            price: event.price || 0,
                                                            service_fee_percent: event.service_fee_percent || 0,
                                                            category: event.category || 'Koncert',
                                                            is_evergreen: event.is_evergreen || false,
                                                            payment_type: event.payment_type || 'paid',
                                                            image_url: event.image_url || ''
                                                        });
                                                        setShowCreateForm(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                            )}
                                            {event.status !== 'archived' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); archiveEvent(event.id); }}
                                                    className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                                                >
                                                    <FaArchive size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
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
                                Jegyek / Foglalások - {selectedEvent.name}
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
                                        <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Fő</th>
                                        <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Státusz</th>
                                        <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Dátum</th>
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
                                                        ticket.status === 'reserved' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {ticket.status === 'paid' ? 'Érvényes' :
                                                        ticket.status === 'used' ? 'Belépett' :
                                                            ticket.status === 'reserved' ? 'Foglalt' :
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
