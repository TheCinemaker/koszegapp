// netlify/functions/koszeg-pass-validate.js
// KőszegPass – QR kód validáció
//
// Partner elfogadóhelyek és az admin ezt használják a pass ellenőrzéséhez.
// GET /?token={qrToken} → JSON válasz: érvényes-e + névjegy + lejárat
// POST { token, partnerId } → validál + scan eseményt ment statisztikának

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        let qrToken, partnerId;

        if (event.httpMethod === 'GET') {
            qrToken = event.queryStringParameters?.token;
        } else if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            qrToken = body.token;
            partnerId = body.partnerId; // opcionális – statisztikához
        }

        if (!qrToken) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'token required' }) };
        }

        // Pass keresése a qr_token alapján
        const { data: passData, error: passError } = await supabase
            .from('koszeg_passes')
            .select('id, holder_name, pass_type, status, purchased_at, expires_at')
            .eq('qr_token', qrToken)
            .maybeSingle();

        if (passError) {
            console.error('[Pass Validate] DB error:', passError);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
        }

        if (!passData) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    reason: 'UNKNOWN_TOKEN',
                    message: 'Ez a QR kód nem szerepel a KőszegPass rendszerben.'
                })
            };
        }

        // Státusz ellenőrzés
        if (passData.status !== 'active') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    reason: 'INACTIVE',
                    message: `A pass nem aktív (státusz: ${passData.status}).`
                })
            };
        }

        // Lejárat ellenőrzés
        const now = new Date();
        const expiresAt = new Date(passData.expires_at);
        if (now > expiresAt) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: false,
                    reason: 'EXPIRED',
                    message: `A pass lejárt (${expiresAt.toLocaleDateString('hu-HU')}).`,
                    holder_name: passData.holder_name,
                    expires_at: passData.expires_at
                })
            };
        }

        // 🎫 Érvényes pass!

        // Scan esemény rögzítése (ha POST és partnerId megadva)
        if (event.httpMethod === 'POST' && partnerId) {
            const { error: scanError } = await supabase
                .from('pass_scans')
                .insert({
                    pass_id: passData.id,
                    partner_id: partnerId,
                    scanned_at: now.toISOString()
                });

            if (scanError) {
                // Nem blokkolja a validálást – csak logoljuk
                console.warn('[Pass Validate] Scan log error (non-fatal):', scanError);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                holder_name: passData.holder_name,
                pass_type: passData.pass_type,
                pass_type_label: passData.pass_type === 'family' ? 'Családi Pass' : 'Egyéni Pass',
                purchased_at: passData.purchased_at,
                expires_at: passData.expires_at,
                days_remaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
            })
        };

    } catch (err) {
        console.error('[Pass Validate] Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal error' })
        };
    }
};
