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

        // Create pass using file-based certificates (like V1)
        const pass = await PKPass.from({
            model: path.resolve(__dirname, 'assets/ticket.pass'),
            certificates: {
                wwdr: path.resolve(__dirname, 'certs/wwdr.pem'),
                signerCert: path.resolve(__dirname, 'certs/signerCert.pem'),
                signerKey: path.resolve(__dirname, 'certs/signerKey.pem'),
                signerKeyPassphrase: walletConfig.passphrase || ''
            }
        }, {
            serialNumber: ticket.id,
            description: `${walletConfig.passNamePrefix}${eventData.name}`,
            organizationName: ticketConfig.branding.appName,
            passTypeIdentifier: walletConfig.passTypeIdentifier,
            teamIdentifier: walletConfig.teamIdentifier,
            webServiceURL: process.env.URL,
            authenticationToken: ticket.qr_token
        });

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
