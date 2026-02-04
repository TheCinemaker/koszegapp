const { createClient } = require('@supabase/supabase-js');
const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/* -------------------- Configuration -------------------- */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
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
    const today = new Date();
    const yyyyMMdd = today.toISOString().split('T')[0];

    // Dates
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
            serialNumber, // Use the serial requested by Apple
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

        // Try to load from file system first if available (faster/safer)
        try {
            const icon = fs.readFileSync(path.resolve(__dirname, 'icon.png'));
            pass.addBuffer('icon.png', icon);
            pass.addBuffer('icon@2x.png', icon); // Use same for 2x if no separate file
        } catch (e) {
            // Fallback to fetch if file not found locally
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

    console.log('✅ Daily pass generated for update request.');
    return pass.getAsBuffer();
}


/* -------------------- Main Handler -------------------- */
exports.handler = async (event) => {
    const { httpMethod, path, headers, body } = event;

    // Log for debugging
    console.log(`WALLET SERVICE: ${httpMethod} ${path}`);

    // Use regex to match paths robustly
    // Apple calls: /v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}

    // 1️⃣ Device Registration (POST)
    if (httpMethod === 'POST' && path.match(/\/registrations\//)) {
        const parts = path.split('/');
        // path could be /v1/devices/... OR /.netlify/functions/wallet-service/v1/...
        // Let's find "devices" index
        const devicesIdx = parts.indexOf('devices');
        if (devicesIdx === -1) return { statusCode: 404, body: 'Invalid path' };

        const deviceLibraryIdentifier = parts[devicesIdx + 1];
        const registrationsIdx = parts.indexOf('registrations');
        const passTypeIdentifier = parts[registrationsIdx + 1];
        const serialNumber = parts[registrationsIdx + 2];

        const authToken = (headers.authorization || headers.Authorization || '').replace('ApplePass ', '');

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

        return { statusCode: 201, body: '' };
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

        const authToken = (headers.authorization || headers.Authorization || '').replace('ApplePass ', '');

        // Verify auth (optional but recommended)
        // For now, we trust the path + header existence to minimal standard

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

        const authToken = (headers.authorization || headers.Authorization || '').replace('ApplePass ', '');

        // 🔐 Check Auth
        const { data } = await supabase
            .from('wallet_devices')
            .select('auth_token')
            .eq('serial_number', serialNumber)
            .limit(1);
        // Note: devices might share serials for 'daily-subscription', so any valid token for this serial is OK?
        // Actually, strict Apple spec says: verify the auth token for *that* device/pass header.
        // Getting *any* record for serial is a weak check but allows "shared" subscription pass logic.
        // Better: verify authToken exists in DB for that serial.

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
                    'Last-Modified': new Date().toUTCString(), // Important for Apple caching
                    'Cache-Control': 'no-cache'
                },
                body: passBuffer.toString('base64'),
                isBase64Encoded: true
            };
        } catch (err) {
            console.error('Pass Gen Error:', err);
            return { statusCode: 500 };
        }
    }

    // 4️⃣ Log / Error
    if (httpMethod === 'POST' && path.match(/\/log/)) {
        console.error('CLIENT LOG:', body);
        return { statusCode: 200 };
    }

    return { statusCode: 404, body: 'Not found' };
};
// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

function extractFromP12(p12Buffer, password) {
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

    if (!key || !cert) throw new Error('Missing cert or key');
    return { key, cert };
}

async function getTodaysEvents() {
    try {
        const res = await fetch('https://koszegapp.netlify.app/.netlify/functions/get-github-json?path=public/data/events.json');
        if (!res.ok) return [];

        const events = await res.json();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        return events.filter(e => {
            const eventDate = e.date;
            const endDate = e.end_date || e.date;
            return eventDate <= today && endDate >= today;
        });
    } catch (e) {
        console.error('Failed to fetch events:', e);
        return [];
    }
}

