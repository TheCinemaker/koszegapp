import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { googleCredentials } from './lib/googleCredentials.js';

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
        console.log('Ticket ID:', ticketId);

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
            console.error('Ticket fetch error:', ticketError);
            return { statusCode: 404, body: 'Ticket not found' };
        }

        console.log('Ticket found:', ticket.id);

        const eventData = ticket.ticket_events;

        const issuerId = process.env.GOOGLE_ISSUER_ID || googleCredentials.issuerId;
        const classIdSource = process.env.GOOGLE_TICKET_CLASS_ID || process.env.GOOGLE_CLASS_ID || googleCredentials.ticketClassId;
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleCredentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || googleCredentials.private_key;

        if (!issuerId || !serviceAccountEmail || !privateKeyRaw) {
            console.error('Missing required Google Credentials');
            return { statusCode: 500, body: 'Server configuration error: Missing Google Credentials' };
        }

        // FIX 1: Duplikált objectId eltávolítva – csak egyszer van deklarálva
        const cleanedClassId = classIdSource.includes('.') ? classIdSource.split('.').pop() : classIdSource;
        const fullClassId = `${issuerId}.${cleanedClassId}`;
        const objectId = `${issuerId}.ticket_${ticket.id.replace(/-/g, '_').slice(0, 30)}`;

        console.log('Google Resolved IDs:', { issuerId, fullClassId, objectId });

        // FIX 2: Helyes ISO dátum magyar időzónával
        const startDateTime = new Date(`${eventData.date}T${eventData.time || '10:00'}:00+01:00`).toISOString();

        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: [
                'https://koszegapp.netlify.app',
                'https://www.koszegapp.hu',
                'https://koszegapp.hu',
                'https://visitkoszeg.hu',
                'https://www.visitkoszeg.hu',
                'http://localhost:8888',
                'http://localhost:5173'
            ],
            payload: {
                eventTicketObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        state: 'ACTIVE',

                        // FIX 3: Helyes barcode struktúra + altText
                        barcode: {
                            type: 'QR_CODE',
                            value: ticket.qr_code_token || ticket.qr_token || String(ticket.id),
                            altText: ticket.qr_code_token || ticket.qr_token || String(ticket.id)
                        },

                        ticketHolderName: ticket.buyer_name || 'Vendég',
                        reservationId: String(ticket.id),

                        // FIX 4: Helyes venue struktúra (localizedValue szükséges)
                        venue: {
                            name: {
                                defaultValue: {
                                    language: 'hu',
                                    value: eventData.location || 'Kőszeg'
                                }
                            }
                        },

                        // FIX 5: dateTime → startDateTime (helyes mező név)
                        startDateTime,

                        textModulesData: [
                            {
                                id: 'event_name',
                                header: 'ESEMÉNY',
                                body: eventData.name || ''
                            },
                            {
                                id: 'guests',
                                header: 'VENDÉGEK',
                                body: `${ticket.guest_count || 1} fő`
                            }
                        ]
                    }
                ]
            }
        };

        // FIX 6: Private key \\n → \n csere (Netlify env var miatt szükséges)
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                saveUrl: `https://pay.google.com/gp/v/save/${token}`
            })
        };

    } catch (err) {
        console.error('Google Wallet generation error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message, stack: err.stack })
        };
    }
};
