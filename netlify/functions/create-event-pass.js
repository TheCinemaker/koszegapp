const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/* -------------------- Helpers -------------------- */

async function getBuffer(url) {
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.buffer();
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

    if (!key || !cert) {
        throw new Error('Could not extract key/cert from P12');
    }

    return { key, cert };
}

function getEventPalette(tags = []) {
    const t = tags.map(v => v.toLowerCase());

    if (t.includes('bál')) {
        return {
            bg: 'rgb(88,24,69)',
            fg: 'rgb(255,255,255)',
            label: 'rgb(255,215,0)'
        };
    }

    if (t.includes('koncert')) {
        return {
            bg: 'rgb(32,32,64)',
            fg: 'rgb(255,255,255)',
            label: 'rgb(255,105,180)'
        };
    }

    if (t.includes('gyerek')) {
        return {
            bg: 'rgb(255,235,59)',
            fg: 'rgb(33,33,33)',
            label: 'rgb(0,150,136)'
        };
    }

    return {
        bg: 'rgb(63,81,181)',
        fg: 'rgb(255,255,255)',
        label: 'rgb(200,200,255)'
    };
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const {
            id,
            name,
            date,
            time,
            location,
            coords,
            description,
            tags = [],
            highlightLabel
        } = JSON.parse(event.body);

        if (!id || !name || !date || !time || !coords) {
            throw new Error('Missing required event fields');
        }

        /* ---------- Certificates ---------- */

        const p12Path = path.resolve(__dirname, 'certs/pass.p12');
        const wwdrPath = path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer');

        const p12Buffer = fs.readFileSync(p12Path);
        const wwdrBuffer = fs.readFileSync(wwdrPath);

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* ---------- Dates & Time Logic ---------- */

        const eventDate = new Date(`${date}T${time}:00+01:00`);
        const expirationDate = new Date(eventDate);
        expirationDate.setDate(expirationDate.getDate() + 1);

        const now = new Date();
        const diffMinutes = Math.round((eventDate - now) / 60000);

        /* ---------- Colors (Dynamic based on time) ---------- */

        const colors = getEventPalette(tags);

        // 2️⃣ Dynamic color shift as event approaches/happens
        if (diffMinutes <= 60 && diffMinutes > 0) {
            colors.bg = 'rgb(156,39,176)'; // Purple - event starting soon
        }
        if (diffMinutes <= 0 && diffMinutes > -180) {
            colors.bg = 'rgb(76,175,80)'; // Green - event happening now
        }

        /* ---------- Smart relevantText (1️⃣) ---------- */

        let relevantText = `Ma ${time} – ${name}`;
        if (diffMinutes <= 60 && diffMinutes > 0) {
            relevantText = `⏰ ${diffMinutes} perc múlva kezdődik`;
        }
        if (diffMinutes <= 0 && diffMinutes > -180) {
            relevantText = `🎉 Most zajlik – jó szórakozást!`;
        }

        /* ---------- Pass Props ---------- */

        const passProps = {
            formatVersion: 1,
            passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
            teamIdentifier: process.env.APPLE_TEAM_ID,
            organizationName: 'Kőszeg Város',
            description: 'KőszegAPP – Esemény',
            serialNumber: id,
            backgroundColor: colors.bg,
            foregroundColor: colors.fg,
            labelColor: colors.label,
            logoText: 'KőszegAPP',
            relevantDate: eventDate,
            expirationDate,

            // 1️⃣ Smart lock screen text
            locations: [
                {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    relevantText
                }
            ],

            // 3️⃣ Future-proof web service (for updates)
            webServiceURL: 'https://koszegapp.netlify.app/.netlify/functions/pass-update',
            authenticationToken: Buffer.from(id).toString('base64'),

            // 4️⃣ Apple Watch optimization
            userInfo: {
                eventType: tags[0] || 'event',
                city: 'Kőszeg'
            },

            // 5️⃣ Accessibility & Apple compliance
            sharingProhibited: false,
            suppressStripShine: false
        };

        const pass = new PKPass(
            {},
            {
                wwdr: wwdrPem,
                signerCert: cert,
                signerKey: key,
                signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
            },
            passProps
        );

        pass.type = 'eventTicket';

        /* ---------- Fields (6️⃣ with emoji refinement) ---------- */

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

        // 7️⃣ "Memory mode" - post-event thank you message
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

        /* ---------- Images ---------- */

        const SITE_URL = 'https://koszegapp.netlify.app';

        try {
            const icon = await getBuffer(`${SITE_URL}/images/apple-touch-icon.png`);
            pass.addBuffer('icon.png', icon);
            pass.addBuffer('icon@2x.png', icon);

            const logo = await getBuffer(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            pass.addBuffer('logo.png', logo);
            pass.addBuffer('logo@2x.png', logo);
        } catch (e) {
            console.warn('Image load failed', e);
        }

        /* ---------- Output ---------- */

        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename=event-${id}.pkpass`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('Event Pass Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
