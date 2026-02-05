const { createClient } = require('@supabase/supabase-js');
const { Template } = require("@walletpass/pass-js");
const { ticketConfig, getAppUrl } = require('./lib/ticketConfig');

// Dedicated Ticket Pass Generator V2
// Focuses solely on reliable 'eventTicket' generation

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

        // 2. Prepare Pass Logic
        // In a real scenario, you'd load the cert/key from env or file
        // For now assuming existing cert loader or usage pattern from legacy if available
        // BUT since user asked for separation, I will implement standard pass-js logic here.

        // NOTE: This requires the P12 certificate and password to be available in ENV
        if (!process.env.APPLE_PASS_CERTIFICATE || !process.env.APPLE_PASS_PASSWORD) {
            console.error('Missing Apple Wallet configuration');
            return { statusCode: 500, body: 'Wallet configuration missing' };
        }

        // 3. Create Template (Event Ticket)
        const template = new Template("eventTicket", {
            passTypeIdentifier: ticketConfig.wallet.apple.passTypeIdentifier,
            teamIdentifier: ticketConfig.wallet.apple.teamIdentifier,
            organizationName: ticketConfig.branding.appName,
            description: `Jegy: ${ticketEvent.name}`,
            sharingProhibited: true,
            backgroundColor: "rgb(255, 255, 255)",
            foregroundColor: "rgb(0, 0, 0)",
            labelColor: "rgb(80, 80, 80)"
        });

        // Load Keys (Assuming BASE64 encoded P12 in env for Netlify)
        // If it's a file path in dev, handle that? 
        // Usually best to store as base64 string in Netlify Env
        try {
            const certBuffer = Buffer.from(process.env.APPLE_PASS_CERTIFICATE, 'base64');
            await template.loadCertificate(certBuffer, process.env.APPLE_PASS_PASSWORD);
        } catch (certError) {
            console.error('Certificate load error:', certError);
            return { statusCode: 500, body: 'Certificate error' };
        }

        // 4. Populate Fields
        const pass = template.createPass({
            serialNumber: ticket.id,
            authenticationToken: ticket.qr_code_token || ticket.qr_token || ticket.id // fallback
        });

        // Header: Event Name
        pass.headerFields.add({
            key: "event",
            label: "Esemény",
            value: ticketEvent.name
        });

        // Primary: Date & Time
        const eventDateTime = new Date(`${ticketEvent.date}T${ticketEvent.time}`);
        // Pass-js handles dates, but string format is safer for display sometimes
        // Let's use the standard date format if possible, or string value
        pass.primaryFields.add({
            key: "time",
            label: "Időpont",
            value: `${ticketEvent.date} ${ticketEvent.time}`,
            // specific date style can be added if supported by lib, keeping simple text for safety
        });

        // Secondary: Location
        pass.secondaryFields.add({
            key: "location",
            label: "Helyszín",
            value: ticketEvent.location
        });

        // Auxiliary: Guest Count
        pass.auxiliaryFields.add({
            key: "guests",
            label: "Jegyek",
            value: `${ticket.guest_count} fő`
        });

        // Back Fields (Info)
        pass.backFields.add({
            key: "buyer",
            label: "Vásárló",
            value: ticket.buyer_name
        });

        pass.backFields.add({
            key: "id",
            label: "Jegy Azonosító",
            value: ticket.id
        });

        pass.backFields.add({
            key: "support",
            label: "Ügyfélszolgálat",
            value: ticketConfig.branding.supportEmail
        });

        // 5. Barcode (QR)
        const qrValue = ticket.qr_code_token || ticket.qr_token || ticket.id;
        pass.barcodes = [{
            message: qrValue,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        }];

        // 6. Generate Buffer
        const buffer = await pass.asBuffer();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="ticket-${ticketEvent.date}.pkpass"`
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
