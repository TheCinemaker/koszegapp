const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Security check (Optional for prototype/dev, recommended for prod)
    const scannerKey = process.env.SCANNER_KEY;
    const requestKey = event.headers['x-scanner-key'] || event.headers['X-Scanner-Key'];
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

        // Initialize Supabase
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Validate Card and User
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

        // 2. Check Balance
        const currentPoints = card.koszegpass_users.points || 0;
        if (currentPoints < amountVal) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    reason: "insufficient_funds",
                    message: `Nincs elég pont! (Egyenleg: ${currentPoints})`
                })
            };
        }

        // 3. Deduct Points (Using RPC if available or direct update)
        // We will try to use a hypothetical 'deduct_koszegpass_points' RPC or direct update if simple
        // For robustness, better to do it transactionally, but direct update is okay for prototype if RPC specific for deduction is missing.
        // Looking at 'add_koszegpass_points' RPC usage in add-points.js, likely we need a similar one or just do direct update here.
        // Let's do direct update + log for now to avoid migration dependency if RPC doesn't exist, 
        // OR better: use the same mechanism as add but with negative amount if the RPC supports it?
        // add-points.js uses 'add_koszegpass_points'. If we pass negative, it might check restrictions.
        // Let's stick to direct trusted update from backend since we have service role.

        const newBalance = currentPoints - amountVal;

        // Update User Points
        const { error: updateError } = await supabase
            .from('koszegpass_users')
            .update({ points: newBalance })
            .eq('id', card.user_id);

        if (updateError) throw updateError;

        // Log Transaction
        await supabase.from('koszegpass_points_log').insert([{
            user_id: card.user_id,
            amount: -amountVal, // Negative for deduction
            source: source || 'Scanner Redemption',
            type: 'redemption'
        }]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                newPoints: newBalance,
                deductedPoints: amountVal,
                message: `Sikeres beváltás: -${amountVal} pont`
            })
        };

    } catch (err) {
        console.error('Deduct Points Error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
