import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(
    CONFIG.SUPABASE_URL || 'https://dummy.supabase.co',
    CONFIG.SUPABASE_ANON_KEY || 'dummy-key'
);

export async function logInteraction({ userId, query, intent, action, response, context }) {
    if (!userId) return;

    try {
        const { error } = await supabase
            .from('ai_logs')
            .insert({
                user_id: userId,
                intent: intent,
                action: action ? action.type : null,
                context: context, // Mapped to 'context' JSONB
                metadata: {
                    query: query,
                    response: response,
                    ...context // Optional: redundant but safe
                },
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error logging interaction:', error);
        } else {
            console.log(`📝 Logged interaction for user ${userId} (Intent: ${intent})`);
        }
    } catch (err) {
        console.error('Unexpected error logging interaction:', err);
    }
}
