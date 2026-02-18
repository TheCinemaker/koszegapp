import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(
    CONFIG.SUPABASE_URL || 'https://dummy.supabase.co',
    CONFIG.SUPABASE_ANON_KEY || 'dummy-key'
);

export async function logInteraction({ userId, authToken, query, intent, action, response, context }) {
    if (!userId) return;

    try {
        // 🔐 IMPORTANT: Use the user's token to satisfy RLS
        if (authToken) {
            supabase.auth.setSession({
                access_token: authToken,
                refresh_token: '' // Not needed for single operation
            });
        }

        const payload = {
            user_id: userId,
            intent: intent,
            action: action ? action.type : null,
            context: context,
            metadata: {
                query: query,
                response: response,
                ...context
            },
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('ai_logs')
            .insert(payload)
            .select(); // Select back to confirm

        if (error) {
            console.error('❌ Supabase Log Error:', JSON.stringify(error, null, 2));
            console.error('Payload attempted:', JSON.stringify(payload, null, 2));
        } else {
            console.log(`✅ Log inserted: ${data[0]?.id}`);
        }
    } catch (err) {
        console.error('Unexpected error logging interaction:', err);
    }
}
