// Ticket System - Apple Wallet Pass Generator V2 (Visual QR)
// Generates .pkpass file for Apple Wallet with QR code on strip image via Jimp
// Based on V1 robust logic + V2 visual features

const { ticketConfig, getWalletConfig } = require('./lib/ticketConfig');
const { createClient } = require('@supabase/supabase-js');
const { PKPass } = require('passkit-generator');
const path = require('path');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const fs = require('fs');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    try {
        const ticketId = event.queryStringParameters?.ticketId;

        if (!ticketId) {
            return {
                statusCode: 400,
                body: 'Ticket ID required'
            };
        }

        // Fetch ticket with event details
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
        *,
        ticket_events (
          name,
          description,
          date,
          time,
          location
        )
      `)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return {
                statusCode: 404,
                body: 'Ticket not found'
            };
        }

        const eventData = ticket.ticket_events;

        // Get wallet config
        const walletConfig = getWalletConfig();

        // 2. Read Certs
        const p12Path = path.resolve(__dirname, 'certs/pass.p12');
        const wwdrPath = path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer');

        // Helper to extract Key and Cert from P12 Buffer
        function extractFromP12(p12Buffer, password) {
            const forge = require('node-forge');
            try {
                const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
                const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');
                let key = null;
                let cert = null;
                const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certBag = bags[forge.pki.oids.certBag]?.[0];
                if (certBag) cert = forge.pki.certificateToPem(certBag.cert);
                const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
                if (keyBag) key = forge.pki.privateKeyToPem(keyBag.key);
                return { key, cert };
            } catch (e) {
                console.error("P12 Extraction Error:", e);
                throw e;
            }
        }

        const p12Buffer = fs.readFileSync(p12Path);
        const wwdrBuffer = fs.readFileSync(wwdrPath);
        const forge = require('node-forge'); // Ensure forge is available
        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(p12Buffer, process.env.APPLE_PASS_P12_PASSWORD);

        // 3. Create Pass programmatically (No model directory needed)
        const pass = new PKPass(
            {}, // No template model
            {
                wwdr: wwdrPem,
                signerCert: cert,
                signerKey: key,
                signerKeyPassphrase: process.env.APPLE_PASS_P12_PASSWORD
            },
            {
                formatVersion: 1,
                passTypeIdentifier: ticketConfig.wallet.apple.passTypeIdentifier,
                teamIdentifier: ticketConfig.wallet.apple.teamIdentifier,
                organizationName: ticketConfig.branding.appName,
                description: `Jegy: ${eventData.name}`,
                serialNumber: ticket.id,
                backgroundColor: 'rgb(255, 255, 255)',
                foregroundColor: 'rgb(0, 0, 0)',
                labelColor: 'rgb(80, 80, 80)',
                logoText: ticketConfig.branding.appName,
                webServiceURL: process.env.URL,
                authenticationToken: ticket.qr_token
            }
        );

        pass.type = 'eventTicket';

        // Set pass fields
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
            key: 'date',
            label: 'DÁTUM',
            value: new Date(eventData.date).toLocaleDateString('hu-HU')
        }, {
            key: 'time',
            label: 'IDŐPONT',
            value: eventData.time
        });

        pass.auxiliaryFields.push({
            key: 'location',
            label: 'HELYSZÍN',
            value: eventData.location
        }, {
            key: 'guests',
            label: 'VENDÉGEK',
            value: `${ticket.guest_count} fő`
        });

        pass.backFields.push({
            key: 'terms',
            label: 'Feltételek',
            value: 'Ez a jegy csak egyszer használható fel. Kérjük, mutasd fel a QR kódot a belépéskor.'
        });

        // Set standard barcode (for scanners)
        const qrValue = ticket.qr_code_token || ticket.qr_token || ticket.id;
        pass.setBarcodes({
            message: qrValue,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1',
            altText: qrValue
        });

        // Helper to fetch buffer from URL
        async function getBuffer(url) {
            if (!url) return null;
            const fetch = require('node-fetch');
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            return res.buffer();
        }

        /* ---------- Images (Icon & Logo from Live Site) ---------- */
        const SITE_URL = 'https://koszegapp.netlify.app';

        try {
            // Fetch Standard Images (Required for valid pass)
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
            console.warn('Standard Image load failed:', e);
            // proceed, but pass might be invalid without icon
        }


        // --- Visual QR Code Compositing (The V2 Special) ---

        // 1. Path to strip image
        const stripPath = path.resolve(__dirname, '../../public/images/events/wallet.png');

        if (fs.existsSync(stripPath)) {
            // 2. Read strip image
            const stripImage = await Jimp.read(stripPath);

            // 3. Generate QR Code Buffer (High contrast)
            const qrBuffer = await QRCode.toBuffer(qrValue, {
                width: 160,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // 4. Read QR image
            const qrImage = await Jimp.read(qrBuffer);

            // 5. Calculate position (Right aligned with padding)
            // Strip dimensions in Wallet are roughly 1125px width
            // Place it 50px from right edge, centered vertically
            const x = stripImage.bitmap.width - qrImage.bitmap.width - 50;
            const y = (stripImage.bitmap.height - qrImage.bitmap.height) / 2;

            // 6. Composite
            stripImage.composite(qrImage, x, y);

            // 7. Get Buffer
            const compositedBuffer = await stripImage.getBufferAsync(Jimp.MIME_PNG);

            // 8. Add to pass
            pass.addBuffer('strip.png', compositedBuffer);
            pass.addBuffer('strip@2x.png', compositedBuffer); // Ideally utilize high-res
        } else {
            console.warn('Strip image not found for compositing:', stripPath);
        }

        // --- End Visual QR ---

        // Generate pass buffer
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

    } catch (error) {
        console.error('Pass generation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
