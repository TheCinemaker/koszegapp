// Ticket System - Email Confirmation Sender
// Sends ticket confirmation email with QR code

const fs = require('fs');
const path = require('path');

// Load config from file
const configPath = path.resolve(__dirname, 'certs/ticket-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const resend = new Resend(config.resend.apiKey);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
    try {
        const { ticketId } = JSON.parse(event.body);

        if (!ticketId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ticket ID required' })
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
                body: JSON.stringify({ error: 'Ticket not found' })
            };
        }

        // Generate QR code as base64
        const qrCodeDataUrl = await QRCode.toDataURL(ticket.qr_token, {
            width: 300,
            margin: 2
        });

        const event = ticket.ticket_events;
        const eventDate = new Date(event.date).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Apple Wallet link
        const walletPassUrl = `${config.url}/.netlify/functions/ticket-generate-pass?ticketId=${ticketId}`;

        // Send email
        const { data, error } = await resend.emails.send({
            from: config.resend.fromEmail,
            to: [ticket.buyer_email],
            subject: `🎟️ Jegyed: ${event.name}`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jegyed - ${event.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎟️ Jegyed elkészült!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Kedves <strong>${ticket.buyer_name}</strong>!
              </p>
              
              <p style="font-size: 16px; color: #374151; margin: 0 0 30px 0;">
                Sikeresen megvásároltad a jegyedet a következő eseményre:
              </p>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px;">${event.name}</h2>
                    <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                      📅 <strong>Dátum:</strong> ${eventDate}, ${event.time}
                    </p>
                    <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                      📍 <strong>Helyszín:</strong> ${event.location}
                    </p>
                    <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                      👥 <strong>Vendégek száma:</strong> ${ticket.guest_count} fő
                    </p>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 15px 0; font-weight: bold;">
                  A belépéshez szükséges QR kód:
                </p>
                <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 250px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px; background: white;" />
                <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">
                  Mutasd fel ezt a QR kódot a belépéskor
                </p>
              </div>

              <!-- Apple Wallet Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${walletPassUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                   Add hozzá az Apple Wallet-hez
                </a>
              </div>

              <!-- Important Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Fontos:</strong> Ez a jegy csak egyszer használható fel. Kérjük, őrizd meg és mutasd fel a belépéskor!
                </p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
                Kellemes szórakozást kívánunk!<br>
                <strong>KőszegAPP csapata</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Ha kérdésed van, írj nekünk: <a href="mailto:info@koszegapp.hu" style="color: #667eea;">info@koszegapp.hu</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
