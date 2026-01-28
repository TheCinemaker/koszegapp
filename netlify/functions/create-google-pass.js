const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { user_id, full_name, points, card_type, qr_token } = JSON.parse(event.body);

        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
        const issuerId = process.env.GOOGLE_ISSUER_ID;
        const classId = process.env.GOOGLE_CLASS_ID;

        if (!serviceAccountEmail || !privateKey || !issuerId || !classId) {
            console.error('Missing Google Wallet environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing Wallet credentials' }),
            };
        }

        const objectId = `${issuerId}.${user_id.replace(/-/g, '_')}`; // Sanitize ID

        // Construct the Google Wallet JWT Payload
        // See: https://developers.google.com/wallet/generic/web
        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            // origin: 'https://koszegapp.netlify.app', // Optional: secure origin
            payload: {
                websafeKeys: [],
                genericObjects: [
                    {
                        id: objectId,
                        classId: `${issuerId}.${classId}`,
                        genericType: 'GENERIC_TYPE_UNSPECIFIED',
                        hexBackgroundColor: '#311b92', // Match Diamant/Blue theme roughly
                        logo: {
                            sourceUri: {
                                uri: 'https://koszegapp.netlify.app/icon-192.png' // Use app icon as logo
                            }
                        },
                        cardTitle: {
                            defaultValue: {
                                language: 'hu',
                                value: 'KőszegPass'
                            }
                        },
                        header: {
                            defaultValue: {
                                language: 'hu',
                                value: full_name || 'Felhasználó'
                            }
                        },
                        barcode: {
                            type: 'QR_CODE',
                            value: qr_token || user_id,
                            alternateText: qr_token || user_id
                        },
                        textModulesData: [
                            {
                                header: 'Pontok',
                                body: (points || 0).toLocaleString(),
                                id: 'points'
                            },
                            {
                                header: 'Rang',
                                body: (card_type || 'Bronz').toUpperCase(),
                                id: 'rank'
                            }
                        ]
                    }
                ]
            }
        };

        const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
        const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

        return {
            statusCode: 200,
            body: JSON.stringify({ saveUrl }),
        };

    } catch (error) {
        console.error('Error generating Google Pass:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate pass' }),
        };
    }
};
