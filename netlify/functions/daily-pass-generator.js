const { createClient } = require('@supabase/supabase-js');
const http2 = require('http2');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/*
  DAILY PASS UPDATER (PUSH NOTIFICATION SENDER)
  
  Runs every morning at 6 AM (Netlify scheduled function).
  Instead of generating a static file, this function:
  1. Fetches all registered wallet devices from Supabase.
  2. Connects to Apple Push Notification Service (APNs) via HTTP/2.
  3. Sends a "wakeup" push to each device.
  
  The devices will then background-fetch the new pass from:
  GET /v1/passes/... (handled by wallet-service.js)
*/

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

/* -------------------- Cert Helpers -------------------- */
function extractKeys(p12Buffer, password) {
    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

    let key = null;
    let cert = null;

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    if (certBags[forge.pki.oids.certBag]?.[0]) {
        cert = forge.pki.certificateToPem(certBags[forge.pki.oids.certBag][0].cert);
    }

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]) {
        key = forge.pki.privateKeyToPem(
            keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key
        );
    }

    if (!key || !cert) throw new Error('Missing cert or key in P12');
    return { key, cert };
}

/* -------------------- APNs Helper -------------------- */
async function sendPushBatch(tokens, cert, key) {
    if (tokens.length === 0) return 0;

    console.log(`🚀 连接 APNs... Sending to ${tokens.length} devices.`);

    const client = http2.connect('https://api.push.apple.com', {
        key: key,
        cert: cert
    });

    client.on('error', (err) => console.error('APNs Client Error:', err));

    let successCount = 0;
    const promises = tokens.map(token => {
        return new Promise((resolve) => {
            const req = client.request({
                ':method': 'POST',
                ':path': `/3/device/${token}`,
                'apns-topic': process.env.APPLE_PASS_TYPE_ID
            });

            req.on('response', (headers) => {
                const status = headers[':status'];
                if (status === 200) {
                    successCount++;
                    // console.log(`✅ Push sent to ${token.substring(0, 5)}...`);
                } else {
                    console.warn(`⚠️ Push failed for ${token.substring(0, 5)}... Status: ${status}`);
                    // If 410 (Gone), we should ideally remove from DB, but keeping it simple for now.
                }
                resolve();
            });

            req.on('error', (err) => {
                console.error(`❌ Request error for ${token}:`, err);
                resolve();
            });

            // Send empty JSON payload for Wallet updates
            req.write(JSON.stringify({}));
            req.end();
        });
    });

    await Promise.all(promises);

    // Close client after short delay to ensure all streams finished
    await new Promise(r => setTimeout(r, 1000));
    client.close();

    return successCount;
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    try {
        console.log('🌅 Daily Pass Auto-Updater Started');

        // 1. Get all registered devices
        // We only need the push_token. Grouping by push_token to avoid duplicates if same device registered multiple times (shouldn't happen due to DB validation but good practice)
        const { data: devices, error } = await supabase
            .from('wallet_devices')
            .select('push_token');

        if (error) throw new Error(`Supabase query failed: ${error.message}`);

        if (!devices || devices.length === 0) {
            console.log('No devices registered. Exiting.');
            return { statusCode: 200, body: 'No devices' };
        }

        // Unique tokens
        const tokens = [...new Set(devices.map(d => d.push_token))];
        console.log(`Found ${tokens.length} unique devices to update.`);

        // 2. Load Certificates
        const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
        const { key, cert } = extractKeys(p12Buffer, process.env.APPLE_PASS_P12_PASSWORD);

        // 3. Send Pushes
        const sentCount = await sendPushBatch(tokens, cert, key);

        console.log(`✅ Finished. Sent ${sentCount}/${tokens.length} pushes.`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Push notifications sent',
                total: tokens.length,
                successful: sentCount
            })
        };

    } catch (err) {
        console.error('DAILY UPDATE ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
