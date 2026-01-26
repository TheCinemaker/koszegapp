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
        const { token, points, source } = JSON.parse(event.body);

        if (!token || !points || isNaN(points)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request data" })
            };
        }

        // Initialize Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server config error' }) };
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

        const currentPoints = card.koszegpass_users.points || 0;
        const newPoints = currentPoints + parseInt(points);

        // 2. Update Points
        const { error: updateError } = await supabase
            .from('koszegpass_users')
            .update({ points: newPoints })
            .eq('id', card.user_id);

        if (updateError) {
            throw updateError;
        }

        // 3. Log Transaction
        await supabase
            .from('koszegpass_points_log')
            .insert({
                user_id: card.user_id,
                points: parseInt(points),
                source: source || 'Scanner App'
            });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                newPoints,
                message: `Sikeres jóváírás: +${points} pont`
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
