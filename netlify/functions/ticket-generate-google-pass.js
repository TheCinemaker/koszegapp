import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import { googleCredentials } from './lib/googleCredentials.js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Premium Update: PATCH the class with better branding
 */
async function publishClass(fullClassId, serviceAccountEmail, privateKey) {
    // Optimization: In production, we skip this if not forced.
    // In dev/staging OR if forced, we update branding.
    const isProd = process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
    if (isProd && !process.env.FORCE_WALLET_PUBLISH) {
        console.log('Skipping class publish in production (already active)');
        return;
    }

    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey
            },
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        const client = await auth.getClient();

        await client.request({
            url: `https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass/${encodeURIComponent(fullClassId)}`,
            method: 'PATCH',
            data: {
                reviewStatus: 'UNDER_REVIEW',
                hexBackgroundColor: '#2788C9', // KőszegApp Blue
                logo: {
                    sourceUri: {
                        uri: 'https://koszegapp.netlify.app/assets/images/wallet/koszeg_logo_minimal.png'
                    }
                }
            }
        });
        console.log('✅ Google Wallet Class activated and branded successfully');
    } catch (err) {
        console.warn('⚠️ Class activation warning:', err.message);
    }
}

export const handler = async (event) => {
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

        const issuerId = process.env.GOOGLE_ISSUER_ID || googleCredentials.issuerId;
        const classIdSource = process.env.GOOGLE_TICKET_CLASS_ID || process.env.GOOGLE_CLASS_ID || googleCredentials.ticketClassId;
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleCredentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || googleCredentials.private_key;

        const cleanedClassId = classIdSource.includes('.') ? classIdSource.split('.').pop() : classIdSource;
        const fullClassId = `${issuerId}.${cleanedClassId}`;
        const objectId = `${issuerId}.ticket_${ticket.id.replace(/-/g, '_').slice(0, 30)}`;

        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        // Optimzed Class Publish
        await publishClass(fullClassId, serviceAccountEmail, privateKey);

        // Date/Time
        let datePart = eventData.date || new Date().toISOString().split('T')[0];
        let timePart = (eventData.time || '10:00').trim();
        if (timePart.includes(':')) {
            const parts = timePart.split(':');
            timePart = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        } else {
            timePart = '10:00';
        }
        const startDateTimeStr = `${datePart}T${timePart}:00+01:00`;

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
                'https://mail.google.com'
            ],
            payload: {
                eventTicketObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        state: 'ACTIVE',

                        // Minimalist Hero Image (Kőszeg Skyline)
                        heroImage: {
                            sourceUri: {
                                uri: 'https://koszegapp.netlify.app/assets/images/wallet/koszeg_skyline.png'
                            }
                        },

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

                        startDateTime: startDateTimeStr,

                        textModulesData: [
                            {
                                id: 'event_name',
                                header: 'ESEMÉNY',
                                body: eventData.name || 'Program'
                            },
                            {
                                id: 'date_time',
                                header: 'IDŐPONT',
                                body: `${eventData.date || ''} ${eventData.time || ''}`
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
            statusCode: 302,
            headers: {
                'Location': `https://pay.google.com/gp/v/save/${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
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
