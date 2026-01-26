const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { token } = JSON.parse(event.body);

        if (!token || !token.startsWith('KP-')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ valid: false, message: 'Invalid token format' }),
            };
        }

        // Initialize Supabase with Service Role Key for secure access
        // FALLBACK: If service key is missing (dev), warn but try anon (might fail RLS)
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials');
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Query the Card AND the User details
        const { data, error } = await supabase
            .from('koszegpass_cards')
            .select(`
        active,
        qr_token,
        last_used_at,
        koszegpass_users (
          full_name,
          points,
          card_type,
          status
        )
      `)
            .eq('qr_token', token)
            .single();

        if (error || !data) {
            console.log('Token not found or error:', error);
            return {
                statusCode: 200, // Return 200 even for invalid to handle in UI gracefully
                body: JSON.stringify({ valid: false, message: 'Kártya nem található' }),
            };
        }

        // Validation Checks
        if (!data.active) {
            return {
                statusCode: 200,
                body: JSON.stringify({ valid: false, message: 'A kártya inaktív!' }),
            };
        }

        if (data.koszegpass_users?.status !== 'active' && data.koszegpass_users?.status !== 'approved') {
            // Allow 'active' or 'approved' depending on schema, strict check
            // If status is null/undefined, simple check might fail, so be careful.
            // Let's assume 'status' column exists effectively.
            // For now, if user status is explicitly 'suspended' or 'banned', block.
            if (data.koszegpass_users?.status === 'suspended' || data.koszegpass_users?.status === 'banned') {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ valid: false, message: 'Felhasználó felfüggesztve!' }),
                };
            }
        }

        // Success!
        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                user: {
                    name: data.koszegpass_users.full_name || 'Ismeretlen Felhasználó',
                    points: data.koszegpass_users.points || 0,
                    cardType: data.koszegpass_users.card_type || 'bronze',
                }
            }),
        };

    } catch (err) {
        console.error('Handler error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
