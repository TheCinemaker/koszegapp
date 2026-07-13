// netlify/functions/koszeg-pass-send-email.js
// KőszegPass – Megerősítő email (Apple Wallet + Google Wallet + QR)
//
// ⚠️  Saját email template – más mint a ticket visszaigazoló
// Emailt a Resend API-val küldi (ugyanaz mint a ticket rendszer)

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.URL || 'https://visitkoszeg.hu';

export const handler = async (event) => {
    try {
        const { passId } = JSON.parse(event.body);

        if (!passId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'passId required' }) };
        }

        // 1. Pass adatok lekérdezése
        const { data: passData, error: passError } = await supabase
            .from('koszeg_passes')
            .select('*')
            .eq('id', passId)
            .single();

        if (passError || !passData) {
            console.error('[Pass Email] Pass not found:', passId, passError);
            return { statusCode: 404, body: JSON.stringify({ error: 'Pass not found' }) };
        }

        // 2. QR kód generálás (base64 PNG – beágyazva az emailbe)
        const verifyUrl = `${APP_URL}/verify-pass/${passData.qr_token}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            width: 280,
            margin: 2,
            color: { dark: '#0C234B', light: '#FFFFFF' }
        });
        // base64 string kinyerése (data:image/png;base64, ... rész nélkül)
        const qrBase64 = qrDataUrl.split(',')[1];

        // 3. Wallet linkek
        const appleWalletUrl = `${APP_URL}/.netlify/functions/koszeg-pass-apple?passId=${passData.id}`;
        const googleWalletUrl = `${APP_URL}/.netlify/functions/koszeg-pass-google?passId=${passData.id}`;

        // 4. Dátum formázás
        const formatHu = (dateStr) =>
            new Date(dateStr).toLocaleDateString('hu-HU', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

        const passTypeLabel = passData.pass_type === 'family' ? 'Családi Pass' : 'Egyéni Pass';

        // 5. Email HTML template
        const emailHtml = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KőszegPass – Üdvözöljük!</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f6fa;">

  <!-- Fejléc -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C234B;padding:32px 0;">
    <tr>
      <td align="center">
        <img src="https://visitkoszeg.hu/images/koeszeg_logo_nobg.png" alt="VisitKőszeg" width="120" style="display:block;" />
        <h1 style="color:#C8AF64;font-size:26px;font-weight:900;margin:16px 0 4px;letter-spacing:0.05em;">KőszegPass</h1>
        <p style="color:#ffffff;font-size:13px;margin:0;opacity:0.7;">Turisztikai kedvezménykártya</p>
      </td>
    </tr>
  </table>

  <!-- Fő tartalom -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(12,35,75,0.10);">

          <!-- Üdvözlés -->
          <tr>
            <td style="padding:40px 40px 24px;border-bottom:1px solid #eef0f6;">
              <h2 style="color:#0C234B;font-size:20px;margin:0 0 12px;">Üdvözöljük, ${passData.holder_name}!</h2>
              <p style="color:#444;font-size:15px;line-height:1.6;margin:0;">
                Köszönjük a KőszegPass megvásárlását! Kártyája aktív, és máris felhasználhatja
                Kőszeg összes elfogadóhelyén. Mutassa fel QR-kódját kedvezmény igénybevételéhez.
              </p>
            </td>
          </tr>

          <!-- Pass kártya vizuál -->
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#0C234B 0%,#1a3d7a 100%);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="color:#C8AF64;font-size:10px;font-weight:700;letter-spacing:0.15em;margin:0 0 4px;text-transform:uppercase;">KőszegPass</p>
                    <p style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 16px;">${passData.holder_name}</p>
                    <p style="color:#aab8cc;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.1em;">Típus</p>
                    <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 16px;">${passTypeLabel}</p>
                    <p style="color:#aab8cc;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.1em;">Érvényes</p>
                    <p style="color:#C8AF64;font-size:14px;font-weight:700;margin:0;">${formatHu(passData.expires_at)}</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <img src="cid:qrcode" alt="QR kód" width="120" height="120"
                         style="display:block;border-radius:8px;border:3px solid rgba(255,255,255,0.15);" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Wallet gombok -->
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #eef0f6;">
              <h3 style="color:#0C234B;font-size:15px;font-weight:700;margin:0 0 16px;">Mentse telefonjára</h3>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${appleWalletUrl}"
                       style="display:inline-block;background:#000000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;">
                      🍎 Apple Wallet
                    </a>
                  </td>
                  <td>
                    <a href="${googleWalletUrl}"
                       style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;">
                      🔵 Google Wallet
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#888;font-size:11px;margin:12px 0 0;line-height:1.5;">
                Az Apple Wallet gombra kattintva a .pkpass fájl töltődik le – nyissa meg iPhone-on.<br/>
                A Google Wallet gombra kattintva automatikusan hozzáadódik Google Pay fiókjához.
              </p>
            </td>
          </tr>

          <!-- Részletek -->
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #eef0f6;">
              <h3 style="color:#0C234B;font-size:15px;font-weight:700;margin:0 0 16px;">Pass részletei</h3>
              <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;color:#444;">
                <tr>
                  <td style="color:#888;width:140px;">Pass azonosító:</td>
                  <td style="font-family:monospace;font-size:12px;color:#0C234B;">${passData.qr_token}</td>
                </tr>
                <tr>
                  <td style="color:#888;">Vásárolva:</td>
                  <td>${formatHu(passData.purchased_at)}</td>
                </tr>
                <tr>
                  <td style="color:#888;">Érvényes:</td>
                  <td style="color:#0C234B;font-weight:700;">${formatHu(passData.expires_at)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Felhasználás -->
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #eef0f6;">
              <h3 style="color:#0C234B;font-size:15px;font-weight:700;margin:0 0 12px;">Hogyan használja?</h3>
              <p style="color:#555;font-size:13px;line-height:1.7;margin:0;">
                1. Mutassa fel QR-kódját (telefonon, kinyomtatva, vagy walletben) bármely elfogadóhelyen.<br/>
                2. A kedvezmény mértékét az adott elfogadóhely határozza meg.<br/>
                3. A kártyát nem szükséges regisztrálni – bemutatása elegendő.
              </p>
            </td>
          </tr>

          <!-- Lábléc -->
          <tr>
            <td style="padding:24px 40px;background:#f8f9fc;text-align:center;">
              <p style="color:#888;font-size:11px;margin:0 0 8px;">
                Kőszegi Turisztikai Szövetség | <a href="https://visitkoszeg.hu" style="color:#0C234B;">visitkoszeg.hu</a>
              </p>
              <p style="color:#bbb;font-size:10px;margin:0;">
                Ez az email automatikusan generálódott. Kérdés esetén: info@visitkoszeg.hu
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

        // 6. Email küldés (QR kép beágyazva)
        const emailResult = await resend.emails.send({
            from: 'KőszegPass <pass@visitkoszeg.hu>',
            to: [passData.holder_email],
            subject: `✅ KőszegPass aktiválva – ${passData.holder_name}`,
            html: emailHtml,
            attachments: [
                {
                    filename: 'koszegpass_qr.png',
                    content: qrBase64,
                    content_type: 'image/png',
                    content_id: 'qrcode'  // cid: referencia az emailben
                }
            ]
        });

        console.log('✅ [Pass Email] Sent to:', passData.holder_email, '| ID:', emailResult.id);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, emailId: emailResult.id })
        };

    } catch (err) {
        console.error('❌ [Pass Email] Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
