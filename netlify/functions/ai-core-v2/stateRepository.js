/**
 * stateRepository.js – KőszegAI v2
 * RLS-aware conversation state management + session support for guests
 */
import { createClient } from '@supabase/supabase-js';

const IN_MEMORY_CACHE = new Map();

function client(token) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    return createClient(
        url,
        key,
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
            const c = client();
            if (!c) {
                if (sessionId && IN_MEMORY_CACHE.has(sessionId)) return IN_MEMORY_CACHE.get(sessionId);
                return { phase: 'idle', tempData: {}, mobility: null };
            }

            const { data } = await c
                .from('conversation_state')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle(); // single helyett maybeSingle, hogy ne dobjon hibát ha nincs

            if (!data) {
                if (sessionId && IN_MEMORY_CACHE.has(sessionId)) return IN_MEMORY_CACHE.get(sessionId);
                return { phase: 'idle', tempData: {}, mobility: null };
            }

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
        const c = client(token);
        if (!c) {
            if (userId && IN_MEMORY_CACHE.has(userId)) return IN_MEMORY_CACHE.get(userId);
            return { phase: 'idle', tempData: {}, mobility: null };
        }

        const { data } = await c
            .from('conversation_state')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!data) {
            if (userId && IN_MEMORY_CACHE.has(userId)) return IN_MEMORY_CACHE.get(userId);
            return { phase: 'idle', tempData: {}, mobility: null };
        }
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

            const c = client();
            if (!c) {
                if (sessionId) IN_MEMORY_CACHE.set(sessionId, state);
                return;
            }

            const { error } = await c
                .from('conversation_state')
                .upsert({
                    session_id: sessionId,
                    ...dbState
                }, { onConflict: 'session_id' });

            if (error) {
                console.warn('saveState guest error:', error.message);
                if (sessionId) IN_MEMORY_CACHE.set(sessionId, state);
            }
            return;
        }

        // Bejelentkezett user: user_id-val mentünk
        const c = client(token);
        if (!c) {
            if (userId) IN_MEMORY_CACHE.set(userId, state);
            return;
        }

        const { error } = await c
            .from('conversation_state')
            .upsert({
                user_id: userId,
                ...dbState
            }, { onConflict: 'user_id' });

        if (error) {
            console.warn('saveState error:', error.message);
            if (userId) IN_MEMORY_CACHE.set(userId, state);
        }
    } catch (e) {
        console.warn('saveState exception:', e.message);
    }
}