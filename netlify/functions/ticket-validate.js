// Ticket System - QR Code Validator
// Validates and marks tickets as used

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
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

        // Check if already used
        if (ticket.status === 'used') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'already_used',
                    message: 'Ez a jegy már fel lett használva',
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
        if (ticket.status !== 'paid') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    status: 'not_paid',
                    message: 'Ez a jegy még nincs kifizetve'
                })
            };
        }

        // Mark as used
        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                status: 'used',
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
                message: 'Jegy érvényesítve - Beléphet!',
                ticket: {
                    buyerName: ticket.buyer_name,
                    eventName: ticket.ticket_events.name,
                    guestCount: ticket.guest_count,
                    validatedAt: new Date().toISOString()
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
