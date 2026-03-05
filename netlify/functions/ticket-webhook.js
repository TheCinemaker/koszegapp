// Ticket System - Stripe Webhook Handler (Robust Version)
// Handles raw body parsing, correct header casing, and explicit fetch

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { getAppUrl } from './lib/ticketConfig.js';
import { createPartner, createInvoice, findPartnerByEmail } from './lib/billingoService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
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
    const {
        event_id,
        buyer_name,
        buyer_email,
        zip,
        city,
        address,
        guest_count,
        ticket_type
    } = session.metadata || {};

    try {
        let orderId;
        let ticketIds = [];

        // Idempotency check: Don't process the same session twice
        const { data: existingOrder } = await supabase
            .from('ticket_orders')
            .select('id, status')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

        if (existingOrder && existingOrder.status !== 'pending') {
            console.log('Order already processed:', session.id);
            orderId = existingOrder.id;
        } else {
            // 1. Create or Update Order
            let order;
            if (existingOrder) {
                const { data: updatedOrder, error: updateError } = await supabase
                    .from('ticket_orders')
                    .update({ status: 'paid' })
                    .eq('id', existingOrder.id)
                    .select()
                    .single();
                if (updateError) throw updateError;
                order = updatedOrder;
            } else {
                const { data: newOrder, error: insertError } = await supabase
                    .from('ticket_orders')
                    .insert({
                        event_id,
                        stripe_session_id: session.id,
                        name: buyer_name,
                        email: buyer_email,
                        zip: zip,
                        city: city,
                        address: address,
                        amount: session.amount_total,
                        status: 'paid'
                    })
                    .select()
                    .single();
                if (insertError) throw insertError;
                order = newOrder;
            }
            orderId = order.id;

            // 2. Billingo Integration
            try {
                console.log('Checking for existing Billingo Partner...');
                let partnerId = await findPartnerByEmail(buyer_email);

                if (!partnerId) {
                    console.log('No existing partner found, creating new Billingo Partner...');
                    partnerId = await createPartner({
                        name: buyer_name,
                        email: buyer_email,
                        zip: zip,
                        city: city,
                        address: address
                    });
                } else {
                    console.log('Using existing Billingo Partner:', partnerId);
                }

                console.log('Creating Billingo Invoice...');
                // Get event name for invoice
                const { data: evt } = await supabase.from('ticket_events').select('name').eq('id', event_id).single();

                // Handle zero-decimal currencies (like HUF)
                const isZeroDecimal = session.currency.toUpperCase() === 'HUF' ||
                    ['JPY', 'KRW', 'VND'].includes(session.currency.toUpperCase());
                const amountForInvoice = isZeroDecimal ? session.amount_total : session.amount_total / 100;

                const invoice = await createInvoice(partnerId, amountForInvoice, evt?.name || 'Rendezvény jegy');

                // Update Order with Billingo IDs
                await supabase
                    .from('ticket_orders')
                    .update({
                        billingo_partner_id: partnerId,
                        billingo_invoice_id: invoice.id
                    })
                    .eq('id', orderId);

                console.log('✅ Billingo Invoice created:', invoice.id);
            } catch (billingoErr) {
                console.error('❌ Billingo Error (Continuing anyway to ensure tickets):', billingoErr.message);
                // We log but don't stop the flow so user still gets tickets
            }

            // 3. Generate Tickets
            const count = Number(guest_count || 1);
            for (let i = 0; i < count; i++) {
                const qrToken = crypto.randomBytes(16).toString('hex');
                const { data: ticket, error: ticketErr } = await supabase
                    .from('tickets')
                    .insert({
                        order_id: orderId,
                        event_id,
                        stripe_session_id: session.id, // keep for backward compat
                        buyer_name,
                        buyer_email,
                        guest_count: 1, // each ticket is for 1 person now if multiple in order
                        ticket_type: ticket_type || 'general',
                        qr_token: qrToken,
                        status: 'paid',
                        amount_paid: Math.round(session.amount_total / count)
                    })
                    .select()
                    .single();

                if (ticketErr) console.error('Ticket Insert Error:', ticketErr);
                else ticketIds.push(ticket.id);
            }

            // Mark order as ticket_generated
            await supabase.from('ticket_orders').update({ status: 'ticket_generated' }).eq('id', orderId);
            console.log(`✅ ${ticketIds.length} tickets created for order:`, orderId);
        }

        // Trigger email for the order (which should now handle all tickets in it)
        const confirmUrl = `${getAppUrl()}/.netlify/functions/ticket-send-confirmation`;
        console.log('Triggering email for order:', orderId);

        try {
            const emailResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId }),
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
            body: JSON.stringify({ ok: true, orderId: orderId }),
        };

    } catch (err) {
        console.error('❌ Ticket processing error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal processing error' }),
        };
    }
};
