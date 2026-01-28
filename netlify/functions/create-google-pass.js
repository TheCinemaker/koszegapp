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

        // CORRECT: Stable Object ID (1 User = 1 Pass)
        const objectId = `${issuerId}.${user_id.replace(/-/g, '_')}`;
        const fullClassId = `${issuerId}.${classId}`;

        // Construct the Google Wallet JWT Payload
        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            // CORRECT: Origins at root level
            origins: ['http://localhost:8888', 'http://localhost:3000', 'https://koszegapp.netlify.app'],
            payload: {
                websafeKeys: [],
                // CORRECT: Using LOYALTY OBJECTS (Matches standard LoyaltyClass)
                loyaltyObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        // No genericType needed for LoyaltyObject

                        accountName: full_name || 'Felhasználó',
                        accountId: user_id,
                        state: 'ACTIVE',

                        barcode: {
                            type: 'QR_CODE',
                            value: qr_token || user_id,
                            alternateText: qr_token || user_id
                        },

                        textModulesData: [
                            {
                                id: 'points',
                                header: 'Pontok',
                                body: (points || 0).toLocaleString()
                            },
                            {
                                id: 'rank',
                                header: 'Rang',
                                body: (card_type || 'Bronz').toUpperCase()
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
