// Ticket System - QR Code Validator
// Validates and marks tickets as used

import { ticketConfig } from './lib/ticketConfig.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
        const { qrCodeToken } = JSON.parse(event.body);

        if (!qrCodeToken) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'invalid',
                    message: 'QR kód hiányzik'
                })
            };
        }

        // Find ticket by QR token
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
        *,
        ticket_events (
          name,
          date,
          time,
          location
        )
      `)
            .eq('qr_token', qrCodeToken)
            .single();

        if (ticketError || !ticket) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'not_found',
                    message: 'Érvénytelen QR kód'
                })
            };
        }

        // Check if already used all entries
        const entriesAllowed = ticket.ticket_events.entries_allowed || 1;
        const entriesUsed = ticket.entries_used || 0;

        if (entriesUsed >= entriesAllowed) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'already_used',
                    message: 'Ez a jegy már minden alkalommal fel lett használva',
                    usedAt: ticket.used_at,
                    ticket: {
                        buyerName: ticket.buyer_name,
                        eventName: ticket.ticket_events.name,
                        guestCount: ticket.guest_count
                    }
                })
            };
        }

        // Check if paid
        if (ticket.status !== 'paid' && ticket.status !== 'used') { // 'used' is valid if we still have entries
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'not_paid',
                    message: 'Ez a jegy nics kifizetve vagy érvénytelenített'
                })
            };
        }

        // Mark as used (increment counter)
        const newEntriesUsed = entriesUsed + 1;
        const newStatus = newEntriesUsed >= entriesAllowed ? 'used' : 'paid';

        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                status: newStatus,
                entries_used: newEntriesUsed,
                used_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

        if (updateError) {
            console.error('Error updating ticket:', updateError);
            throw updateError;
        }

        // Return success
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                status: 'validated',
                message: entriesAllowed > 1
                    ? `Jegy érvényesítve (${newEntriesUsed}/${entriesAllowed}) - Beléphet!`
                    : 'Jegy érvényesítve - Beléphet!',
                ticket: {
                    buyerName: ticket.buyer_name,
                    eventName: ticket.ticket_events.name,
                    guestCount: ticket.guest_count,
                    validatedAt: new Date().toISOString(),
                    entriesLeft: entriesAllowed - newEntriesUsed
                }
            })
        };

    } catch (error) {
        console.error('Validation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                valid: false,
                status: 'error',
                message: 'Hiba történt az érvényesítés során'
            })
        };
    }
};
