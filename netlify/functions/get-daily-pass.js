const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/*
  DAILY PASS DOWNLOAD ENDPOINT
  
  User-facing endpoint to download today's "KőszegMA" pass
  GET /.netlify/functions/get-daily-pass
*/

/* -------------------- Helpers -------------------- */

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
    const res = await fetch('https://koszegapp.netlify.app/.netlify/functions/get-github-json?path=public/data/events.json');
    if (!res.ok) throw new Error('Failed to fetch events');

    const events = await res.json();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Filter events happening today
    const todaysEvents = events.filter(e => {
        const eventDate = e.date;
        const endDate = e.end_date || e.date;
        return eventDate <= today && endDate >= today;
    });

    return todaysEvents;
}

/* -------------------- Handler -------------------- */

exports.handler = async (event) => {
    try {
        // Get today's events
        const todaysEvents = await getTodaysEvents();

        if (todaysEvents.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'Nincs esemény ma',
                    message: 'Ma nincs esemény Kőszegen. Próbáld meg holnap!'
                })
            };
        }

        // Get highlighted events (or all if none highlighted)
        const highlights = todaysEvents.filter(e => e.highlight);
        const eventsToShow = highlights.length > 0 ? highlights : todaysEvents.slice(0, 3);

        // Date formatting
        const today = new Date();
        const yyyyMMdd = today.toISOString().split('T')[0];
        const expirationDate = new Date(today);
        expirationDate.setHours(23, 59, 59, 999);

        // Format date for display (Hungarian)
        const dateStr = today.toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        /* ---------- Certificates ---------- */
        const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
        const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* ---------- Create Pass ---------- */
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
                serialNumber: `daily-${yyyyMMdd}`,
                organizationName: 'Kőszeg Város',
                description: 'KőszegAPP – Mai Események',
                backgroundColor: 'rgb(63,81,181)',
                foregroundColor: 'rgb(255,255,255)',
                labelColor: 'rgb(187,222,251)',
                logoText: 'KőszegAPP',
                relevantDate: today,
                expirationDate,
                webServiceURL: 'https://koszegapp.netlify.app/.netlify/functions/pass-update',
                authenticationToken: Buffer.from(`daily-${yyyyMMdd}`).toString('base64'),
                sharingProhibited: false,
                suppressStripShine: false,
                userInfo: {
                    passType: 'daily',
                    date: yyyyMMdd
                }
            }
        );

        pass.type = 'eventTicket';

        /* ---------- Fields ---------- */
        pass.primaryFields.push({
            key: 'title',
            label: '📍 MA KŐSZEGEN',
            value: dateStr
        });

        eventsToShow.forEach((e, idx) => {
            pass.secondaryFields.push({
                key: `event_${idx}`,
                label: '🎉 Esemény',
                value: `${e.time} – ${e.name}`
            });
        });

        pass.backFields.push(
            {
                key: 'details',
                label: 'Mai események',
                value: eventsToShow.map(e => `${e.time} – ${e.name}\n📍 ${e.location}`).join('\n\n')
            },
            {
                key: 'source',
                label: 'Forrás',
                value: 'KőszegAPP – visitkoszeg.hu'
            }
        );

        /* ---------- Images ---------- */
        const SITE_URL = 'https://koszegapp.netlify.app';

        try {
            const iconRes = await fetch(`${SITE_URL}/images/apple-touch-icon.png`);
            const icon = await iconRes.buffer();
            pass.addBuffer('icon.png', icon);
            pass.addBuffer('icon@2x.png', icon);

            const logoRes = await fetch(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            const logo = await logoRes.buffer();
            pass.addBuffer('logo.png', logo);
            pass.addBuffer('logo@2x.png', logo);
        } catch (e) {
            console.warn('Daily pass image load failed', e);
        }

        /* ---------- Generate ---------- */
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="koszegma-${yyyyMMdd}.pkpass"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('DAILY PASS DOWNLOAD ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
