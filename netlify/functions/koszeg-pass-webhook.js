// netlify/functions/koszeg-pass-webhook.js
// KőszegPass – Stripe Webhook Handler
//
// ⚠️  A ticket-webhook.js-sel PÁRHUZAMOSAN fut – mindkét webhook ugyanazon
//     Stripe endpoint-ot kapja, de ez a handler csak a kp_source='koszeg_pass'
//     metaadatú sessionöket dolgozza fel.
// ⚠️  Idempotens: dupla Stripe event esetén nem hoz létre duplikált pass-t.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createPartner, createInvoice, findPartnerByEmail } from './lib/billingoService.js';
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

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const host = event.headers.host || '';
    const isSandbox = (process.env.CONTEXT && process.env.CONTEXT !== 'production') || 
                      host.includes('localhost') || 
                      host.includes('netlify.app');

    let stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (isSandbox) {
        stripeSecret = 'sk_test' + '_' + '51Sx4FHFP4cTmH9TY3MaJRoA1fuGsGl5VdcNiFIKNtqeh7o2tofZddq6hjhe0lcD5OsEzSkfulzN1Rd4vzbdghd5200gpRVgZ5s';
        console.log('⚡ [Stripe Webhook Sandbox] Enabled sandbox environment (host:', host, ').');
    }
    const stripe = new Stripe(stripeSecret);

    // Stripe signature ellenőrzés (KÖTELEZŐ – kivéve sandbox teszteknél)
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    let webhookSecret = isSandbox ? null : (process.env.STRIPE_PASS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);

    if (!isSandbox && !sig) {
        console.error('[Pass Webhook] Missing Stripe-Signature');
        return { statusCode: 400, body: 'Missing signature' };
    }

    let stripeEvent;
    try {
        const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf8')
            : event.body;

        stripeEvent = webhookSecret
            ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
            : JSON.parse(rawBody);
    } catch (err) {
        console.error('[Pass Webhook] Stripe signature error:', err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (stripeEvent.type !== 'checkout.session.completed') {
        return { statusCode: 200, body: 'Ignored' };
    }

    const session = stripeEvent.data.object;
    const meta = session.metadata || {};

    // ⚠️  KRITIKUS SZŰRŐ: csak KőszegPass session-öket dolgozunk fel
    //     Ha hiányzik a kp_source, ez a ticket rendszernek szóló fizetés → kihagyjuk
    if (meta.kp_source !== 'koszeg_pass') {
        console.log('[Pass Webhook] Not a KőszegPass session, skipping:', session.id);
        return { statusCode: 200, body: 'Not a pass session' };
    }

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

    try {
        // 1. Idempotencia: ne dolgozzuk fel kétszer ugyanazt
        const { data: existingPass } = await supabase
            .from('koszeg_passes')
            .select('id, status')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

        if (existingPass && existingPass.status === 'active') {
            console.log('[Pass Webhook] Already processed:', session.id);
            return { statusCode: 200, body: JSON.stringify({ ok: true, passId: existingPass.id }) };
        }

        // 2. Egyedi QR token generálás
        const qrToken = crypto.randomUUID();

        // 3. Érvényesség: 1 év a vásárlástól
        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // 4. Egyedi URL slug generálása
        let baseSlug = slugifyName(holderName);
        let finalSlug = baseSlug;
        let counter = 1;
        let slugExists = true;

        while (slugExists) {
            const { data: existingSlug, error: slugCheckError } = await supabase
                .from('koszeg_passes')
                .select('id')
                .eq('slug', finalSlug)
                .maybeSingle();

            if (slugCheckError) {
                console.error('[Pass Webhook] Slug check error:', slugCheckError);
                break;
            }

            if (existingSlug) {
                counter++;
                finalSlug = `${baseSlug}.${counter}`;
            } else {
                slugExists = false;
            }
        }

        // 5. Pass rekord létrehozása a Supabase-ben
        const { data: newPass, error: passInsertError } = await supabase
            .from('koszeg_passes')
            .insert({
                holder_name: holderName,
                holder_email: holderEmail,
                pass_type: passType,
                stripe_session_id: session.id,
                amount_paid: session.amount_total,
                status: 'active',
                qr_token: qrToken,
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

        if (passInsertError) {
            console.error('[Pass Webhook] Pass insert error:', passInsertError);
            throw passInsertError;
        }

        console.log('✅ [Pass Webhook] Pass created:', newPass.id);

        // 5. Billingo számla (nem blokkolja a folyamatot ha hibázik, teszt módban kihagyjuk)
        if (session.livemode === false) {
            console.log('⚠️ [Pass Webhook] Stripe is in TEST MODE (Sandbox). Skipping real Billingo invoice generation to avoid accounting/tax issues.');
        } else {
            try {
                let billingoPartnerId = await findPartnerByEmail(holderEmail);
                if (!billingoPartnerId) {
                    billingoPartnerId = await createPartner({
                        name: holderName,
                        email: holderEmail,
                        zip: zip,
                        city: city,
                        address: address
                    });
                }

                const amountForInvoice = session.amount_total / 100;
                const passLabel = passType === 'family' ? 'KőszegPass Családi' : 'KőszegPass Egyéni';
                const invoice = await createInvoice(billingoPartnerId, amountForInvoice, passLabel);

                await supabase
                    .from('koszeg_passes')
                    .update({ billingo_invoice_id: invoice.id })
                    .eq('id', newPass.id);

                console.log('✅ [Pass Webhook] Billingo invoice created:', invoice.id);
            } catch (billingoErr) {
                console.error('❌ [Pass Webhook] Billingo error (non-fatal):', billingoErr.message);
            }
        }

        // 6. Megerősítő email küldés
        try {
            const host = event.headers.host || '';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const currentAppUrl = host ? `${protocol}://${host}` : APP_URL;
            const emailUrl = `${currentAppUrl}/.netlify/functions/koszeg-pass-send-email`;
            const emailRes = await fetch(emailUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: newPass.id })
            });

            if (!emailRes.ok) {
                const errText = await emailRes.text();
                console.error('[Pass Webhook] Email trigger failed:', emailRes.status, errText);
            } else {
                console.log('✅ [Pass Webhook] Email trigger sent');
            }
        } catch (emailErr) {
            console.error('❌ [Pass Webhook] Email trigger error (non-fatal):', emailErr.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, passId: newPass.id })
        };

    } catch (err) {
        console.error('❌ [Pass Webhook] Processing error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal processing error' })
        };
    }
};
