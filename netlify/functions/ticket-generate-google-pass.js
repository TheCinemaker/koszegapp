import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
    const ticketId = event.queryStringParameters?.ticketId;

    if (!ticketId) {
        return { statusCode: 400, body: 'Ticket ID required' };
    }

    try {
        // Fetch ticket with event details
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
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return { statusCode: 404, body: 'Ticket not found' };
        }

        const eventData = ticket.ticket_events;
        const issuerId = process.env.GOOGLE_ISSUER_ID;
        const classId = process.env.GOOGLE_TICKET_CLASS_ID || process.env.GOOGLE_CLASS_ID || 'ticket';
        const objectId = `${issuerId}.${ticket.id.replace(/-/g, '_')}`;

        const claims = {
            iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: ['https://koszegapp.netlify.app'],
            payload: {
                eventTicketObjects: [
                    {
                        id: objectId,
                        classId: `${issuerId}.${classId}`,
                        state: 'ACTIVE',
                        barcode: {
                            type: 'QR_CODE',
                            value: ticket.qr_code_token || ticket.qr_token || ticket.id
                        },
                        ticketHolderName: ticket.buyer_name,
                        reservationId: ticket.id,
                        venue: {
                            name: eventData.location
                        },
                        dateTime: {
                            start: `${eventData.date}T${eventData.time}:00`
                        },
                        textModulesData: [
                            {
                                id: 'event_name',
                                header: 'ESEMÉNY',
                                body: eventData.name
                            },
                            {
                                id: 'guests',
                                header: 'VENDÉGEK',
                                body: `${ticket.guest_count} fő`
                            }
                        ]
                    }
                ]
            }
        };

        const token = jwt.sign(claims, process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), {
            algorithm: 'RS256'
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                saveUrl: `https://pay.google.com/gp/v/save/${token}`
            })
        };

    } catch (err) {
        console.error('Google Wallet generation error:', err);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
