const API_KEY = process.env.BILLINGO_API_KEY;
const BLOCK_ID = process.env.BILLINGO_BLOCK_ID;
const BASE_URL = 'https://api.billingo.hu/v3';

/**
 * Validates config
 */
function validateConfig() {
    if (!API_KEY) console.error('MISSING BILLINGO_API_KEY');
    if (!BLOCK_ID) console.error('MISSING BILLINGO_BLOCK_ID');
}

/**
 * Search for partner by email to avoid duplicates
 */
export async function findPartnerByEmail(email) {
    validateConfig();
    console.log(`Billingo: Searching for partner with email: ${email}...`);

    // GET /partners?query=email
    const response = await fetch(`${BASE_URL}/partners?query=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.error('Billingo Search Partner Error:', response.statusText);
        return null;
    }

    const result = await response.json();
    const partners = result.data || [];

    // Exact match check
    const partner = partners.find(p => p.emails && p.emails.includes(email));

    if (partner) {
        console.log(`Billingo: Found existing partner ID ${partner.id}`);
        return partner.id;
    }

    return null;
}

/**
 * Creates a Billingo partner from order data
 */
export async function createPartner(data) {
    validateConfig();
    console.log(`Billingo: Creating partner for ${data.email}...`);

    const body = {
        name: data.name,
        emails: [data.email],
        type: 'private',
        address: {
            post_code: data.zip,
            city: data.city,
            address: data.address,
            country_code: 'HU'
        }
    };

    const response = await fetch(`${BASE_URL}/partners`, {
        method: 'POST',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Billingo Partner Creation Error:', JSON.stringify(result));
        throw new Error(result.error?.message || 'Failed to create Billingo partner');
    }

    // Robust parsing as suggested by user
    const partnerId = result.data?.id || result.id;
    console.log(`Billingo: Partner created! ID: ${partnerId}`);
    return partnerId;
}

/**
 * Creates an invoice for a partner
 */
export async function createInvoice(partnerId, amount, eventName) {
    validateConfig();
    console.log(`Billingo: Creating invoice for partner ${partnerId}, amount: ${amount}...`);

    const today = new Date().toISOString().split('T')[0];

    const body = {
        block_id: parseInt(BLOCK_ID),
        type: 'invoice',
        fulfillment_date: today,
        due_date: today,
        payment_method: 'online_bank_card',
        language: 'hu',
        currency: 'HUF',
        partner_id: partnerId,
        items: [
            {
                name: `${eventName} - Belépőjegy`,
                quantity: 1,
                unit: 'db',
                unit_price: amount,
                unit_price_type: 'gross',
                vat: 'AAM', // "Alanyi Adómentes" - User is VAT exempt
                entitlement: 'AAM'
            }
        ]
    };

    const response = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Billingo Invoice Creation Error:', JSON.stringify(result));
        throw new Error(result.error?.message || 'Failed to create Billingo invoice');
    }

    // Robust parsing as suggested by user
    const invoiceId = result.data?.id || result.id;
    const invoiceNumber = result.data?.invoice_number || result.invoice_number;

    console.log(`Billingo: Invoice created! ID: ${invoiceId}, No: ${invoiceNumber}`);
    return {
        id: invoiceId,
        number: invoiceNumber
    };
}

/**
 * Get Invoice PDF download link
 */
export async function getInvoiceDownloadUrl(invoiceId) {
    if (!invoiceId) return null;

    const response = await fetch(`${BASE_URL}/documents/${invoiceId}/public-url`, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY
        }
    });

    const result = await response.json();
    if (!response.ok) {
        console.error('Billingo Public URL Error:', result);
        return null;
    }

    return result.data?.public_url || result.public_url;
}
