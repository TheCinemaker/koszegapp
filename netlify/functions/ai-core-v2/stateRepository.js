/**
 * stateRepository.js – KőszegAI v2
 * RLS-aware conversation state management.
 * Uses user JWT (never service role) to enforce row-level security.
 */
import { createClient } from '@supabase/supabase-js';

function client(token) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        }
    );
}

export async function getState(userId, token) {
    const supabase = client(token);

    const { data } = await supabase
        .from('conversation_state')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!data) {
        return { phase: 'idle', tempData: {}, mobility: null };
    }

    return {
        phase: data.phase,
        tempData: data.temp_data || {},
        mobility: data.mobility
    };
}

export async function saveState(userId, state, token) {
    const supabase = client(token);

    const { error } = await supabase
        .from('conversation_state')
        .upsert({
            user_id: userId,
            phase: state.phase,
            temp_data: state.tempData || {},
            mobility: state.mobility || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) console.error('saveState error:', error.message);
}
