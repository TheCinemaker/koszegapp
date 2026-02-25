/**
 * loggingService.js – ai-core-v2
 * General conversation logging with rich context (situation, weather, profile).
 */
import { createClient } from '@supabase/supabase-js';

export async function saveConversationToSupabase({ userId, sessionId, userMessage, assistantMessage, context, token }) {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            token ? {
                global: {
                    headers: { Authorization: `Bearer ${token}` }
                }
            } : {}
        );

        const { error } = await supabase
            .from('ai_conversations')
            .insert({
                user_id: userId === 'guest' ? null : userId,
                session_id: sessionId,
                query: userMessage,
                response: assistantMessage,
                intent: context?.intents || [],
                context: context || {},
                created_at: new Date().toISOString()
            });

        if (error) {
            console.warn('saveConversationToSupabase error:', error.message);
        }
    } catch (e) {
        console.warn('saveConversationToSupabase exception:', e.message);
    }
}
