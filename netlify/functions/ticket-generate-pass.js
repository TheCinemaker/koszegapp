// Ticket System - Apple Wallet Pass Generator
// Generates .pkpass file for Apple Wallet

const { createClient } = require('@supabase/supabase-js');
const { PKPass } = require('passkit-generator');
const path = require('path');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
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

        const event = ticket.ticket_events;

        // Create pass
        const pass = await PKPass.from({
            model: path.resolve(__dirname, 'assets/ticket.pass'),
            certificates: {
                wwdr: path.resolve(__dirname, 'certs/wwdr.pem'),
                signerCert: path.resolve(__dirname, 'certs/signerCert.pem'),
                signerKey: path.resolve(__dirname, 'certs/signerKey.pem'),
                signerKeyPassphrase: process.env.PASSKIT_PASSPHRASE || ''
            }
        }, {
            serialNumber: ticket.id,
            description: `Jegy - ${event.name}`,
            organizationName: 'KőszegAPP',
            passTypeIdentifier: process.env.PASSKIT_PASS_TYPE_ID || 'pass.hu.koszegapp.ticket',
            teamIdentifier: process.env.PASSKIT_TEAM_ID || '',
            webServiceURL: process.env.URL,
            authenticationToken: ticket.qr_token
        });

        // Set pass fields
        pass.headerFields.push({
            key: 'event',
            label: 'ESEMÉNY',
            value: event.name
        });

        pass.primaryFields.push({
            key: 'name',
            label: 'NÉV',
            value: ticket.buyer_name
        });

        pass.secondaryFields.push({
            key: 'date',
            label: 'DÁTUM',
            value: new Date(event.date).toLocaleDateString('hu-HU')
        }, {
            key: 'time',
            label: 'IDŐPONT',
            value: event.time
        });

        pass.auxiliaryFields.push({
            key: 'location',
            label: 'HELYSZÍN',
            value: event.location
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

        // Set barcode
        pass.setBarcodes({
            message: ticket.qr_token,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
        });

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
