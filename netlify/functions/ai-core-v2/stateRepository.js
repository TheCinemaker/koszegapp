/**
 * stateRepository.js – KőszegAI v2
 * RLS-aware conversation state management + session support for guests
 */
import { createClient } from '@supabase/supabase-js';

function client(token) {
    // Ha nincs token, anon client (RLS továbbra is véd)
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        token ? {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        } : {}
    );
}

export async function getState(userId, sessionId, token) {
    // 🆕 Vendég user: sessionId alapján keres
    if (!token || !userId) {
        if (!sessionId) {
            return { phase: 'idle', tempData: {}, mobility: null };
        }

        try {
            // Vendég: session_id alapján keresünk
            const { data } = await client()
                .from('conversation_state')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle(); // single helyett maybeSingle, hogy ne dobjon hibát ha nincs

            if (!data) return { phase: 'idle', tempData: {}, mobility: null };

            return {
                phase: data.phase,
                tempData: data.temp_data || {},
                mobility: data.mobility,
                lastIntent: data.last_intent || [],
                lastReplyType: data.last_reply_type || null,
                isGuest: true
            };
        } catch (e) {
            console.warn('getState guest error:', e.message);
            return { phase: 'idle', tempData: {}, mobility: null };
        }
    }

    // Bejelentkezett user: user_id alapján keresünk
    try {
        const { data } = await client(token)
            .from('conversation_state')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!data) return { phase: 'idle', tempData: {}, mobility: null };
        return {
            phase: data.phase,
            tempData: data.temp_data || {},
            mobility: data.mobility,
            lastIntent: data.last_intent || [],
            lastReplyType: data.last_reply_type || null
        };
    } catch {
        return { phase: 'idle', tempData: {}, mobility: null };
    }
}

export async function saveState(userId, sessionId, state, token) {
    try {
        const dbState = {
            phase: state.phase,
            temp_data: state.tempData || {},
            mobility: state.mobility || null,
            last_intent: state.lastIntent || [],
            last_reply_type: state.lastReplyType || null,
            updated_at: new Date().toISOString()
        };

        // 🆕 Vendég user: session_id-val mentünk
        if (!token || !userId) {
            if (!sessionId) return; // Nincs sessionId se → skip

            const { error } = await client()
                .from('conversation_state')
                .upsert({
                    session_id: sessionId,
                    ...dbState
                }, { onConflict: 'session_id' });

            if (error) console.warn('saveState guest error:', error.message);
            return;
        }

        // Bejelentkezett user: user_id-val mentünk
        const { error } = await client(token)
            .from('conversation_state')
            .upsert({
                user_id: userId,
                ...dbState
            }, { onConflict: 'user_id' });

        if (error) console.warn('saveState error:', error.message);
    } catch (e) {
        console.warn('saveState exception:', e.message);
    }
}