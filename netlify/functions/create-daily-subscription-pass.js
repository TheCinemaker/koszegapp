import { PKPass } from 'passkit-generator';
import fetch from 'node-fetch';
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = typeof import.meta !== 'undefined' && import.meta.url ? dirname(__filename) : (typeof process !== 'undefined' ? process.cwd() : '');

function getCertPath(filename) {
    const paths = [
        path.join(__dirname, 'certs', filename),
        path.join(__dirname, '..', 'certs', filename),
        path.join(__dirname, 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'netlify/functions/certs', filename),
        path.join(process.cwd(), 'certs', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return path.join(__dirname, 'certs', filename);
}

/*
  BOOTSTRAP SUBSCRIPTION PASS
  
  This is the "subscription" pass that users download ONCE.
  It registers their device with Apple Wallet.
  
  After this, the daily-pass-generator.js cron job will automatically
  send daily event passes to subscribed devices.
  
  This pass:
  - Never expires
  - Always available (even when no events today)
  - Registers the device for future updates
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
    try {
        const res = await fetch('https://koszegapp.netlify.app/.netlify/functions/get-github-json?path=public/data/events.json');
        if (!res.ok) return [];

        const events = await res.json();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Filter events happening today
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

/* -------------------- Handler -------------------- */

export const handler = async (event) => {
    try {
        /* ---------- Certificates ---------- */
        const p12Buffer = fs.readFileSync(getCertPath('pass.p12'));
        const wwdrBuffer = fs.readFileSync(getCertPath('AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* ---------- Data ---------- */
        const todaysEvents = await getTodaysEvents();
        const authToken = crypto.randomBytes(32).toString('hex');

        // Date formatting
        const today = new Date();
        const yyyyMMdd = today.toISOString().split('T')[0];

        /* ---------- Create Subscription Pass ---------- */
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
                serialNumber: 'daily-subscription', // Fixed serial for the subscription card
                organizationName: 'Kőszeg Város',
                description: 'Ma Kőszegen – Wallet feliratkozás',
                logoText: 'Ma Kőszegen',
                backgroundColor: 'rgb(33,150,243)',
                foregroundColor: 'rgb(255,255,255)',
                labelColor: 'rgb(187,222,251)',

                // ✅ Update fields
                webServiceURL: 'https://koszegapp.netlify.app',
                authenticationToken: authToken,

                sharingProhibited: false,
                suppressStripShine: false,
                userInfo: {
                    passType: 'daily-subscription',
                    city: 'Kőszeg'
                }
            }
        );

        pass.type = 'storeCard';

        /* ---------- Fields ---------- */
        pass.primaryFields.push({
            key: 'title',
            label: '📍 MA KŐSZEGEN',
            value: todaysEvents.length > 0 ? `${todaysEvents.length} esemény` : 'Napi események'
        });

        pass.secondaryFields.push({
            key: 'status',
            label: 'Állapot',
            value: '✅ Feliratkozva'
        });

        // Add today's events if any (Day 1 experience)
        if (todaysEvents.length > 0) {
            todaysEvents.slice(0, 3).forEach((e, idx) => {
                pass.auxiliaryFields.push({
                    key: `event_${idx}`,
                    label: e.time,
                    value: e.name
                });
            });
        }

        pass.backFields.push(
            {
                key: 'info',
                label: 'Hogyan működik?',
                value: 'Ez a kártya automatikusan frissül, ha Kőszegen van aznap esemény.'
            },
            {
                key: 'source',
                label: 'Forrás',
                value: 'KőszegAPP – visitkoszeg.hu'
            }
        );

        if (todaysEvents.length > 0) {
            pass.backFields.push({
                key: 'todays_events',
                label: 'Mai részletek',
                value: todaysEvents.map(e => `${e.time} – ${e.name} (${e.location})`).join('\n')
            });
        }

        /* ---------- Images ---------- */

        try {
            const icon = fs.readFileSync(path.join(__dirname, 'certs', 'icon.png'));
            pass.addBuffer('icon.png', icon);

            const icon2x = fs.readFileSync(path.join(__dirname, 'certs', 'icon@2x.png'));
            pass.addBuffer('icon@2x.png', icon2x);
        } catch (e) {
            console.error('❌ ICON MISSING – PASS WILL FAIL ON IOS', e);
            throw new Error('Wallet icon missing');
        }

        // 🟡 LOGO OPCIONÁLIS
        try {
            const logo = fs.readFileSync(path.join(__dirname, 'certs', 'logo.png'));
            pass.addBuffer('logo.png', logo);

            const logo2x = fs.readFileSync(path.join(__dirname, 'certs', 'logo@2x.png'));
            pass.addBuffer('logo@2x.png', logo2x);
        } catch (e) {
            console.warn('⚠️ Logo missing – continuing without logo');
        }
        /* ---------- Generate ---------- */
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': 'attachment; filename="koszeg-ma-wallet.pkpass"',
                'Cache-Control': 'no-store'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('BOOTSTRAP PASS ERROR:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
