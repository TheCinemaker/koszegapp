const { PKPass } = require('passkit-generator');
const fetch = require('node-fetch');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const { ticketConfig, getWalletConfig } = require('./lib/ticketConfig');

/* -------------------- Helpers -------------------- */

async function getBuffer(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        return res.buffer();
    } catch (e) {
        console.warn(`Buffer fetch failed for ${url}:`, e.message);
        return null; // Fail graceful
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
        const ticketId = event.queryStringParameters?.ticketId;
        if (!ticketId) return { statusCode: 400, body: 'Ticket ID required' };

        // Fetch ticket data
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`*, ticket_events(name, date, time, location)`)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) return { statusCode: 404, body: 'Ticket not found' };

        const eventData = ticket.ticket_events;
        const walletConfig = getWalletConfig();

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

        /* ---------- Pass Props ---------- */
        // Use logic similar to create-event-pass but with Ticket data

        const passProps = {
            formatVersion: 1,
            passTypeIdentifier: ticketConfig.wallet.apple.passTypeIdentifier, // Use config
            teamIdentifier: ticketConfig.wallet.apple.teamIdentifier,
            organizationName: ticketConfig.branding.appName,
            description: `Jegy: ${eventData.name}`,
            serialNumber: ticket.id,
            backgroundColor: 'rgb(255, 255, 255)', // Light theme for tickets
            foregroundColor: 'rgb(0, 0, 0)',
            labelColor: 'rgb(80, 80, 80)',
            logoText: ticketConfig.branding.appName,
            // Ticket specific dates
            relevantDate: new Date(`${eventData.date}T${eventData.time}:00+01:00`),

            webServiceURL: process.env.URL, // Auto update
            authenticationToken: ticket.qr_token,

            sharingProhibited: true, // Tickets shouldn't be shared ideally
            groupingIdentifier: `event-ticket-${eventData.name.replace(/\s+/g, '-')}` // Separate from daily pass
        };

        const pass = new PKPass(
            {}, // No model
            {
                wwdr: wwdrPem,
                signerCert: cert,
                signerKey: key,
                signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
            },
            passProps
        );

        pass.type = 'eventTicket';

        /* ---------- Fields ---------- */
        pass.headerFields.push({
            key: 'event',
            label: 'ESEMÉNY',
            value: eventData.name,
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
            value: 'Ez a jegy egyszeri belépésre jogosít.'
        });

        /* ---------- Barcode (Ticket Specific) ---------- */
        const qrValue = ticket.qr_code_token || ticket.qr_token || ticket.id;
        pass.setBarcodes({
            message: qrValue,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: qrValue
        });

        /* ---------- Images (Online Fetch) ---------- */
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

            // --- Visual QR on Strip (V2) ---
            const stripPath = path.resolve(__dirname, '../../public/images/events/wallet.png');
            if (fs.existsSync(stripPath)) {
                const stripImage = await Jimp.read(stripPath);
                const qrBuffer = await QRCode.toBuffer(qrValue, {
                    width: 160,
                    margin: 2,
                    color: { dark: '#000000', light: '#FFFFFF' }
                });
                const qrImage = await Jimp.read(qrBuffer);

                const x = stripImage.bitmap.width - qrImage.bitmap.width - 50;
                const y = (stripImage.bitmap.height - qrImage.bitmap.height) / 2;

                stripImage.composite(qrImage, x, y);
                const compositedBuffer = await stripImage.getBufferAsync(Jimp.MIME_PNG);

                pass.addBuffer('strip.png', compositedBuffer);
                pass.addBuffer('strip@2x.png', compositedBuffer);
            } else {
                // Fallback fetch strip if local missing?
                // For now, let's trust the file exists as previous steps showed
            }

        } catch (e) {
            console.warn('Image processing failed:', e);
        }

        /* ---------- Output ---------- */
        const buffer = pass.getAsBuffer();

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
