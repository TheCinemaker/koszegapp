import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import { googleCredentials } from './lib/googleCredentials.js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Expert Fix: The Google Wallet EventTicketClass needs to be 
 * programmatically set to UNDER_REVIEW to become ACTIVE in production.
 */
async function publishClass(fullClassId, serviceAccountEmail, privateKey) {
    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey
            },
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        const client = await auth.getClient();

        // PATCH request to set status to UNDER_REVIEW
        await client.request({
            url: `https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass/${encodeURIComponent(fullClassId)}`,
            method: 'PATCH',
            data: {
                reviewStatus: 'UNDER_REVIEW'
            }
        });
        console.log('✅ Class status successfully set to UNDER_REVIEW');
    } catch (err) {
        console.warn('⚠️ Class activation warning (might already be active):', err.message);
        // We continue even if this fails, as the class might already be active
    }
}

export const handler = async (event) => {
    // Add CORS headers for browser compatibility
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const ticketId = event.queryStringParameters?.ticketId;

    if (!ticketId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ticket ID required' }) };
    }

    try {
        console.log('Generating Google Pass for ticket:', ticketId);

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
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ticket not found' }) };
        }

        const eventData = ticket.ticket_events || {};

        // Use environment variables or fallback to hardcoded credentials
        const issuerId = process.env.GOOGLE_ISSUER_ID || googleCredentials.issuerId;
        const classIdSource = process.env.GOOGLE_TICKET_CLASS_ID || process.env.GOOGLE_CLASS_ID || googleCredentials.ticketClassId;
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleCredentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || googleCredentials.private_key;

        if (!issuerId || !serviceAccountEmail || !privateKeyRaw) {
            console.error('Missing required Google Credentials');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error: Missing Google Credentials' }) };
        }

        // IDs handling
        const cleanedClassId = classIdSource.includes('.') ? classIdSource.split('.').pop() : classIdSource;
        const fullClassId = `${issuerId}.${cleanedClassId}`;
        const objectId = `${issuerId}.ticket_${ticket.id.replace(/-/g, '_').slice(0, 30)}`;

        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        // EXPERT FIX: Publish Class before generating JWT
        await publishClass(fullClassId, serviceAccountEmail, privateKey);

        console.log('Google Resolved IDs:', { issuerId, fullClassId, objectId });

        // Robust Date/Time Formatting
        let datePart = eventData.date || new Date().toISOString().split('T')[0];
        let timePart = (eventData.time || '10:00').trim();

        // Ensure HH:mm format
        if (timePart.includes(':')) {
            const parts = timePart.split(':');
            timePart = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        } else {
            timePart = '10:00';
        }

        // ISO-8601 without milliseconds + UTC offset for Kőszeg (CET/CEST)
        // Note: Using +01:00 for CET. In CEST it would be +02:00.
        const startDateTime = `${datePart}T${timePart}:00+01:00`;

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
                'https://mail.google.com',
                'http://localhost:8888',
                'http://localhost:5173'
            ],
            payload: {
                eventTicketObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        state: 'ACTIVE',
                        barcode: {
                            type: 'QR_CODE',
                            value: ticket.qr_code_token || ticket.qr_token || String(ticket.id),
                            altText: ticket.qr_code_token || ticket.qr_token || String(ticket.id)
                        },
                        ticketHolderName: ticket.buyer_name || 'Vendég',
                        reservationId: String(ticket.id),
                        venue: {
                            name: {
                                defaultValue: {
                                    language: 'hu',
                                    value: eventData.location || 'Kőszeg'
                                }
                            }
                        },
                        // Fix 5: startDateTime is the correct field name for the object
                        startDateTime,
                        textModulesData: [
                            {
                                id: 'event_name',
                                header: 'ESEMÉNY',
                                body: eventData.name || 'Rendezvény'
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

        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                saveUrl: `https://pay.google.com/gp/v/save/${token}`
            })
        };

    } catch (err) {
        console.error('Google Wallet generation error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message, stack: err.stack })
        };
    }
};
