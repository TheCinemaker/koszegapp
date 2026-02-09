const { GoogleAuth } = require('google-auth-library');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Make it a POST' };
    }

    try {
        const { user_id, points, card_type } = JSON.parse(event.body);

        if (!user_id) {
            return { statusCode: 400, body: 'Missing user_id' };
        }

        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
        const issuerId = process.env.GOOGLE_ISSUER_ID;

        if (!serviceAccountEmail || !privateKey || !issuerId) {
            console.error('Missing Google Wallet environment variables');
            return { statusCode: 500, body: 'Server config error' };
        }

        const objectId = `${issuerId}.${user_id.replace(/-/g, '_')}`;

        console.log(`Updating Google Wallet Object: ${objectId} with points: ${points}`);

        const auth = new GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        const client = await auth.getClient();
        const token = await client.getAccessToken();

        // PATCH request to update the LoyaltyObject
        // We only send the fields we want to update (textModulesData)
        const patchBody = {
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
        };

        // Note: Node 18+ has native fetch. If on older node, might need node-fetch.
        // Netlify usually runs Node 18 or 20 now.
        const response = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchBody),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Loyalty Object updated successfully');
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, data })
            };
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to update Loyalty Object:', errorText);
            // If 404, it means the user hasn't added the pass yet. That's fine, we just ignore it.
            if (response.status === 404) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Pass not found (user likely has not added it yet)' }) };
            }
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorText })
            };
        }

    } catch (error) {
        console.error('❌ Update function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update pass' }),
        };
    }
};
