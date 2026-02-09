const { createClient } = require('@supabase/supabase-js');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const { ticketConfig } = require('./lib/ticketConfig');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    try {
        const ticketId = event.queryStringParameters?.ticketId;
        if (!ticketId) {
            return { statusCode: 400, body: 'Ticket ID required' };
        }

        // 1. Fetch Ticket Data
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`*, ticket_events(name, date, time, location)`)
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            return { statusCode: 404, body: 'Ticket not found' };
        }

        const eventData = ticket.ticket_events;
        const qrValue = ticket.qr_code_token || ticket.qr_token || String(ticket.id);

        // 2. Prepare PDF
        // Create new PDF document (A4 portrait)
        // Note: in Node.js with jspdf, we might need to be careful about strict mode, 
        // but recent versions work fairly well if we stick to basic text/shapes.
        const doc = new jsPDF();

        // --- Colors & Fonts ---
        const black = '#000000';
        const darkGray = '#333333';
        const lightGray = '#888888';
        const accentColor = '#4F46E5'; // Indigo-like

        // --- Header ---
        doc.setFillColor(black);
        doc.rect(0, 0, 210, 40, 'F'); // Black header bar

        doc.setTextColor('#FFFFFF');
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(ticketConfig.branding.appName || 'KőszegAPP', 20, 25);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('HIVATALOS BELÉPŐJEGY', 190, 25, { align: 'right' });

        // --- Event Details ---
        doc.setTextColor(black);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        // Split text if too long
        const eventNameLines = doc.splitTextToSize(eventData.name.toUpperCase(), 170);
        doc.text(eventNameLines, 20, 60);

        let currentY = 60 + (eventNameLines.length * 10) + 10;

        // Info Grid
        doc.setFontSize(12);
        doc.setTextColor(lightGray);
        doc.text('IDŐPONT', 20, currentY);
        doc.text('HELYSZÍN', 110, currentY);

        currentY += 8;
        doc.setFontSize(14);
        doc.setTextColor(darkGray);
        doc.setFont('helvetica', 'bold');

        const dateStr = new Date(eventData.date).toLocaleDateString('hu-HU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`${dateStr} • ${eventData.time}`, 20, currentY);

        // Handle long location
        const locationLines = doc.splitTextToSize(eventData.location, 90);
        doc.text(locationLines, 110, currentY);

        currentY += 25;

        // Divider
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY, 190, currentY);
        currentY += 15;

        // --- Buyer Info ---
        doc.setFontSize(12);
        doc.setTextColor(lightGray);
        doc.setFont('helvetica', 'normal');
        doc.text('NÉV', 20, currentY);
        doc.text('JEGY TÍPUS', 110, currentY);

        currentY += 8;
        doc.setFontSize(16);
        doc.setTextColor(black);
        doc.setFont('helvetica', 'bold');
        doc.text(ticket.buyer_name, 20, currentY);
        doc.text(`${ticket.guest_count} Fő részére`, 110, currentY);

        currentY += 30;

        // --- QR Code Section ---
        // Generate QR as Data URL
        const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 400, margin: 1 });

        // Add QR Image
        // x, y, w, h
        doc.addImage(qrDataUrl, 'PNG', 55, currentY, 100, 100);

        currentY += 110;

        // Ticket ID
        doc.setFontSize(10);
        doc.setTextColor(lightGray);
        doc.setFont('courier', 'normal');
        doc.text(`ID: ${ticket.id}`, 105, currentY, { align: 'center' });

        currentY += 10;
        doc.setFont('helvetica', 'italic');
        doc.text('Kérjük, mutassa fel ezt a QR kódot a bejáratnál!', 105, currentY, { align: 'center' });


        // --- Footer ---
        doc.setFontSize(9);
        doc.setTextColor(lightGray);
        doc.text('© KőszegAPP Ticket System', 20, 280);
        doc.text(new Date().toLocaleString('hu-HU'), 190, 280, { align: 'right' });


        // 3. Output
        // Get output as buffer/string
        const pdfOutput = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfOutput);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="jegy-${ticket.id}.pdf"`
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (err) {
        console.error('PDF Generation Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message, stack: err.stack })
        };
    }
};
