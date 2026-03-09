import jwt from 'jsonwebtoken';
import { GoogleAuth } from 'google-auth-library';
import { googleCredentials } from './lib/googleCredentials.js';

/**
 * Ensures the Event Ticket Class exists/is updated
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

        // We use eventTicketClass for event reminders too
        await client.request({
            url: `https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass/${encodeURIComponent(fullClassId)}`,
            method: 'PATCH',
            data: {
                reviewStatus: 'UNDER_REVIEW',
                hexBackgroundColor: '#2788C9', // KőszegApp Blue
                logo: {
                    sourceUri: {
                        uri: 'https://koszegapp.netlify.app/images/koeszeg_logo_1.png'
                    }
                },
                heroImage: {
                    sourceUri: {
                        uri: 'https://koszegapp.netlify.app/assets/images/wallet/koszeg_skyline.png'
                    }
                }
            }
        });
        console.log('✅ Google Wallet Event Class updated');
    } catch (err) {
        console.warn('⚠️ Class activation warning (might already exist):', err.message);
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

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const eventData = JSON.parse(event.body);
        const { id, name, date, time, location } = eventData;

        if (!id || !name) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing event data' }) };
        }

        const issuerId = process.env.GOOGLE_ISSUER_ID || googleCredentials.issuerId;
        const classIdSource = process.env.GOOGLE_TICKET_CLASS_ID || googleCredentials.ticketClassId;
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleCredentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || googleCredentials.private_key;

        const cleanedClassId = classIdSource.includes('.') ? classIdSource.split('.').pop() : classIdSource;
        const fullClassId = `${issuerId}.${cleanedClassId}`;

        // Object ID for this specific event reminder (prefixed to avoid collision with actual tickets)
        const objectId = `${issuerId}.reminder_${id.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;

        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        // Optional: Ensure class is ok
        await publishClass(fullClassId, serviceAccountEmail, privateKey);

        // Date/Time ISO 8601
        let startDateTime = null;
        if (date && time) {
            try {
                // Assuming Central European Time (CET/CEST) UTC+1
                startDateTime = `${date}T${time.trim().split('-')[0].padStart(5, '0')}:00+01:00`;
            } catch (e) {
                console.warn('Date parsing issue', e);
            }
        }

        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: ['https://koszegapp.netlify.app', 'https://koszegapp.hu', 'https://visitkoszeg.hu'],
            payload: {
                eventTicketObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        state: 'ACTIVE',

                        // Identification (No Barcode for simple reminders to avoid confusion with tickets)
                        // barcode: { ... } - OMITTED

                        venue: {
                            name: {
                                defaultValue: {
                                    language: 'hu',
                                    value: location || 'Kőszeg'
                                }
                            }
                        },

                        startDateTime: startDateTime,

                        textModulesData: [
                            {
                                id: 'event_title',
                                header: 'PROGRAM',
                                body: name
                            },
                            {
                                id: 'event_info',
                                header: 'IDŐPONT',
                                body: `${date || ''} ${time || ''}`
                            }
                        ],

                        // Links for more info
                        linksModuleData: {
                            uris: [
                                {
                                    uri: `https://koszegapp.netlify.app/events/${id}`,
                                    description: 'Esemény megnyitása az alkalmazásban'
                                }
                            ]
                        }
                    }
                ]
            }
        };

        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
        const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: saveUrl })
        };

    } catch (err) {
        console.error('Google Event Pass Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
