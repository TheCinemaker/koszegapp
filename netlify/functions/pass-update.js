const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/* -------------------- Helpers -------------------- */

async function getEventById(eventId) {
    // Fetch from our existing GitHub JSON API
    const res = await fetch('https://koszegapp.netlify.app/.netlify/functions/get-github-json?path=public/data/events.json');
    if (!res.ok) throw new Error('Failed to fetch events');

    const events = await res.json();
    const event = events.find(e => e.id === eventId);

    if (!event) throw new Error('Event not found');
    return event;
}

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

function getEventPalette(tags = []) {
    const t = tags.map(v => v.toLowerCase());

    if (t.includes('bál')) {
        return { bg: 'rgb(88,24,69)', fg: 'rgb(255,255,255)', label: 'rgb(255,215,0)' };
    }
    if (t.includes('koncert')) {
        return { bg: 'rgb(32,32,64)', fg: 'rgb(255,255,255)', label: 'rgb(255,105,180)' };
    }
    if (t.includes('gyerek')) {
        return { bg: 'rgb(255,235,59)', fg: 'rgb(33,33,33)', label: 'rgb(0,150,136)' };
    }
    return { bg: 'rgb(63,81,181)', fg: 'rgb(255,255,255)', label: 'rgb(200,200,255)' };
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    try {
        // Apple calls this endpoint with path params
        // Format: GET /v1/passes/{passTypeIdentifier}/{serialNumber}
        const pathParts = event.path.split('/');
        const serialNumber = pathParts[pathParts.length - 1];
        const passTypeIdentifier = pathParts[pathParts.length - 2];

        if (passTypeIdentifier !== process.env.APPLE_PASS_TYPE_ID) {
            return { statusCode: 401, body: 'Invalid passTypeIdentifier' };
        }

        /* 🔐 Auth token check */
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const token = authHeader.replace('ApplePass ', '');

        if (!token || Buffer.from(serialNumber).toString('base64') !== token) {
            return { statusCode: 401, body: 'Invalid authentication token' };
        }

        /* 📦 Load event data */
        const eventData = await getEventById(serialNumber);

        const {
            name,
            date,
            time,
            location,
            coords,
            description,
            tags = [],
            highlightLabel
        } = eventData;

        /* ⏱️ Time calculations */
        const eventDate = new Date(`${date}T${time}:00+01:00`);
        const expirationDate = new Date(eventDate);
        expirationDate.setDate(expirationDate.getDate() + 1);

        const now = new Date();
        const diffMinutes = Math.round((eventDate - now) / 60000);

        let relevantText = `Ma ${time} – ${name}`;
        if (diffMinutes <= 60 && diffMinutes > 0) {
            relevantText = `⏰ ${diffMinutes} perc múlva kezdődik`;
        }
        if (diffMinutes <= 0 && diffMinutes > -180) {
            relevantText = `🎉 Most zajlik – jó szórakozást!`;
        }

        const colors = getEventPalette(tags);

        // Dynamic color shift
        if (diffMinutes <= 60 && diffMinutes > 0) {
            colors.bg = 'rgb(156,39,176)';
        }
        if (diffMinutes <= 0 && diffMinutes > -180) {
            colors.bg = 'rgb(76,175,80)';
        }

        /* 🔐 Certificates */
        const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
        const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* 🎟️ Create updated pass */
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
                passTypeIdentifier,
                teamIdentifier: process.env.APPLE_TEAM_ID,
                serialNumber,
                organizationName: 'Kőszeg Város',
                description: 'KőszegAPP – Frissített esemény',
                backgroundColor: colors.bg,
                foregroundColor: colors.fg,
                labelColor: colors.label,
                logoText: 'KőszegAPP',
                relevantDate: eventDate,
                expirationDate,
                locations: [
                    {
                        latitude: coords.lat,
                        longitude: coords.lng,
                        relevantText
                    }
                ],
                webServiceURL: 'https://koszegapp.netlify.app/.netlify/functions/pass-update',
                authenticationToken: Buffer.from(serialNumber).toString('base64'),
                userInfo: {
                    eventType: tags[0] || 'event',
                    city: 'Kőszeg'
                },
                sharingProhibited: false,
                suppressStripShine: false
            }
        );

        pass.type = 'eventTicket';

        pass.primaryFields.push({
            key: 'event',
            label: '🎟️ ESEMÉNY',
            value: name
        });

        pass.secondaryFields.push({
            key: 'datetime',
            label: '🕒 IDŐPONT',
            value: `${date} · ${time}`
        });

        pass.auxiliaryFields.push({
            key: 'place',
            label: '📍 HELYSZÍN',
            value: location
        });

        // Memory mode
        if (diffMinutes < -120) {
            pass.backFields.push({
                key: 'thanks',
                label: '💛 Köszönjük',
                value: 'Köszönjük, hogy velünk voltál az eseményen!'
            });
        }

        pass.backFields.push(
            {
                key: 'info',
                label: 'PROGRAM',
                value: highlightLabel || description?.split('\n')[0] || ''
            },
            {
                key: 'source',
                label: 'Forrás',
                value: 'KőszegAPP'
            }
        );

        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Last-Modified': new Date().toUTCString()
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('PASS UPDATE ERROR:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
