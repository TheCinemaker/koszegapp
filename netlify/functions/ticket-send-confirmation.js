// Ticket System - Email Confirmation Sender
// Sends ticket confirmation email with QR code

import { ticketConfig, getEmailConfig, getAppUrl } from './lib/ticketConfig.js';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

// USE SERVICE ROLE KEY (Essential for backend access bypassing RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const { ticketId } = JSON.parse(event.body);

    if (!ticketId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ticket ID required' })
      };
    }

    // Fetch ticket with event details
    // Note: ensure 'ticket_events' relation (Foreign Key) exists in Supabase
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
        body: JSON.stringify({ error: 'Ticket not found' })
      };
    }

    // Safety check for relation
    if (!ticket.ticket_events) {
      console.error('Event relation missing for ticket:', ticketId);
      // Build a fallback event object or throw
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Event data missing' })
      };
    }

    // Generate QR code as base64 - USE qr_code_token (DB column name)
    const qrTokenValue = ticket.qr_code_token || ticket.qr_token; // Fallback just in case

    if (!qrTokenValue) {
      throw new Error('QR token missing on ticket record');
    }

    // Generate QR code URL (Reliable for Gmail)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrTokenValue}`;

    const ticketEvent = ticket.ticket_events;
    const eventDate = new Date(ticketEvent.date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // URLs
    const printUrl = `${getAppUrl()}/tickets/print/${ticketId}`;
    const walletPassUrl = `${getAppUrl()}/.netlify/functions/ticket-generate-pass-v2?ticketId=${ticketId}`;

    // Get email config
    const emailConfig = getEmailConfig();

    // Send email
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [ticket.buyer_email],
      subject: `${emailConfig.subjectPrefix} ${ticketEvent.name}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jegyed - ${ticketEvent.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { background: #000000; padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 40px; }
    .greeting { font-size: 17px; margin-bottom: 20px; font-weight: 500; }
    .lead { font-size: 17px; color: #86868b; margin-bottom: 30px; line-height: 1.5; }
    .card { background: #f5f5f7; border-radius: 16px; padding: 24px; margin-bottom: 30px; }
    .event-title { font-size: 22px; font-weight: 700; margin: 0 0 10px 0; color: #000000; letter-spacing: -0.8px; }
    .detail-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; color: #424245; }
    .detail-icon { margin-right: 10px; opacity: 0.7; }
    .qr-section { text-align: center; margin: 30px 0; padding: 20px 0; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; }
    .qr-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; margin-bottom: 15px; }
    .qr-image { width: 220px; height: 220px; background: white; padding: 10px; border-radius: 12px; }
    .btn-group { text-align: center; margin-bottom: 30px; }
    .wallet-btn { display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 98px; font-size: 15px; font-weight: 600; margin-bottom: 10px; }
    .print-btn { display: inline-block; background-color: #f5f5f7; color: #1d1d1f; padding: 12px 24px; text-decoration: none; border-radius: 98px; font-size: 14px; font-weight: 500; border: 1px solid #d2d2d7; }
    .wallet-btn:hover { transform: scale(1.02); }
    .footer { background: #f5f5f7; padding: 30px; text-align: center; font-size: 12px; color: #86868b; border-top: 1px solid #e5e5e5; }
    .warning { font-size: 13px; color: #ff3b30; margin-top: 20px; text-align: center; }
    .link { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KőszegTicket</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Kedves ${ticket.buyer_name}!</div>
      <div class="lead">Elkészült a jegyed a következő eseményre:</div>

      <div class="card">
        <h2 class="event-title">${ticketEvent.name}</h2>
        <div class="detail-row">
          <span class="detail-icon">📅</span> <strong>${eventDate}, ${ticketEvent.time}</strong>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span> ${ticketEvent.location}
        </div>
        <div class="detail-row">
          <span class="detail-icon">👥</span> ${ticket.guest_count} fő részére
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-label">Belépőkód</div>
        <img src="${qrCodeUrl}" alt="QR Kód" class="qr-image" />
        <p style="font-size: 12px; color: #86868b; margin-top: 10px;">${qrTokenValue}</p>
      </div>

      <div class="btn-group">
        <a href="${walletPassUrl}" style="display: inline-block; margin-bottom: 20px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3d/Add_to_Apple_Wallet_badge.svg" alt="Add to Apple Wallet" style="height: 42px;" />
        </a>
        <br />
        <a href="${printUrl}" class="print-btn">
          Jegy nyomtatása (PDF / Papír)
        </a>
      </div>
      
      <div class="warning">
        Ez a jegy egyszeri belépésre jogosít. Kérjük, ne oszd meg mással!
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} KőszegAPP. Minden jog fenntartva.</p>
      <p>Kérdésed van? <a href="mailto:${ticketConfig.branding.supportEmail}" class="link">Írj nekünk</a></p>
    </div>
  </div>
</body>
</html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    // Update ticket email_sent_at
    await supabase
      .from('tickets')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', ticketId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        emailId: data.id
      })
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
