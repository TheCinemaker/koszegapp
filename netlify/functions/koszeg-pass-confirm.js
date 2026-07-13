// netlify/functions/koszeg-pass-confirm.js
// KőszegPass – Vásárlás megerősítése a /pass/success oldalról
//
// MIÉRT KELL EZ?
//   A pass létrehozása normál esetben a koszeg-pass-webhook dolga (mint a ticket
//   rendszerben). A webhook viszont csak akkor fut le, ha a Stripe-ban regisztrálva
//   van az adott deploy URL-re – dev branch deploy / preview esetén ez tipikusan nincs.
//   Ez a függvény a success oldalról hívva BEPÓTOLJA a passt, ha a webhook nem jött meg.
//
// BIZTONSÁG:
//   Nem hiszünk a kliensnek. A Stripe-tól kérdezzük le a sessiont, és CSAK akkor
//   hozunk létre passt, ha payment_status === 'paid' ÉS a metadata kp_source === 'koszeg_pass'.
//   A session_id-t csak a vevő ismeri (a Stripe adja a success_url-ben).
//
// IDEMPOTENS:
//   stripe_session_id UNIQUE → ha a webhook már létrehozta, csak visszaadjuk.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fetch from 'node-fetch';

// ⚠️  SERVICE ROLE kell: a koszeg_passes táblán RLS van és nincs anon INSERT policy
//     (lásd supabase_migration.sql). Anon kulccsal az insert csendben elbukna.
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.URL || 'https://visitkoszeg.hu';

function slugifyName(name) {
    const accents = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
        'ú': 'u', 'ü': 'u', 'ű': 'u',
        'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ö': 'o', 'Ő': 'o',
        'Ú': 'u', 'Ü': 'u', 'Ű': 'u'
    };
    let clean = name.split('').map(char => accents[char] || char).join('');
    clean = clean.toLowerCase()
                 .replace(/[^a-z0-9\s.-]/g, '')
                 .trim()
                 .replace(/[\s.-]+/g, '.');
    return clean || 'visitor';
}

