const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { user_id, full_name, points, card_type, qr_token } = JSON.parse(event.body);

        const objectId = `${process.env.GOOGLE_ISSUER_ID}.${user_id.replace(/-/g, '_')}`;
        const classId = `${process.env.GOOGLE_ISSUER_ID}.${process.env.GOOGLE_CLASS_ID}`;

        const claims = {
            iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            aud: 'google',
            typ: 'savetowallet',
            iat: Math.floor(Date.now() / 1000),
            origins: ['https://koszegapp.netlify.app'], // User requested exact match to this structure
            payload: {
                loyaltyObjects: [
                    {
                        id: objectId,
                        classId,
                        accountName: full_name || 'Felhasználó',
                        accountId: user_id,
                        state: 'ACTIVE',
                        barcode: {
                            type: 'QR_CODE',
                            value: qr_token || user_id
                        },
                        textModulesData: [
                            { id: 'points', header: 'Pontok', body: String(points || 0) },
                            { id: 'rank', header: 'Rang', body: (card_type || 'Bronz').toUpperCase() }
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
            body: JSON.stringify({
                saveUrl: `https://pay.google.com/gp/v/save/${token}`
            })
        };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'Wallet generation failed' };
    }
};
