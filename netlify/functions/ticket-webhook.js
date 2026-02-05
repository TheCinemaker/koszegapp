// Ticket System - Stripe Webhook Handler
// Processes Stripe payment events and creates tickets

const { ticketConfig, getAppUrl } = require('./lib/ticketConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
        // Verify webhook signature
        if (webhookSecret) {
            stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
        } else {
            // For testing without webhook secret
            stripeEvent = JSON.parse(event.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
        };
    }

    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;

        try {
            // Extract metadata
            const { event_id, buyer_name, buyer_email, guest_count, ticket_type } = session.metadata;

            // Check if ticket already exists (idempotency)
            const { data: existingTicket } = await supabase
                .from('tickets')
                .select('id')
                .eq('stripe_session_id', session.id)
                .single();

            if (existingTicket) {
                console.log('Ticket already exists for session:', session.id);
                return { statusCode: 200, body: JSON.stringify({ received: true }) };
            }

            // Generate unique QR token (length from config)
            const qrToken = crypto.randomBytes(ticketConfig.qr.tokenLength).toString('hex');

            // Create ticket
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    event_id: event_id,
                    stripe_session_id: session.id,
                    buyer_name: buyer_name,
                    buyer_email: buyer_email,
                    guest_count: parseInt(guest_count),
                    ticket_type: ticket_type || 'general',
                    qr_token: qrToken,
                    status: 'paid',
                    amount_paid: session.amount_total / 100 // Convert from cents
                })
                .select()
                .single();

            if (ticketError) {
                console.error('Error creating ticket:', ticketError);
                throw ticketError;
            }

            console.log('Ticket created:', ticket.id);

            // Trigger email sending (async - don't wait)
            fetch(`${getAppUrl()}/.netlify/functions/ticket-send-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticket.id })
            }).catch(err => console.error('Error triggering email:', err));

            return {
                statusCode: 200,
                body: JSON.stringify({ received: true, ticketId: ticket.id })
            };

        } catch (error) {
            console.error('Error processing webhook:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    }

    // Return 200 for other event types
    return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
    };
};
