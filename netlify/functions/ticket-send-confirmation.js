import { ticketConfig, getEmailConfig, getAppUrl } from './lib/ticketConfig.js';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getInvoiceDownloadUrl } from './lib/billingoService.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// USE SERVICE ROLE KEY (Essential for backend access bypassing RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  try {
    const { orderId, ticketId } = JSON.parse(event.body);

    if (!orderId && !ticketId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order ID or Ticket ID required' })
      };
    }

    let order;
    let tickets = [];
    let ticketEvent;

    if (orderId) {
      // Fetch order with tickets and event
      const { data: orderData, error: orderError } = await supabase
        .from('ticket_orders')
        .select(`
          *,
          ticket_events (*),
          tickets (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        throw new Error('Order not found or failed to fetch');
      }
      order = orderData;
      tickets = orderData.tickets || [];
      ticketEvent = orderData.ticket_events;
    } else {
      // Fetch single ticket (backward compatibility / reservation direct)
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_events (*)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) throw new Error('Ticket not found');
      tickets = [ticket];
      ticketEvent = ticket.ticket_events;
      order = { email: ticket.buyer_email, name: ticket.buyer_name };
    }

    if (!ticketEvent) {
      throw new Error('Event data missing for order/ticket');
    }

    // Get Invoice URL if available
    let invoiceUrl = null;
    if (order.billingo_invoice_id) {
      invoiceUrl = await getInvoiceDownloadUrl(order.billingo_invoice_id);
    }

    const eventDate = new Date(ticketEvent.date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email Config
    const emailConfig = getEmailConfig();
    const appleBadgeUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Add_to_Apple_Wallet_badge.svg/200px-Add_to_Apple_Wallet_badge.svg.png';
    const googleBadgeUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Google_Wallet_badge_HU.svg/200px-Google_Wallet_badge_HU.svg.png';

    // Generate Ticket Items HTML
    const ticketsHtml = tickets.map((t, idx) => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${t.qr_token}`;
      const walletPassUrl = `${getAppUrl()}/.netlify/functions/ticket-generate-pass-v2?ticketId=${t.id}`;
      const googleWalletUrl = `${getAppUrl()}/.netlify/functions/ticket-generate-google-pass?ticketId=${t.id}`;
      const printUrl = `${getAppUrl()}/tickets/print/${t.id}`;

      return `
        <div class="qr-section" style="margin-top: ${idx === 0 ? '0' : '40px'}; border-top: ${idx === 0 ? 'none' : '2px dashed #e5e5e5'};">
          <div class="qr-label">Belépőkód ${tickets.length > 1 ? `#${idx + 1}` : ''}</div>
          <img src="${qrUrl}" alt="QR Kód" class="qr-image" />
          <p style="font-size: 12px; color: #86868b; margin-top: 10px;">${t.qr_token}</p>
          
          <div class="btn-group" style="margin-top: 15px;">
            <a href="${walletPassUrl}" style="display: inline-block; margin-right: 10px; margin-bottom: 10px;">
              <img src="${appleBadgeUrl}" alt="Apple Wallet" style="height: 32px;" />
            </a>
            <a href="${googleWalletUrl}" style="display: inline-block; margin-bottom: 10px;">
              <img src="${googleBadgeUrl}" alt="Google Wallet" style="height: 32px;" />
            </a>
            <br />
            <a href="${printUrl}" style="display: inline-block; color: #0066cc; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 10px; border: 1px solid #0066cc; padding: 6px 12px; border-radius: 8px;">
              Nyomtatható Jegy / PDF
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: emailConfig.from,
      to: [order.email],
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
    .detail-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; color: #424245; }
    .detail-icon { margin-right: 10px; opacity: 0.7; }
    .qr-section { text-align: center; margin: 30px 0; padding: 30px 0; }
    .qr-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; margin-bottom: 15px; }
    .qr-image { width: 180px; height: 180px; background: white; padding: 10px; border-radius: 12px; border: 1px solid #e5e5e5; }
    .btn-group { text-align: center; }
    .invoice-btn { display: inline-block; background-color: #0066cc; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; margin-top: 20px; }
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
      <div class="greeting">Kedves ${order.name}!</div>
      <div class="lead">
        ${tickets[0]?.status === 'reserved'
          ? `Sikeresen lefoglaltad a helyedet! Elkészült ${tickets.length > 1 ? 'foglalási igazolásod' : 'foglalási igazolásod'} a következő eseményre:`
          : `Köszönjük a vásárlást! Elkészült ${tickets.length > 1 ? 'jegyeid' : 'jegyed'} a következő eseményre:`
        }
      </div>

      <div class="card">
        <h2 class="event-title">${ticketEvent.name}</h2>
        <div class="detail-row">
          <span class="detail-icon">📅</span> <strong>${eventDate}, ${ticketEvent.time}</strong>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span> ${ticketEvent.location}
        </div>
        <div class="detail-row">
          <span class="detail-icon">👥</span> ${tickets.length} fő részére
        </div>
      </div>

      ${ticketsHtml}

      ${invoiceUrl ? `
      <div style="text-align: center; margin: 40px 0; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 14px; color: #86868b; margin-bottom: 10px;">A vásárlásodról kiállított számlát az alábbi gombra kattintva töltheted le:</p>
        <a href="${invoiceUrl}" class="invoice-btn">Számla letöltése (PDF)</a>
      </div>
      ` : ''}
      
      <div class="warning">
        ${tickets[0]?.status === 'reserved'
          ? `<strong>Fontos:</strong> Ez egy foglalási igazolás. A jegy árát a helyszínen kell kifizetned. Kérjük, mutasd fel a QR kódot a belépéskor!`
          : `Ez a jegy egyszeri belépésre jogosít. Kérjük, ne oszd meg mással!`
        }
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

    if (emailError) {
      console.error('Resend error:', emailError);
      throw emailError;
    }

    // Update tickets email_sent_at
    const now = new Date().toISOString();
    const ticketIds = tickets.map(t => t.id);
    await supabase
      .from('tickets')
      .update({ email_sent_at: now })
      .in('id', ticketIds);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        emailId: emailData.id
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