async function generateUpdatedPass(serialNumber) {
    // 1. Fetch Events
    const todaysEvents = await getTodaysEvents();

    // 2. Determine Pass Content
    const today = new Date();
    const yyyyMMdd = today.toISOString().split('T')[0]; // "2026-02-04"

    // Logic: If there are events today, show "Napi Események"
    // If no events, show "Nincs ma esemény"

    // For the subscription pass, serialNumber is 'daily-subscription'
    // But we might want to version it? Apple handles versioning via Last-Modified header.
    // We will dynamically build the pass.

    /* ---------- Certificates ---------- */
    const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
    const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

    const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
    const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
    const wwdrPem = forge.pki.certificateToPem(wwdrCert);

    const { key, cert } = extractFromP12(p12Buffer, process.env.APPLE_PASS_P12_PASSWORD);

    /* ---------- Pass Creation ---------- */
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
            serialNumber: serialNumber,
            organizationName: 'Kőszeg Város',
            description: 'Ma Kőszegen – Frissítés',
            logoText: 'Ma Kőszegen',
            backgroundColor: 'rgb(33,150,243)',
            foregroundColor: 'rgb(255,255,255)',
            labelColor: 'rgb(187,222,251)',
            sharingProhibited: false,
            suppressStripShine: false
        }
    );

    pass.type = 'storeCard';

    // Title
    pass.primaryFields.push({
        key: 'title',
        label: '📍 MA KŐSZEGEN',
        value: todaysEvents.length > 0 ? `${todaysEvents.length} esemény` : 'Nincs ma esemény'
    });

    // Content
    if (todaysEvents.length > 0) {
        todaysEvents.slice(0, 3).forEach((e, idx) => {
            pass.auxiliaryFields.push({
                key: `event_${idx}`,
                label: e.time,
                value: e.name
            });
        });

        pass.backFields.push({
            key: 'todays_events',
            label: 'Mai részletek',
            value: todaysEvents.map(e => `${e.time} – ${e.name} (${e.location})`).join('\n')
        });
    } else {
        pass.secondaryFields.push({
            key: 'status',
            label: 'Info',
            value: 'Mára nincs kiemelt program.'
        });
    }

    // Images
    const SITE_URL = 'https://koszegapp.netlify.app';
    try {
        const iconRes = await fetch(`${SITE_URL}/images/apple-touch-icon.png`);
        const icon = await iconRes.buffer();
        pass.addBuffer('icon.png', icon);
        pass.addBuffer('icon@2x.png', icon);

        // Try getting logo locally first if possible to be faster, else fetch
        // Assuming local assets are simpler for now if available, but fetch is safer for consistency
        const logoRes = await fetch(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
        const logo = await logoRes.buffer();
        pass.addBuffer('logo.png', logo);
        pass.addBuffer('logo@2x.png', logo);
    } catch (e) {
        console.warn('Image fetch failed', e);
    }

    return pass.getAsBuffer();
}


/* -------------------- Main Router -------------------- */
exports.handler = async (event) => {
    // Generic router for incoming Netlify requests rewrited from /v1/*
    // event.path might be "/.netlify/functions/wallet-service/v1/devices/..."
    // or just "/v1/devices/..." depending on how rewrites pass it. 
    // Netlify typically passes the REWRITTEN path (/.netlify/functions/wallet-service), 
    // but the original path is often in headers or we need to parse it.

    // Actually, usually we rely on `event.path` matching the logical structure if we handle it manually.
    // But since we rewrite /v1/* -> /.../wallet-service, the function receives the request.

    const path = event.path.replace('/.netlify/functions/wallet-service', '');
    const method = event.httpMethod;

    console.log(`WALLET SERVICE: ${method} ${path}`);

    /* 
       ROUTING logic based on Apple Wallet Web Service Reference 
    */

    // 1. Register Device: POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (method === 'POST' && path.match(/\/v1\/devices\/.*\/registrations\/.*\/.*$/)) {
        return registerDevice(event, path);
    }

    // 2. Unregister Device: DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (method === 'DELETE' && path.match(/\/v1\/devices\/.*\/registrations\/.*\/.*$/)) {
        return unregisterDevice(event, path);
    }

    // 3. Get Pass: GET /v1/passes/{passTypeIdentifier}/{serialNumber}
    if (method === 'GET' && path.match(/\/v1\/passes\/.*\/.*$/)) {
        return getLatestPass(event, path);
    }

    // 4. Get Serial Numbers (Check for updates): GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
    // (Optional - triggered if we send a push but don't know what changed. We usually just send push.)
    if (method === 'GET' && path.match(/\/v1\/devices\/.*\/registrations\/.*$/)) {
        return getSerialNumbers(event, path);
    }

    // Log Error
    if (method === 'POST' && path.match(/\/v1\/log/)) {
        console.error('CLIENT LOG:', event.body);
        return { statusCode: 200, body: '' };
    }

    return { statusCode: 404, body: 'Not Found' };
};


