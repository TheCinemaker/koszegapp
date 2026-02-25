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
    // No token = guest user → return default state, skip DB
    if (!token || !userId) {
        return { phase: 'idle', tempData: {}, mobility: null };
    }
    try {
        const { data } = await client(token)
            .from('conversation_state')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!data) return { phase: 'idle', tempData: {}, mobility: null };
        return { phase: data.phase, tempData: data.temp_data || {}, mobility: data.mobility };
    } catch {
        return { phase: 'idle', tempData: {}, mobility: null };
    }
}

export async function saveState(userId, state, token) {
    // No token = guest user → skip DB write silently
    if (!token || !userId) return;
    try {
        const { error } = await client(token)
            .from('conversation_state')
            .upsert({
                user_id: userId,
                phase: state.phase,
                temp_data: state.tempData || {},
                mobility: state.mobility || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        if (error) console.warn('saveState error:', error.message);
    } catch (e) {
        console.warn('saveState exception:', e.message);
    }
}
