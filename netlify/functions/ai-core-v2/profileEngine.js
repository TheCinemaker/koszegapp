/**
 * profileEngine.js – ai-core-v2
 * Reads and updates user_profiles table via RLS-safe JWT client.
 * Silently returns null if no profile exists (new user).
 */
import { createClient } from '@supabase/supabase-js';

function client(token) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
}

export async function getUserProfile(userId, token) {
    try {
        const { data } = await client(token)
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        return data || null;
    } catch {
        return null; // new user, no profile yet
    }
}

/**
 * Increments preference scores based on the user's choice.
 * Called after a successful interaction action.
 */
export async function updateProfile(userId, token, interaction) {
    const supabase = client(token);

    // Fetch current profile (upsert pattern)
    const current = await getUserProfile(userId, token);
    const base = current || { user_id: userId };

    const updated = { ...base };
    updated.user_id = userId;
    updated.visit_frequency = (base.visit_frequency || 0) + 1;

    // ── DECAY (Régi preferenciák elhalványítása) ──
    const DECAY = 0.98; // 2%-os csökkenés minden interakciónál
    const fields = ['indoor_preference', 'romantic_score', 'family_score', 'pizza_preference', 'culture_score', 'outdoor_score'];
    fields.forEach(f => {
        if (updated[f] != null) updated[f] = updated[f] * DECAY;
    });

    if (interaction.type === 'indoor') {
        updated.indoor_preference = Math.min(1, (base.indoor_preference || 0.5) + 0.05);
    }
    if (interaction.type === 'outdoor') {
        updated.indoor_preference = Math.max(0, (base.indoor_preference || 0.5) - 0.05);
        updated.outdoor_score = Math.min(1, (base.outdoor_score || 0.5) + 0.05);
    }
    if (interaction.type === 'romantic') {
        updated.romantic_score = Math.min(1, (base.romantic_score || 0) + 0.1);
    }
    if (interaction.type === 'family') {
        updated.family_score = Math.min(1, (base.family_score || 0) + 0.1);
    }
    if (interaction.type === 'pizza') {
        updated.pizza_preference = Math.min(1, (base.pizza_preference || 0.5) + 0.1);
    }
    if (interaction.type === 'culture') {
        updated.culture_score = Math.min(1, (base.culture_score || 0.5) + 0.08);
    }

    updated.updated_at = new Date().toISOString();
    updated.last_seen = new Date().toISOString();

    const { error } = await supabase
        .from('user_profiles')
        .upsert(updated, { onConflict: 'user_id' });

    if (error) console.warn('updateProfile error:', error.message);
}
