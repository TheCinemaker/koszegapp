/**
 * Billingo API v3 Service
 * Documentation: https://api.billingo.hu/v3
 */

import fetch from 'node-fetch';

const BILLINGO_API_KEY = process.env.BILLINGO_API_KEY;
const BILLINGO_BLOCK_ID = process.env.BILLINGO_BLOCK_ID;

const BASE_URL = 'https://api.billingo.hu/v3';

const headers = {
    'X-API-KEY': BILLINGO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

/**
 * Creates a Billingo partner from order data
 * @param {Object} data { name, email, zip, city, address }
 * @returns {Promise<number>} partner_id
 */
export async function createPartner(data) {
    if (!BILLINGO_API_KEY) throw new Error('BILLINGO_API_KEY is missing');

    const body = {
        name: data.name,
        emails: [data.email],
        address: {
            postal_code: data.zip,
            city: data.city,
            address: data.address,
            country_code: 'HU'
        }
    };

    const response = await fetch(`${BASE_URL}/partners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Billingo Create Partner Error:', result);
        throw new Error(result.error?.message || 'Failed to create Billingo partner');
    }

    return result.data.id;
}

/**
 * Creates an invoice for a partner
 * @param {number} partnerId 
 * @param {number} amount Total amount in HUF (already inclusive of service fee)
 * @param {string} eventName 
 * @returns {Promise<Object>} { invoice_id, download_url }
 */
export async function createInvoice(partnerId, amount, eventName) {
    if (!BILLINGO_BLOCK_ID) throw new Error('BILLINGO_BLOCK_ID is missing');

    const today = new Date().toISOString().split('T')[0];

    const body = {
        block_id: parseInt(BILLINGO_BLOCK_ID),
        type: 'invoice',
        fulfillment_date: today,
        due_date: today,
        payment_method: 'online_bankcard', // Since it's from Stripe
        language: 'hu',
        currency: 'HUF',
        partner_id: partnerId,
        items: [
            {
                name: `${eventName} - Belépőjegy`,
                quantity: 1,
                unit_price: amount,
                unit_price_type: 'gross', // User said "jegy ár = teljes bevétel", so we treat amount as gross
                vat: 'AAM', // "Alanyi Adómentes" as requested or fallback to standard if not specified
                entitlement: 'AAM'
            }
        ],
        settings: {
            mediated_service: false,
            without_financial_fulfillment: false
        }
    };

    const response = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Billingo Create Invoice Error:', result);
        throw new Error(result.error?.message || 'Failed to create Billingo invoice');
    }

    return {
        id: result.data.id,
        invoice_number: result.data.invoice_number
    };
}

/**
 * Get Invoice PDF download link
 * @param {number} invoiceId 
 */
export async function getInvoiceDownloadUrl(invoiceId) {
    const response = await fetch(`${BASE_URL}/documents/${invoiceId}/public-url`, {
        method: 'GET',
        headers
    });

    const result = await response.json();
    if (!response.ok) return null;

    return result.data.public_url;
}
