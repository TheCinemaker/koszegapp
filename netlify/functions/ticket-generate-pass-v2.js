const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { ticketConfig } = require('./lib/ticketConfig');

/* -------------------- Helpers -------------------- */
async function getBuffer(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        return res.buffer();
    } catch (e) {
        console.warn(`Buffer fetch failed for ${url}:`, e.message);
        return null;
    }
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

/* -------------------- Handler -------------------- */
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    try {
        console.log('VERSION: V3-SAFE-MODE-PREFIXED - 2026-02-09'); // Deployment Verification

        const ticketId = event.queryStringParameters?.ticketId;
        if (!ticketId) {
            return { statusCode: 400, body: 'Ticket ID required' };
        }

        // Fetch ticket + event adatok
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`*, ticket_events(name, date, time, location)`)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return { statusCode: 404, body: 'Ticket not found' };
        }

        const eventData = ticket.ticket_events;

        /* ---------- Tanúsítványok ---------- */
        const p12Buffer = fs.readFileSync(path.resolve(__dirname, 'certs/pass.p12'));
        const wwdrBuffer = fs.readFileSync(path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer'));

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        /* ---------- Egyszerű jegy pass props ---------- */
        const eventDate = new Date(`${eventData.date}T${eventData.time}:00+01:00`);
        const expirationDate = new Date(eventDate);
        expirationDate.setDate(expirationDate.getDate() + 1);

        // Fix 1: Hardwire ID-k a biztonság kedvéért (vagy Env Var ellenőrzése)
        // A biztonság kedvéért itt hagyom a hardcoded értékeket, ha az Env Var-ok nem lennének jók.
        // passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.hu.koszeg.koszegpass'

        const passProps = {
            formatVersion: 1,
            passTypeIdentifier: 'pass.hu.koszeg.koszegpass', // Hardcoded fix
            teamIdentifier: '97FG847W58', // Hardcoded fix
            organizationName: ticketConfig.branding.appName,
            description: `Belépő – ${eventData.name}`,
            serialNumber: `EVENT-TICKET-${ticket.id}`, // Fix 2: Prefix collision avoid

            backgroundColor: 'rgb(255, 255, 255)',
            foregroundColor: 'rgb(0, 0, 0)',
            labelColor: 'rgb(80, 80, 80)',
            logoText: ticketConfig.branding.appName,

            relevantDate: eventDate,
            expirationDate,

            sharingProhibited: true,
            groupingIdentifier: `event-ticket-${eventData.name.replace(/\s+/g, '-')}` // Fix 3: Grouping
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

        // Egyértelműen jegyként kezelje
        pass.type = 'eventTicket';

        /* ---------- Mezők: esemény + vevő + idő + hely ---------- */
        pass.headerFields.push({
            key: 'event',
            label: 'ESEMÉNY',
            value: eventData.name?.toUpperCase() || 'ESEMÉNY'
        });

        pass.primaryFields.push({
            key: 'name',
            label: 'NÉV',
            value: ticket.buyer_name
        });

        pass.secondaryFields.push({
            key: 'datetime',
            label: 'IDŐPONT',
            value: `${new Date(eventData.date).toLocaleDateString('hu-HU')} ${eventData.time}`
        });

        pass.auxiliaryFields.push({
            key: 'location',
            label: 'HELYSZÍN',
            value: eventData.location
        });

        pass.backFields.push({
            key: 'terms',
            label: 'Feltételek',
            value: 'Ez a jegy egyszeri belépésre jogosít. Mutasd fel a QR kódot a belépéskor.'
        });

        /* ---------- QR-kód a beléptetéshez ---------- */
        const qrValue = ticket.qr_code_token || ticket.qr_token || String(ticket.id);

        pass.setBarcodes({
            message: qrValue,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: qrValue
        });

        /* ---------- Ikonok (kötelező assetek) ---------- */
        const SITE_URL = 'https://koszegapp.netlify.app';

        try {
            const icon = await getBuffer(`${SITE_URL}/images/apple-touch-icon.png`);
            if (icon) {
                pass.addBuffer('icon.png', icon);
                pass.addBuffer('icon@2x.png', icon);
            }

            const logo = await getBuffer(`${SITE_URL}/images/koeszeg_logo_nobg.png`);
            if (logo) {
                pass.addBuffer('logo.png', logo);
                pass.addBuffer('logo@2x.png', logo);
            }
        } catch (e) {
            console.warn('Image processing failed:', e);
        }

        /* ---------- Válasz ---------- */
        // Fix 4: Await buffer!
        const buffer = await pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="ticket-${ticket.id}.pkpass"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('Ticket Generator Error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
