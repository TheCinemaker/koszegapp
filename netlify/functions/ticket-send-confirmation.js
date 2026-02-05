// Ticket System - Email Confirmation Sender
// Sends ticket confirmation email with QR code

const { ticketConfig, getEmailConfig, getAppUrl } = require('./lib/ticketConfig');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const resend = new Resend(process.env.RESEND_API_KEY);

// Service role key required for backend access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  // Netlify guard
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!event.body) {
    return { statusCode: 400, body: 'Missing body' };
  }

  try {
    // Parse input
    const { ticketId } = JSON.parse(event.body);

    if (!ticketId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ticket ID required' }),
      };
    }

    // Fetch ticket + event
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
      console.error('Ticket fetch error:', ticketError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Ticket not found' }),
      };
    }

    if (!ticket.ticket_events) {
      console.error('Event relation missing for ticket:', ticketId);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Event data missing' }),
      };
    }

    // QR token (DB column name is qr_code_token)
    const qrTokenValue = ticket.qr_code_token;

    if (!qrTokenValue) {
      throw new Error('QR token missing on ticket record');
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrTokenValue, {
      width: 300,
      margin: 2,
    });

    const ticketEvent = ticket.ticket_events;
    const eventDate = new Date(ticketEvent.date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Apple Wallet link (future-proof)
    const walletPassUrl = `${getAppUrl()}/.netlify/functions/ticket-generate-pass-v2?ticketId=${ticketId}`;

    const emailConfig = getEmailConfig();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'KőszegTicket <onboarding@resend.dev>',
      to: [ticket.buyer_email],
      subject: `${emailConfig.subjectPrefix} ${ticketEvent.name}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jegyed - ${ticketEvent.name}</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f5f7; margin:0; padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px;">
    <h2>Kedves ${ticket.buyer_name}!</h2>
    <p>Elkészült a jegyed a következő eseményre:</p>

    <h3>${ticketEvent.name}</h3>
    <p>📅 ${eventDate}, ${ticketEvent.time}</p>
    <p>📍 ${ticketEvent.location}</p>
    <p>👥 ${ticket.guest_count} fő</p>

    <hr />

    <p><strong>Belépőkód:</strong></p>
    <img src="${qrCodeDataUrl}" alt="QR Code" style="width:220px;" />
    <p style="font-family:monospace;">${qrTokenValue}</p>

    <p style="margin-top:20px;">
      <a href="${walletPassUrl}">Add hozzá az Apple Wallethez</a>
    </p>

    <p style="margin-top:30px;font-size:12px;color:#666;">
      Ez a jegy egyszeri belépésre jogosít.
    </p>
  </div>
</body>
</html>
      `,
    });

    console.log('📧 Resend response:', { data, error });

    if (error) {
      throw error;
    }

    // Mark email as sent
    await supabase
      .from('tickets')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', ticketId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        emailId: data.id,
      }),
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
