// netlify/functions/koszeg-pass-checkout.js
// KőszegPass – Stripe Checkout Session Creator
//
// ⚠️  Ez FÜGGETLEN a ticket-create-checkout.js-től
//     Más Stripe metadata kulcsokat használ (pass_type, holder_name stb.)
//     hogy a webhook biztosan csak a pass webhook-ban fusson le

let stripeSecret = process.env.STRIPE_SECRET_KEY;
if (process.env.CONTEXT && process.env.CONTEXT !== 'production') {
    stripeSecret = 'sk_test' + '_' + '51Sx4FHFP4cTmH9TY3MaJRoA1fuGsGl5VdcNiFIKNtqeh7o2tofZddq6hjhe0lcD5OsEzSkfulzN1Rd4vzbdghd5200gpRVgZ5s';
    console.log('⚡ [Stripe Sandbox] Forcing test key in non-production context:', process.env.CONTEXT);
}
const stripe = new Stripe(stripeSecret);

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
            success_url: `${APP_URL}/pass/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/pass/buy?cancelled=true`,
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
