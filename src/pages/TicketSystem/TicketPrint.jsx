import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { IoPrintOutline, IoChevronBackOutline } from 'react-icons/io5';

export default function TicketPrint() {
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select(`
            *,
            ticket_events (*)
          `)
                    .eq('id', ticketId)
                    .single();

                if (error) throw error;
                setTicket(data);
            } catch (err) {
                console.error('Error fetching ticket:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">A jegy nem található</h1>
                <Link to="/tickets" className="text-indigo-600 font-medium">Vissza a vásárláshoz</Link>
            </div>
        );
    }

    const event = ticket.ticket_events;
    const eventDate = new Date(event.date).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-zinc-50 py-8 px-4 print:bg-white print:p-0">
            <div className="max-w-2xl mx-auto">
                {/* Top Controls (Hidden on print) */}
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Link to="/tickets" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                        <IoChevronBackOutline /> Vissza
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                    >
                        <IoPrintOutline /> Jegy Nyomtatása
                    </button>
                </div>

                {/* The Ticket Itself */}
                <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm print:shadow-none print:border-zinc-300 print:rounded-none">
                    {/* Header */}
                    <div className="bg-zinc-900 text-white p-8 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                            <span className="text-xs font-black uppercase tracking-[0.4em]">Kőszeg</span>
                            <span className="text-xs font-light uppercase tracking-[0.4em] opacity-60">TICKET</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">BELÉPŐJEGY</h1>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Event Info */}
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{event.category || 'ESEMÉNY'}</p>
                            <h2 className="text-3xl font-black text-zinc-900 leading-tight">{event.name}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Dátum és idő</p>
                                    <p className="text-lg font-bold text-zinc-900">{eventDate}</p>
                                    <p className="text-zinc-600">{event.time}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Helyszín</p>
                                    <p className="text-zinc-900 font-medium leading-relaxed">{event.location}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Vásárló</p>
                                    <p className="text-zinc-900 font-bold">{ticket.buyer_name}</p>
                                    <p className="text-zinc-500 text-sm">{ticket.buyer_email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Jegytípus / Létszám</p>
                                    <p className="text-zinc-900 font-bold">{ticket.guest_count} db Felnőtt jegy</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Section */}
                        <div className="pt-8 border-t border-dashed border-zinc-200 flex flex-col items-center gap-6">
                            <div className="bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.qr_code_token}`}
                                    alt="Belépő QR Kód"
                                    className="w-48 h-48 sm:w-56 sm:h-56"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-zinc-900 mb-1">{ticket.qr_code_token}</p>
                                <p className="text-[11px] text-zinc-400 uppercase tracking-widest leading-loose">
                                    Érvényes egy egyszeri belépésre.<br />
                                    A jegy átruházása tilos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div className="bg-zinc-50 border-t border-zinc-100 p-6 text-center">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                            Vásárolva: {new Date(ticket.created_at).toLocaleString('hu-HU')}
                        </p>
                    </div>
                </div>

                {/* Print Disclaimer (Hidden on screen) */}
                <p className="hidden print:block text-[9px] text-zinc-400 text-center mt-6 italic">
                    Kincses Kőszeg Város Önkormányzata - visitkoszeg Ticket System. A jegy nyomtatás után is megőrzi érvényességét.
                </p>
            </div>
        </div>
    );
}
