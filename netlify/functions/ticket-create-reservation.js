// 🎫 Ticket System - Reservation Creator (Unpaid)
// Creates a ticket record for on-site payment events

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export const handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { eventId, buyerName, buyerEmail, zip, city, address, guestCount } = JSON.parse(event.body);

        // Validate input
        if (!eventId || !buyerName || !buyerEmail || !zip || !city || !address || !guestCount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Hiányzó kötelező mezők' })
            };
        }

        // Fetch event details
        const { data: ticketEvent, error: eventError } = await supabase
            .from('ticket_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError || !ticketEvent) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Esemény nem található' })
            };
        }

        // Verify it's a reservation-type event
        if (ticketEvent.payment_type !== 'on_site_reservation') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Ez az esemény csak online fizetéssel vásárolható meg' })
            };
        }

        // Check capacity
        const { data: existingTickets } = await supabase
            .from('tickets')
            .select('guest_count')
            .eq('event_id', eventId)
            .in('status', ['paid', 'used', 'reserved']);

        const totalGuests = (existingTickets || []).reduce((sum, t) => sum + t.guest_count, 0);

        if (totalGuests + guestCount > ticketEvent.capacity) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nincs elég szabad hely' })
            };
        }

        // Create the ticket record directly with 'reserved' status
        // Note: In a full implementation, we'd also create an 'order' record as Stripe does, 
        // but for reservations, we can go direct or use the same table structure.
        const { data: newTicket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
                event_id: eventId,
                status: 'reserved',
                buyer_name: buyerName,
                buyer_email: buyerEmail,
                guest_count: guestCount,
                zip,
                city,
                address,
                ticket_type: 'general',
                stripe_session_id: `res_${Date.now()}` // Use existing column for reservation tracking
            })
            .select()
            .single();

        if (ticketError) throw ticketError;

        // The Success page will handle the "Thank you / Reservation" message based on URL params
        const successUrl = `/tickets/success?reservation_id=${newTicket.id}`;

        // Trigger email confirmation for the reservation
        try {
            const { getAppUrl } = await import('./lib/ticketConfig.js');
            const confirmUrl = `${getAppUrl()}/.netlify/functions/ticket-send-confirmation`;

            await fetch(confirmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: newTicket.id }),
            });
            console.log('✅ Reservation email trigger launched successfully');
        } catch (emailErr) {
            console.error('❌ Failed to trigger reservation email:', emailErr);
            // We don't fail the whole request if email fails
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                redirectUrl: successUrl,
                ticketId: newTicket.id
            })
        };

    } catch (error) {
        console.error('Reservation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Belső szerverhiba' })
        };
    }
};