/* -------------------- Handlers -------------------- */

async function registerDevice(event, pathUrl) {
    // /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
    const parts = pathUrl.split('/');
    const deviceId = parts[3];
    const passTypeId = parts[5];
    const serialNumber = parts[6];

    // Auth Header: ApplePass <authenticationToken>
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const authToken = authHeader.replace('ApplePass ', '');

    if (!authToken) return { statusCode: 401, body: 'Unauthorized' };

    const { pushToken } = JSON.parse(event.body);

    console.log(`Registering: ${deviceId} for ${serialNumber}`);

    // Insert/Update into Supabase
    const { error } = await supabase
        .from('wallet_devices')
        .upsert({
            device_library_identifier: deviceId,
            push_token: pushToken,
            pass_type_identifier: passTypeId,
            serial_number: serialNumber,
            auth_token: authToken,
            updated_at: new Date()
        }, { onConflict: 'device_library_identifier, pass_type_identifier, serial_number' });

    if (error) {
        console.error('Supabase Error:', error);
        return { statusCode: 500, body: 'Database Error' };
    }

    return { statusCode: 201, body: '' };
}

async function unregisterDevice(event, pathUrl) {
    // DELETE /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
    const parts = pathUrl.split('/');
    const deviceId = parts[3];
    const passTypeId = parts[5];
    const serialNumber = parts[6];

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const authToken = authHeader.replace('ApplePass ', '');

    if (!authToken) return { statusCode: 401, body: 'Unauthorized' };

    console.log(`Unregistering: ${deviceId}`);

    // Verify auth token matches (optional but good practice)
    // For simplicity, we just delete by ID match
    const { error } = await supabase
        .from('wallet_devices')
        .delete()
        .match({
            device_library_identifier: deviceId,
            pass_type_identifier: passTypeId,
            serial_number: serialNumber,
            auth_token: authToken // Security check
        });

    if (error) {
        console.error('Supabase Delete Error', error);
        return { statusCode: 500, body: 'Error' };
    }

    return { statusCode: 200, body: '' };
}

async function getLatestPass(event, pathUrl) {
    // GET /v1/passes/{passTypeId}/{serial}
    const parts = pathUrl.split('/');
    // parts[0] is empty, [1] v1, [2] passes, [3] type, [4] serial
    const passTypeId = parts[3];
    const serialNumber = parts[4];

    // Auth check
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const authToken = authHeader.replace('ApplePass ', '');
    // In a real generic system, we'd verify authToken against DB.
    // Since we only really have one pass "daily-subscription", we might skip strict DB check for GET
    // IF we trust the token or just generate it. 
    // Ideally: check DB if this serial/auth pair exists to validate request.

    if (!authToken) return { statusCode: 401, body: 'Unauthorized' };

    try {
        const passBuffer = await generateUpdatedPass(serialNumber);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Last-Modified': new Date().toUTCString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: passBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (e) {
        console.error('Pass Generation Error:', e);
        return { statusCode: 500, body: 'Internal Error' };
    }
}

async function getSerialNumbers(event, pathUrl) {
    // GET /v1/devices/{deviceId}/registrations/{passTypeId}?passesUpdatedSince=tag
    // Returns { lastUpdated: '...', serialNumbers: ['...'] }
    // Used if we don't send the serial in the push or if user missed pushes

    const parts = pathUrl.split('/');
    const deviceId = parts[3];
    const passTypeId = parts[5];

    const { passesUpdatedSince } = event.queryStringParameters || {};

    // Simple implementation: Always say "daily-subscription" is updated
    return {
        statusCode: 200,
        body: JSON.stringify({
            lastUpdated: new Date().toISOString(),
            serialNumbers: ['daily-subscription']
        })
    };
}
