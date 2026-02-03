const https = require('https');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

/*
  This function triggers Apple to update passes on user devices.
  
  Usage:
  POST /.netlify/functions/trigger-pass-update
  Body: { "eventId": "event-123" }
  
  Apple will then call our pass-update.js endpoint to fetch the latest pass data.
*/

/* -------------------- Apple Push Auth (JWT) -------------------- */

function createApplePushJWT() {
    /*
      Required environment variables:
      - APPLE_TEAM_ID
      - APPLE_PASS_TYPE_ID
      - APPLE_PUSH_KEY_ID
      - APPLE_PUSH_PRIVATE_KEY (PEM string or file path)
    */

    let privateKey;

    // Try to load from file first (more reliable), then from env variable
    const keyPath = path.resolve(__dirname, 'certs/AuthKey_54DA92K9DB.p8');
    if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath, 'utf8');
    } else if (process.env.APPLE_PUSH_PRIVATE_KEY) {
        // Fix escaped newlines in env variable (e.g., "\\n" -> actual newline)
        privateKey = process.env.APPLE_PUSH_PRIVATE_KEY.replace(/\\n/g, '\n');
    } else {
        throw new Error('APPLE_PUSH_PRIVATE_KEY not found in certs/AuthKey_54DA92K9DB.p8 or env');
    }

    // Ensure the key is properly formatted
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid private key format. Must be a valid PEM key.');
    }

    return jwt.sign(
        {
            iss: process.env.APPLE_TEAM_ID
        },
        privateKey,
        {
            algorithm: 'ES256',
            expiresIn: '1h',
            keyid: process.env.APPLE_PUSH_KEY_ID
        }
    );
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { eventId } = JSON.parse(event.body);
        if (!eventId) throw new Error('Missing eventId');

        /*
          Apple Wallet Push Service doesn't push to individual users.
          It notifies ALL devices that have this pass installed.
          Apple handles the distribution automatically.
        */

        const token = createApplePushJWT();

        const options = {
            hostname: 'api.push.apple.com',
            path: `/3/device/${encodeURIComponent(eventId)}`,
            method: 'POST',
            headers: {
                authorization: `bearer ${token}`,
                'apns-topic': process.env.APPLE_PASS_TYPE_ID,
                'content-length': 0
            }
        };

        await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        reject(
                            new Error(`Apple Push failed with status ${res.statusCode}: ${data}`)
                        );
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'ok',
                message: `Wallet update triggered for event ${eventId}`,
                timestamp: new Date().toISOString()
            })
        };

    } catch (err) {
        console.error('TRIGGER PASS UPDATE ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message,
                hint: 'Make sure APPLE_PUSH_KEY_ID and APPLE_PUSH_PRIVATE_KEY are set in Netlify env'
            })
        };
    }
};
