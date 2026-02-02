const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Security: Simple Header Check
    // In production, set SCANNER_KEY in Netlify Env
    const scannerKey = process.env.SCANNER_KEY;
    const requestKey = event.headers['x-scanner-key'] || event.headers['X-Scanner-Key'];

    // Skip check if env var is not set (DEV MODE), otherwise enforce it
    if (scannerKey && requestKey !== scannerKey) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized Scanner' }) };
    }

    try {
        const { token, amount, source } = JSON.parse(event.body);

        const amountVal = Number(amount);

        if (!token || !amountVal || amountVal <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request data" })
            };
        }

        const points = Math.floor(amountVal / 1000);

        if (points === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    reason: "below_threshold",
                    message: "A vásárlás összege nem éri el az 1000 Ft-ot (0 pont)."
                })
            };
        }

        // Initialize Supabase
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            const missing = [];
            if (!supabaseUrl) missing.push('SUPABASE_URL');
            if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
            return { statusCode: 500, body: JSON.stringify({ error: `Server configuration error: Missing ${missing.join(', ')}` }) };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get Card & User
        const { data: card, error: cardError } = await supabase
            .from('koszegpass_cards')
            .select(`
            user_id,
            active,
            koszegpass_users ( id, points, status )
        `)
            .eq('qr_token', token)
            .single();

        if (cardError || !card || !card.active) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: false, reason: "invalid_card", message: "Érvénytelen vagy inaktív kártya" })
            };
        }

        if (card.koszegpass_users.status !== 'active' && card.koszegpass_users.status !== 'approved') {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: false, reason: "user_inactive", message: "Felhasználó inaktív" })
            };
        }

        // 2. Call RPC (Robust Security Definer)
        // Ez a funkció elvégzi a számítást, az update-et és a logolást is egy lépésben.
        // Mivel Security Definer, átüti az RLS falakat.

        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('add_koszegpass_points', {
                p_user_id: card.user_id,
                p_amount: amountVal,
                p_source: source || 'Scanner App'
            });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw rpcError;
        }

        // RPC-től saját formátumot kapunk vissza
        if (!rpcResult.success) {
            return {
                statusCode: 200,
                body: JSON.stringify(rpcResult)
            };
        }

        /* DIRECT UPDATE REMOVED - REPLACED BY RPC */

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                newPoints: rpcResult.newPoints,
                addedPoints: rpcResult.addedPoints,
                message: `Sikeres jóváírás: ${rpcResult.addedPoints} pont (${amountVal} Ft)`
            })
        };

    } catch (err) {
        console.error('Add Points Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
