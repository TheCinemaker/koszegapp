const { PKPass } = require('passkit-generator');
const { createClient } = require('@supabase/supabase-js');
const { ticketConfig, getAppUrl } = require('./lib/ticketConfig');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const QRCode = require('qrcode');
const Jimp = require('jimp');

// Helper to extract Key and Cert from P12 Buffer
function extractFromP12(p12Buffer, password) {
    try {
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

        let key = null;
        let cert = null;

        const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = bags[forge.pki.oids.certBag]?.[0];
        if (certBag) {
            cert = forge.pki.certificateToPem(certBag.cert);
        }

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
        if (keyBag) {
            key = forge.pki.privateKeyToPem(keyBag.key);
        }

        if (!key || !cert) {
            throw new Error("Could not extract Key or Cert from P12 file");
        }
        return { key, cert };
    } catch (e) {
        console.error("P12 Extraction Error:", e);
        throw e;
    }
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    try {
        const { ticketId } = event.queryStringParameters;

        if (!ticketId) {
            return { statusCode: 400, body: 'Ticket ID required' };
        }

        // 1. Fetch Ticket Data
        const { data: ticket, error } = await supabase
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

        if (error || !ticket) {
            console.error('Ticket fetch error:', error);
            return { statusCode: 404, body: 'Ticket not found' };
        }

        const ticketEvent = ticket.ticket_events;
        if (!ticketEvent) {
            return { statusCode: 500, body: 'Event data missing' };
        }

        // 2. Read Certs
        const p12Path = path.resolve(__dirname, 'certs/pass.p12');
        const wwdrPath = path.resolve(__dirname, 'certs/AppleWWDRCAG3.cer');

        if (!fs.existsSync(p12Path) || !fs.existsSync(wwdrPath)) {
            throw new Error(`Certificates missing at ${p12Path} or ${wwdrPath}`);
        }

        const p12Buffer = fs.readFileSync(p12Path);
        const wwdrBuffer = fs.readFileSync(wwdrPath);

        const wwdrAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
        const wwdrCert = forge.pki.certificateFromAsn1(wwdrAsn1);
        const wwdrPem = forge.pki.certificateToPem(wwdrCert);

        const { key, cert } = extractFromP12(
            p12Buffer,
            process.env.APPLE_PASS_P12_PASSWORD
        );

        // 3. Create Pass
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
                passTypeIdentifier: ticketConfig.wallet.apple.passTypeIdentifier,
                teamIdentifier: ticketConfig.wallet.apple.teamIdentifier,
                organizationName: ticketConfig.branding.appName,
                description: `Jegy: ${ticketEvent.name}`,
                serialNumber: ticket.id,
                backgroundColor: 'rgb(255, 255, 255)',
                foregroundColor: 'rgb(0, 0, 0)',
                labelColor: 'rgb(80, 80, 80)',
                logoText: ticketConfig.branding.appName
            }
        );

        pass.type = 'eventTicket';

        // 4. Set Fields
        // Header
        pass.headerFields.push({
            key: "event",
            label: "Esemény",
            value: ticketEvent.name
        });

        // Primary
        pass.primaryFields.push({
            key: "time",
            label: "Időpont",
            value: `${ticketEvent.date} ${ticketEvent.time}`
        });

        // Secondary
        pass.secondaryFields.push({
            key: "location",
            label: "Helyszín",
            value: ticketEvent.location
        });

        // Auxiliary
        pass.auxiliaryFields.push({
            key: "guests",
            label: "Jegyek",
            value: `${ticket.guest_count} fő`
        });

        // Back Fields
        pass.backFields.push(
            { key: "buyer", label: "Vásárló", value: ticket.buyer_name },
            { key: "id", label: "Ticket ID", value: ticket.id }
        );

        // 5. Barcode (QR)
        const qrValue = ticket.qr_code_token || ticket.qr_token || ticket.id;
        pass.setBarcodes({
            format: 'PKBarcodeFormatQR',
            message: qrValue,
            messageEncoding: 'iso-8859-1',
            altText: qrValue
        });

        // 6. Image Composite (QR on Strip)
        // Looking for wallet.png in public/images/events/ or similar
        // Since we are in netlify/functions, we need to go up to public
        // Path: ../../public/images/events/wallet.png (relative to this file)
        const stripPath = path.resolve(__dirname, '../../public/images/events/wallet.png');

        if (fs.existsSync(stripPath)) {
            // Read strip image
            const stripImage = await Jimp.read(stripPath);

            // Generate QR Code Buffer
            const qrBuffer = await QRCode.toBuffer(qrValue, {
                width: 150, // QR size
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Read QR image
            const qrImage = await Jimp.read(qrBuffer);

            // Composite QR onto Strip (Bottom Right or Center?)
            // Usually strip is 375x98 (Retina @1x? No, standard strip is 375x98pt / 1125x294px)
            // Let's assume the strip image is adequate size.
            // We'll place it on the right side if it's wide, or center if not.
            // Let's place it at x: 20, y: (height - qrHeight) / 2 for left alignment?
            // Apple Wallet strip images are displayed behind the primary fields slightly.
            // Actually, best practice for "eventTicket" with background image is `strip.png`.
            // Let's put the QR code on the right side.

            // Resize QR if needed? 150px seems okay for 1125px wide image.
            const x = stripImage.bitmap.width - qrImage.bitmap.width - 40; // 40px padding from right
            const y = (stripImage.bitmap.height - qrImage.bitmap.height) / 2;

            stripImage.composite(qrImage, x, y);

            // Get Buffer
            const compositedBuffer = await stripImage.getBufferAsync(Jimp.MIME_PNG);

            pass.addBuffer('strip.png', compositedBuffer);
            pass.addBuffer('strip@2x.png', compositedBuffer); // Ideally create 2x version
        } else {
            console.warn('Strip base image not found at:', stripPath);
        }

        // Icon
        const iconPath = path.resolve(__dirname, 'icon.png');
        if (fs.existsSync(iconPath)) {
            const iconBuffer = fs.readFileSync(iconPath);
            pass.addBuffer('icon.png', iconBuffer);
            pass.addBuffer('icon@2x.png', iconBuffer);
            pass.addBuffer('logo.png', iconBuffer);
            pass.addBuffer('logo@2x.png', iconBuffer);
        }


        // 7. Generate
        const buffer = pass.getAsBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="ticket-${ticket.id.substring(0, 8)}.pkpass"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('Pass generation error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