// Csak a megjelenítéshez szükséges mezők mennek vissza a kliensnek.
// (A qr_token igen – a vevő fizetett, neki kell a QR + az állandó link.)
function toPublicPass(row) {
    return {
        id:           row.id,
        serial:       row.serial,
        holder_name:  row.holder_name,
        pass_type:    row.pass_type,
        status:       row.status,
        purchased_at: row.purchased_at,
        expires_at:   row.expires_at,
        slug:         row.slug,
        qr_token:     row.qr_token
    };
}

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sessionId =
        (event.queryStringParameters && event.queryStringParameters.session_id) ||
        (event.body ? (JSON.parse(event.body).sessionId || JSON.parse(event.body).session_id) : null);

    if (!sessionId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'session_id required' }) };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[Pass Confirm] SUPABASE_SERVICE_ROLE_KEY is missing!');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' })
        };
    }

    // Ugyanaz a sandbox-logika mint a checkoutban – a session a test-módú
    // Stripe fiókban jött létre, tehát test kulccsal kell lekérdezni.
    const host = event.headers.host || '';
    const isSandbox = (process.env.CONTEXT && process.env.CONTEXT !== 'production') ||
                      host.includes('localhost') ||
                      host.includes('netlify.app');

    let stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (isSandbox) {
        stripeSecret = 'sk_test' + '_' + '51Sx4FHFP4cTmH9TY3MaJRoA1fuGsGl5VdcNiFIKNtqeh7o2tofZddq6hjhe0lcD5OsEzSkfulzN1Rd4vzbdghd5200gpRVgZ5s';
        console.log('⚡ [Pass Confirm Sandbox] Using test key (host:', host, ')');
    }
    const stripe = new Stripe(stripeSecret);

    try {
        // 1. Már létezik? (a webhook megelőzhetett minket) → csak add vissza
        const { data: existing, error: existingErr } = await supabase
            .from('koszeg_passes')
            .select('*')
            .eq('stripe_session_id', sessionId)
            .maybeSingle();

        if (existingErr) {
            console.error('[Pass Confirm] Lookup error:', existingErr);
            throw existingErr;
        }

        if (existing) {
            console.log('[Pass Confirm] Pass already exists:', existing.id);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ pass: toPublicPass(existing), created: false })
            };
        }

        // 2. Nincs pass → a STRIPE a hiteles forrás: tényleg fizettek?
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const meta = session.metadata || {};

        if (meta.kp_source !== 'koszeg_pass') {
            console.warn('[Pass Confirm] Not a KőszegPass session:', sessionId);
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not a KőszegPass session' }) };
        }

        if (session.payment_status !== 'paid') {
            console.warn('[Pass Confirm] Session not paid:', sessionId, session.payment_status);
            return {
                statusCode: 402,
                headers,
                body: JSON.stringify({ error: 'A fizetés még nem teljesült.', payment_status: session.payment_status })
            };
        }

        // 3. Pass létrehozása (a webhookkal azonos mezőkkel)
        const {
            kp_pass_type: passType,
            kp_holder_name: holderName,
            kp_holder_email: holderEmail,
            kp_zip: zip,
            kp_city: city,
            kp_address: address,
            kp_hotel_source: hotelSource,
            kp_origin_zip: originZip,
            kp_phone: phone,
            kp_extra_info: extraInfo
        } = meta;

        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const baseSlug = slugifyName(holderName);
        let finalSlug = baseSlug;
        let counter = 1;

        while (true) {
            const { data: slugTaken, error: slugErr } = await supabase
                .from('koszeg_passes')
                .select('id')
                .eq('slug', finalSlug)
                .maybeSingle();

            if (slugErr) {
                console.error('[Pass Confirm] Slug check error:', slugErr);
                break;
            }
            if (!slugTaken) break;

            counter++;
            finalSlug = `${baseSlug}.${counter}`;
        }

        const { data: newPass, error: insertErr } = await supabase
            .from('koszeg_passes')
            .insert({
                holder_name: holderName,
                holder_email: holderEmail,
                pass_type: passType,
                stripe_session_id: session.id,
                amount_paid: session.amount_total,
                status: 'active',
                qr_token: crypto.randomUUID(),
                slug: finalSlug,
                purchased_at: purchasedAt.toISOString(),
                expires_at: expiresAt.toISOString(),
                hotel_source: hotelSource || null,
                origin_zip: originZip || null,
                phone: phone || null,
                extra_info: extraInfo || null,
                billing_zip: zip,
                billing_city: city,
                billing_address: address
            })
            .select()
            .single();

        if (insertErr) {
            // 23505 = unique violation → a webhook közben mégis létrehozta (verseny).
            // Nem hiba: olvassuk vissza az ő sorát.
            if (insertErr.code === '23505') {
                const { data: raced } = await supabase
                    .from('koszeg_passes')
                    .select('*')
                    .eq('stripe_session_id', sessionId)
                    .maybeSingle();

                if (raced) {
                    console.log('[Pass Confirm] Race with webhook, returning existing:', raced.id);
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ pass: toPublicPass(raced), created: false })
                    };
                }
            }
            console.error('[Pass Confirm] Insert error:', insertErr);
            throw insertErr;
        }

        console.log('✅ [Pass Confirm] Pass created:', newPass.id);

        // 4. Megerősítő email (nem blokkolja a választ, ha hibázik)
        try {
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const emailUrl = host
                ? `${protocol}://${host}/.netlify/functions/koszeg-pass-send-email`
                : `${APP_URL}/.netlify/functions/koszeg-pass-send-email`;

            const emailRes = await fetch(emailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: newPass.id })
            });

            if (!emailRes.ok) {
                console.error('[Pass Confirm] Email trigger failed:', emailRes.status, await emailRes.text());
            } else {
                console.log('✅ [Pass Confirm] Email trigger sent to', holderEmail);
            }
        } catch (emailErr) {
            console.error('[Pass Confirm] Email trigger error (non-fatal):', emailErr.message);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ pass: toPublicPass(newPass), created: true })
        };

    } catch (err) {
        console.error('❌ [Pass Confirm] Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Internal error' })
        };
    }
};
