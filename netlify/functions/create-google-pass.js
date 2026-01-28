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

        // Generate a random suffix to ensure unique Object ID for every attempt (Prevent "Object already exists" error)
        const randomSuffix = Math.floor(Math.random() * 100000);
        const objectId = `${issuerId}.${user_id.replace(/-/g, '_')}_${randomSuffix}`;
        const fullClassId = `${issuerId}.${classId}`; // Unique Class ID

        // Construct the Google Wallet JWT Payload
        // Best Practice: ONLY define the Object. The Class must exist beforehand.
        const claims = {
            iss: serviceAccountEmail,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            payload: {
                websafeKeys: [],
                origins: ['http://localhost:8888', 'http://localhost:3000', 'https://koszegapp.netlify.app'],

                // DEFINE THE OBJECT ONLY
                genericObjects: [
                    {
                        id: objectId,
                        classId: fullClassId,
                        genericType: 'GENERIC_TYPE_LOYALTY', // User requested LOYALTY type
                        hexBackgroundColor: '#311b92',
                        logo: {
                            sourceUri: {
                                uri: 'https://placehold.co/192x192.png'
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
                                id: 'points', // Matches template fieldPath: "object.textModulesData['points']"
                                header: 'Pontok',
                                body: (points || 0).toLocaleString()
                            },
                            {
                                id: 'rank', // Matches template fieldPath: "object.textModulesData['rank']"
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
