require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');
// Using native Node.js fetch (Node 18+)

async function createClass() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
    const issuerId = process.env.GOOGLE_ISSUER_ID;
    const classId = process.env.GOOGLE_CLASS_ID;

    if (!serviceAccountEmail || !privateKey || !issuerId || !classId) {
        console.error('❌ Missing environment variables. Check .env file.');
        process.exit(1);
    }

    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        const client = await auth.getClient();
        const token = await client.getAccessToken();

        const fullClassId = `${issuerId}.${classId}`;

        const classPayload = {
            id: fullClassId,
            issuerName: "KőszegApp",
            reviewStatus: "UNDER_REVIEW",
            programName: "KőszegPass",
            programLogo: {
                sourceUri: { uri: "https://placehold.co/192x192.png" }
            },
            hexBackgroundColor: "#311b92",
            heroImage: {
                sourceUri: { uri: "https://placehold.co/1032x336.png" } // Optional hero
            },
            classTemplateInfo: {
                cardTemplateOverride: {
                    cardRowTemplateInfos: [
                        {
                            twoItems: {
                                startItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['points']" }] } },
                                endItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['rank']" }] } }
                            }
                        }
                    ]
                }
            }
        };

        console.log(`Connecting to Google Wallet API to create class: ${fullClassId}...`);

        const response = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(classPayload),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Class created successfully!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log(`⚠️ Request failed with status ${response.status}`);

            if (response.status === 409) {
                console.log('ℹ️ Class likely already exists. Trying to update...');
                // Optional: Implement update logic if needed, or just warn.
                // For now, if it exists, that's good enough for us.
                const updateResponse = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${fullClassId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(classPayload),
                });
                if (updateResponse.ok) {
                    const data = await updateResponse.json();
                    console.log('✅ Class updated successfully!');
                } else {
                    console.error('❌ Update failed:', await updateResponse.text());
                }

            } else {
                console.error('❌ API Error:', errorText);
            }
        }

    } catch (error) {
        console.error('❌ Script execution error:', error);
    }
}

createClass();
