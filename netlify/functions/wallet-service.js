const { createClient } = require('@supabase/supabase-js');
const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/* -------------------- Configuration -------------------- */
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

/* -------------------- Helpers -------------------- */

function startOfLocalDay(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

async function getTodaysEventsSafe() {
    try {
        const res = await fetch(
            'https://koszegapp.netlify.app/.netlify/functions/get-github-json?path=public/data/events.json'
        );
        if (!res.ok) throw new Error('Failed to fetch events');
        const events = await res.json();

        const start = startOfLocalDay();
        const end = endOfLocalDay();

        return events.filter(e => {
            if (!e.date) return false;
            const s = new Date(e.date);
            const eEnd = e.end_date ? new Date(e.end_date) : s;
            // Simple overlap check
            return s <= end && eEnd >= start;
        });
    } catch (e) {
        console.error('Error fetching events:', e);
        return [];
    }
}

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

/* -------------------- Daily Pass Generator -------------------- */
async function generateDailyPass(serialNumber) {
    const eventsToShow = await getTodaysEventsSafe();

    // Formatting
    const relevantDate = new Date();
    relevantDate.setHours(8, 0, 0, 0); // Updates at 8 AM relevance

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);
    expirationDate.setHours(0, 5, 0, 0); // Expire next day 00:05

    // Certificates
    const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
    const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

    const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
    const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
    const wwdrPem = forge.pki.certificateToPem(wwdrCert);

    const { key, cert } = extractKeys(p12Buffer, process.env.APPLE_PASS_P12_PASSWORD);

    // Create Pass
    const pass = new PKPass(
        {},
        {
            wwdr: wwdrPem,
            signerCert: cert,
            signerKey: key,
            signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
        },
        {
            formatVersion: 1,
            passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
            teamIdentifier: process.env.APPLE_TEAM_ID,
            serialNumber,
            organizationName: 'Kőszeg Város',
            description: 'KőszegAPP – Mai programok',
            backgroundColor: 'rgb(63,81,181)',
            foregroundColor: 'rgb(255,255,255)',
            labelColor: 'rgb(187,222,251)',
            logoText: 'Ma Kőszegen',
            relevantDate,
            expirationDate,
            sharingProhibited: false,
            suppressStripShine: false,
            userInfo: {
                city: 'Kőszeg',
                generatedAt: new Date().toISOString()
            }
        }
    );

    pass.type = 'eventTicket';

    // Primary Field
    pass.primaryFields.push({
        key: 'title',
        label: '📍 MA KŐSZEGEN',
        value: eventsToShow.length > 0 ? `${eventsToShow.length} esemény` : 'Nincs ma esemény'
    });

    // Secondary Fields (Events)
    if (eventsToShow.length > 0) {
        eventsToShow.slice(0, 5).forEach((e, i) => {
            pass.secondaryFields.push({
                key: `event_${i}`,
                label: e.time || 'Esemény',
                value: e.name
            });
        });
    } else {
        pass.secondaryFields.push({
            key: 'status',
            label: 'Infó',
            value: 'Mára nincs kiemelt program.'
        });
    }

    // Back Fields
    pass.backFields.push({
        key: 'details',
        label: 'Mai események részletesen',
        value: eventsToShow.length > 0
            ? eventsToShow.map(e => `${e.time} – ${e.name} (${e.location})`).join('\n\n')
            : 'Látogass el a visitkoszeg.hu oldalra további programokért.'
    });

    pass.backFields.push({
        key: 'source',
        label: 'Forrás',
        value: 'KőszegAPP'
    });

    // Images
    try {
        const SITE_URL = 'https://koszegapp.netlify.app';

        // Try to load from file system first to avoid recursion/network issues
        try {
            const icon = fs.readFileSync(path.resolve(__dirname, 'icon.png'));
            pass.addBuffer('icon.png', icon);
            pass.addBuffer('icon@2x.png', icon);
        } catch (e) {
            const iconRes = await fetch(`${SITE_URL}/images/apple-touch-icon.png`);
            const icon = await iconRes.buffer();
            pass.addBuffer('icon.png', icon);
            pass.addBuffer('icon@2x.png', icon);
        }

        try {
            const logo = fs.readFileSync(path.resolve(__dirname, 'logo.png'));
            pass.addBuffer('logo.png', logo);
            pass.addBuffer('logo@2x.png', logo);
        } catch (e) {
            const logoRes = await fetch(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            const logo = await logoRes.buffer();
            pass.addBuffer('logo.png', logo);
            pass.addBuffer('logo@2x.png', logo);
        }
    } catch (e) {
        console.warn('⚠️ Image load issue', e.message);
    }

    console.log('✅ Daily pass generated.');
    return pass.getAsBuffer();
}

/* -------------------- Main Handler -------------------- */
exports.handler = async (event) => {
    const { httpMethod, path, headers, body } = event;
    console.log(`WALLET SERVICE: ${httpMethod} ${path}`);

    // Robust path matching
    // Apple calls: /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}

    // 1️⃣ Device Registration (POST)
    if (httpMethod === 'POST' && path.match(/\/registrations\//)) {
        const parts = path.split('/');
        // find "devices" because path might include prefix
        const devicesIdx = parts.indexOf('devices');
        if (devicesIdx === -1) return { statusCode: 404, body: 'Invalid path' };

        const deviceLibraryIdentifier = parts[devicesIdx + 1];
        const registrationsIdx = parts.indexOf('registrations');
        const passTypeIdentifier = parts[registrationsIdx + 1];
        const serialNumber = parts[registrationsIdx + 2];

        // ApplePass <token>
        const authHeader = headers.authorization || headers.Authorization || '';
        const authToken = authHeader.replace(/^ApplePass\s+/i, '');

        if (!authToken) return { statusCode: 401 };

        let pushToken;
        try {
            const b = JSON.parse(body);
            pushToken = b.pushToken;
        } catch (e) {
            return { statusCode: 400, body: 'Invalid JSON' };
        }

        console.log(`📱 Registering device: ${deviceLibraryIdentifier}`);

        const { error } = await supabase.from('wallet_devices').upsert({
            device_library_identifier: deviceLibraryIdentifier,
            push_token: pushToken,
            pass_type_identifier: passTypeIdentifier,
            serial_number: serialNumber,
            auth_token: authToken,
            updated_at: new Date()
        }, { onConflict: 'device_library_identifier, pass_type_identifier, serial_number' });

        if (error) {
            console.error('Supabase Error:', error);
            return { statusCode: 500 };
        }

        return { statusCode: 201, body: '' }; // Empty body 201 Created
    }

    // 2️⃣ Device Unregistration (DELETE)
    if (httpMethod === 'DELETE' && path.match(/\/registrations\//)) {
        const parts = path.split('/');
        const devicesIdx = parts.indexOf('devices');
        if (devicesIdx === -1) return { statusCode: 404 };

        const deviceLibraryIdentifier = parts[devicesIdx + 1];
        const registrationsIdx = parts.indexOf('registrations');
        const passTypeIdentifier = parts[registrationsIdx + 1];
        const serialNumber = parts[registrationsIdx + 2];

        const authHeader = headers.authorization || headers.Authorization || '';
        const authToken = authHeader.replace(/^ApplePass\s+/i, '');

        if (!authToken) return { statusCode: 401 };

        const { error } = await supabase
            .from('wallet_devices')
            .delete()
            .match({
                device_library_identifier: deviceLibraryIdentifier,
                pass_type_identifier: passTypeIdentifier,
                serial_number: serialNumber
            });

        if (error) console.error('Supabase Delete Error:', error);

        console.log('🗑️ Device unregistered:', deviceLibraryIdentifier);
        return { statusCode: 200, body: '' };
    }

    // 3️⃣ Get Latest Pass (GET)
    if (httpMethod === 'GET' && path.match(/\/passes\//)) {
        const parts = path.split('/');
        const passesIdx = parts.indexOf('passes');
        const passTypeIdentifier = parts[passesIdx + 1];
        const serialNumber = parts[passesIdx + 2];

        const authHeader = headers.authorization || headers.Authorization || '';
        const authToken = authHeader.replace(/^ApplePass\s+/i, '');

        // 🔐 Validation
        const { data } = await supabase
            .from('wallet_devices')
            .select('auth_token')
            .eq('serial_number', serialNumber)
            .limit(1);

        // Security: check if ANY device has this serial+auth combo?
        // Or if the specific device requesting it has it?
        // GET /passes/ doesn't send deviceID in URL.
        // So we strictly check if the auth token is valid for the requested serial.
        if (!data || data.length === 0 || !data.some(d => d.auth_token === authToken)) {
            console.warn(`Unauthorized fetch attempt for ${serialNumber}`);
            return { statusCode: 401 };
        }

        try {
            const passBuffer = await generateDailyPass(serialNumber);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/vnd.apple.pkpass',
                    'Last-Modified': new Date().toUTCString(),
                    'Cache-Control': 'no-cache, no-store' // Apple needs fresh
                },
                body: passBuffer.toString('base64'),
                isBase64Encoded: true
            };
        } catch (err) {
            console.error('Pass Gen Error:', err);
            return { statusCode: 500 };
        }
    }

    // 4️⃣ Log
    if (httpMethod === 'POST' && path.match(/\/log/)) {
        console.error('CLIENT LOG:', body);
        return { statusCode: 200 };
    }

    return { statusCode: 404, body: 'Not found' };
};
