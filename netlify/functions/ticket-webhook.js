// Ticket System - Stripe Webhook Handler (Robust Version)
// Handles raw body parsing, correct header casing, and explicit fetch

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { getAppUrl } = require('./lib/ticketConfig'); // Keep our config util

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Handle header casing inconsistency (Stripe-Signature vs stripe-signature)
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
        console.error('Missing Stripe-Signature header');
        return { statusCode: 400, body: 'Missing signature' };
    }

    let stripeEvent;

    try {
        // Critical: Stripe constructEvent requires the RAW body.
        // Netlify might base64 encode the body, so we must decode it if necessary.
        const rawBody = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf8')
            : event.body;

        if (webhookSecret) {
            stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } else {
            // Fallback for local testing without webhook secret (not recommended for production)
            stripeEvent = JSON.parse(rawBody);
        }
    } catch (err) {
        console.error('❌ Stripe signature error:', err.message);
        return {
            statusCode: 400,
            body: `Webhook Error: ${err.message}`,
        };
    }

    // Filter events
    if (stripeEvent.type !== 'checkout.session.completed') {
        return { statusCode: 200, body: 'Ignored' };
    }

    const session = stripeEvent.data.object;
    // Safe destructuring with default empty object
    const { event_id, buyer_name, buyer_email, guest_count, ticket_type } = session.metadata || {};

    try {
        let ticketId;

        // Idempotency check: Don't process the same session twice
        const { data: existing } = await supabase
            .from('tickets')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle(); // Use maybeSingle() to avoid error if not found

        if (existing) {
            console.log('Ticket already processed, resending email:', session.id);
            ticketId = existing.id;
            // Proceed to email sending logic below...
        } else {
            // Generate Ticket Data
            const qrToken = crypto.randomBytes(16).toString('hex');

            // Insert Ticket
            const { data: ticket, error } = await supabase
                .from('tickets')
                .insert({
                    event_id,
                    stripe_session_id: session.id,
                    buyer_name,
                    buyer_email,
                    buyer_email, // safety
                    guest_count: Number(guest_count || 1),
                    ticket_type: ticket_type || 'general',
                    qr_token: qrToken,
                    status: 'paid',
                    amount_paid: session.amount_total, // Save raw amount from Stripe
                })
                .select()
                .single();

            if (error) {
                console.error('Database Insert Error:', error);
                throw error;
            }
            ticketId = ticket.id;
            console.log('✅ Ticket created successfully:', ticketId);
        }

        // Fire-and-forget email sending -> CHANGED to await to ensure execution in serverless
        // Using explicit node-fetch to avoid runtime issues
        const confirmUrl = `${getAppUrl()}/.netlify/functions/ticket-send-confirmation`;
        console.log('Triggering email for ticket:', ticketId);

        try {
            const emailResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticketId }),
            });

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error(`❌ Failed to trigger email function: ${emailResponse.status} ${errorText}`);
                // We don't throw here to avoid failing the webhook response to Stripe
                // effectively "soft fail" on email, but ticket is created.
            } else {
                console.log('✅ Email trigger launched successfully');
            }
        } catch (fetchErr) {
            console.error('❌ Failed to trigger email function (network/fetch error):', fetchErr);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, ticketId: ticketId, resent: !!existing }),
        };

    } catch (err) {
        console.error('❌ Ticket processing error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal processing error' }),
        };
    }
};
