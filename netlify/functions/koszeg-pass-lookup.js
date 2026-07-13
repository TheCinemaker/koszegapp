// netlify/functions/koszeg-pass-lookup.js
// KőszegPass – "Megkeresem a kártyám" (magic link)
//
// POST { email } → megkeresi az adott e-mailhez tartozó AKTÍV pass(oka)t,
//                  és e-mailben visszaküldi a személyes, állandó linke(ke)t:
//                  {APP_URL}/p/{slug}?token={qr_token}
//
// ⚠️  Anti-enumeráció: MINDIG generikus sikeres választ ad, függetlenül attól,
//     hogy létezik-e pass az adott címre → nem szivárogtatja ki, ki vásárolt.

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.URL || 'https://visitkoszeg.hu';

const GENERIC_OK = {
    statusCode: 200,
    body: JSON.stringify({
        ok: true,
        message: 'Ha van érvényes KőszegPass ehhez az e-mail címhez, elküldtük rá a hozzáférési linket.'
    })
};

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email } = JSON.parse(event.body || '{}');
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Érvénytelen e-mail cím.' }) };
        }

        // Aktív passok az adott e-mailhez (service role → bypass RLS)
        const { data: passes, error } = await supabase
            .from('koszeg_passes')
            .select('holder_name, pass_type, slug, qr_token, expires_at, status')
            .ilike('holder_email', normalizedEmail)  // case-insensitive pontos egyezés
            .eq('status', 'active');

        if (error) {
            console.error('[Pass Lookup] DB error:', error);
            // Belső hibát sem szivárogtatunk – generikus válasz
            return { ...GENERIC_OK, headers };
        }

        // Nincs találat → akkor is generikus OK (anti-enumeráció), e-mailt nem küldünk
        if (!passes || passes.length === 0) {
            console.log('[Pass Lookup] No active pass for given email (generic OK returned).');
            return { ...GENERIC_OK, headers };
        }

        // Link(ek) összeállítása
        const rows = passes.map((p) => {
            const link = `${APP_URL}/p/${p.slug}?token=${p.qr_token}`;
            const typeLabel = p.pass_type === 'family' ? 'Családi Pass' : 'Egyéni Pass';
            return { link, typeLabel, holderName: p.holder_name };
        });

        const cardsHtml = rows
            .map(
                (r) => `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #eef0f6;">
            <p style="margin:0 0 4px;color:#0C234B;font-weight:700;font-size:15px;">${r.holderName} · ${r.typeLabel}</p>
            <a href="${r.link}"
               style="display:inline-block;margin-top:8px;background:#C8AF64;color:#0C234B;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:800;">
              Kártya megnyitása →
            </a>
          </td>
        </tr>`
            )
            .join('');

        const emailHtml = `
<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f6fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C234B;padding:28px 0;">
    <tr><td align="center">
      <h1 style="color:#C8AF64;font-size:24px;font-weight:900;margin:0;letter-spacing:0.05em;">KőszegPass</h1>
      <p style="color:#fff;font-size:13px;margin:6px 0 0;opacity:0.7;">A személyes kártyád</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(12,35,75,0.10);">
        <tr><td style="padding:36px 40px 8px;">
          <h2 style="color:#0C234B;font-size:19px;margin:0 0 10px;">Itt a kártyád linkje</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
            A lenti gombra kattintva bármikor megnyithatod a KőszegPass kártyád – nincs szükség
            Apple vagy Google Wallet-re. Tipp: mentsd el a linket, vagy tedd ki a telefonod kezdőképernyőjére!
          </p>
        </td></tr>
        <tr><td style="padding:8px 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">${cardsHtml}</table>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f8f9fc;text-align:center;">
          <p style="color:#888;font-size:11px;margin:0;">
            Ha nem te kérted ezt a levelet, nyugodtan hagyd figyelmen kívül.<br/>
            Kőszegi Turisztikai Szövetség · <a href="https://visitkoszeg.hu" style="color:#0C234B;">visitkoszeg.hu</a>
          </p>
        </td></tr>
      </table>
    </td>
  </tr></table>
</body>
</html>`;

        // A küldő domain a Resendben hitelesített koszegapp.hu (a visitkoszeg.hu nem az).
        // A Resend SDK nem dob kivételt – az error-t explicit nézni kell.
        const { error: emailError } = await resend.emails.send({
            from: 'KőszegPass <pass@koszegapp.hu>',
            to: [normalizedEmail],
            subject: '🎫 A KőszegPass kártyád linkje',
            html: emailHtml
        });

        if (emailError) {
            // Kifelé így is generikus választ adunk (nem áruljuk el, létezik-e a cím),
            // de a logban legyen nyoma.
            console.error('❌ [Pass Lookup] Resend error:', emailError);
            return { ...GENERIC_OK, headers };
        }

        console.log('✅ [Pass Lookup] Link email sent to:', normalizedEmail, '| passes:', rows.length);

        return { ...GENERIC_OK, headers };

    } catch (err) {
        console.error('❌ [Pass Lookup] Error:', err);
        // Hibát sem részletezünk kifelé
        return { ...GENERIC_OK, headers };
    }
};
