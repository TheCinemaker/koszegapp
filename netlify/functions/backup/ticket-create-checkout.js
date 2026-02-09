// Ticket System - Stripe Checkout Session Creator
// Creates a Stripe checkout session for ticket purchases

const { ticketConfig, getStripeConfig } = require('./lib/ticketConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { eventId, buyerName, buyerEmail, guestCount, ticketType } = JSON.parse(event.body);

        // Validate input
        if (!eventId || !buyerName || !buyerEmail || !guestCount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Fetch event details
        const { data: ticketEvent, error: eventError } = await supabase
            .from('ticket_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError || !ticketEvent) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Event not found' })
            };
        }

        // Check capacity
        const { data: existingTickets } = await supabase
            .from('tickets')
            .select('guest_count')
            .eq('event_id', eventId)
            .in('status', ['paid', 'used']);

        const totalGuests = (existingTickets || []).reduce((sum, t) => sum + t.guest_count, 0);

        if (totalGuests + guestCount > ticketEvent.capacity) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Not enough capacity' })
            };
        }

        // Calculate price
        const ticketPrice = parseFloat(ticketEvent.price) * guestCount;
        const serviceFee = ticketPrice * (parseFloat(ticketEvent.service_fee_percent) / 100);
        const totalAmount = Math.round((ticketPrice + serviceFee) * 100); // Convert to cents

        // Get Stripe config
        const stripeConfig = getStripeConfig();

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: stripeConfig.currency.toLowerCase(),
                        product_data: {
                            name: `${ticketEvent.name} - Jegy`,
                            description: `${guestCount} fő - ${ticketEvent.date} ${ticketEvent.time}`,
                        },
                        unit_amount: totalAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${stripeConfig.cancelUrl}?cancelled=true`,
            customer_email: buyerEmail,
            metadata: {
                event_id: eventId,
                buyer_name: buyerName,
                buyer_email: buyerEmail,
                guest_count: guestCount.toString(),
                ticket_type: ticketType || 'general'
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
        console.error('Checkout error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal server error' })
        };
    }
};
