import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// Pass árak (HUF, fillér alapon Stripe-nak: × 100)
const PASS_PRICES = {
    individual: 400000,  // 4000 HUF × 100 fillér
    family:    1000000   // 10000 HUF × 100 fillér
};

const PASS_LABELS = {
    individual: 'KőszegPass Egyéni – 1 éves érvényesség',
    family:     'KőszegPass Családi – 1 éves érvényesség (2 felnőtt + gyerekek)'
};

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
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const host = event.headers.host || '';
    const isSandbox = (process.env.CONTEXT && process.env.CONTEXT !== 'production') || 
                      host.includes('localhost') || 
                      host.includes('netlify.app');

    let stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (isSandbox) {
        stripeSecret = 'sk_test' + '_' + '51Sx4FHFP4cTmH9TY3MaJRoA1fuGsGl5VdcNiFIKNtqeh7o2tofZddq6hjhe0lcD5OsEzSkfulzN1Rd4vzbdghd5200gpRVgZ5s';
        console.log('⚡ [Stripe Sandbox] Forcing test key in non-production context (host:', host, ')');
    }
    const stripe = new Stripe(stripeSecret);

    try {
        const {
            passType,       // 'individual' | 'family'
            holderName,     // a névjegyen megjelenő név
            holderEmail,    // email cím
            zip,            // számlázási irányítószám
            city,           // számlázási város
            address,        // számlázási cím
            hotelSource,    // opcionális: melyik szállodai QR-ból jött (tracking)
            originZip,      // opcionális: honnan érkezett a turista
            phone,          // opcionális: telefon
            extraInfo       // opcionális: turisztikai statisztika
        } = JSON.parse(event.body);

        // Validálás
        if (!passType || !holderName || !holderEmail || !zip || !city || !address) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Hiányzó kötelező mezők: passType, holderName, holderEmail, zip, city, address' })
            };
        }

        if (!PASS_PRICES[passType]) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Érvénytelen pass típus. Allowed: individual, family' })
            };
        }

        const amount = PASS_PRICES[passType];
        const label = PASS_LABELS[passType];

        let requestOrigin = APP_URL;
        if (event.headers.origin) {
            requestOrigin = event.headers.origin;
        } else if (event.headers.referer) {
            try {
                requestOrigin = new URL(event.headers.referer).origin;
            } catch (e) {
                // fallback
            }
        }

        // Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'huf',
                        product_data: {
                            name: label,
                            description: `Névjegy: ${holderName} | Kiállítja: Kőszegi Turisztikai Szövetség`,
                            images: ['https://visitkoszeg.hu/images/koszegpass_cover.jpg']
                        },
                        unit_amount: amount
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            // ⚠️  /pass/success route → PassSuccess.jsx fogja kezelni
            success_url: `${requestOrigin}/pass/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${requestOrigin}/pass/buy?cancelled=true`,
            customer_email: holderEmail,
            // ⚠️  Metadata kulcsok: "kp_" prefix → webhook egyértelműen azonosíthatja
            //     hogy ez KőszegPass és nem ticket vásárlás
            metadata: {
                kp_source: 'koszeg_pass',           // ← webhook distinguisher!
                kp_pass_type: passType,
                kp_holder_name: holderName,
                kp_holder_email: holderEmail,
                kp_zip: zip,
                kp_city: city,
                kp_address: address,
                kp_hotel_source: hotelSource || '',
                kp_origin_zip: originZip || '',
                kp_phone: phone || '',
                kp_extra_info: extraInfo || ''
            }
        });

        // In sandbox mode, immediately create the active pass record in the database.
        // This bypasses the need for Stripe webhook delivery to preview/localhost sites during testing.
        if (isSandbox) {
            try {
                const qrToken = crypto.randomUUID();
                const purchasedAt = new Date();
                const expiresAt = new Date(purchasedAt);
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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
                        console.error('[Stripe Sandbox Checkout] Slug check error:', slugCheckError);
                        break;
                    }

                    if (existingSlug) {
                        counter++;
                        finalSlug = `${baseSlug}.${counter}`;
                    } else {
                        slugExists = false;
                    }
                }

                // Insert into Supabase
                const { data: newPass, error: passInsertError } = await supabase
                    .from('koszeg_passes')
                    .insert({
                        holder_name: holderName,
                        holder_email: holderEmail,
                        pass_type: passType,
                        stripe_session_id: session.id,
                        amount_paid: amount,
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
                    console.error('[Stripe Sandbox Checkout] Pass insert error:', passInsertError);
                } else {
                    console.log('⚡ [Stripe Sandbox Checkout] Pass pre-created successfully:', newPass.id);
                }
            } catch (innerErr) {
                console.error('[Stripe Sandbox Checkout] Failed to pre-create pass:', innerErr);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                checkoutUrl: session.url,
                sessionId: session.id
            })
        };

    } catch (error) {
        console.error('KőszegPass Checkout Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
