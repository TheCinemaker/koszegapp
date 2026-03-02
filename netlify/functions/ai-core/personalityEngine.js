import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(
    CONFIG.SUPABASE_URL || 'https://missing.supabase.co',
    CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY || 'missing-key'
);

/**
 * Detects the user persona based on location and query context.
 */
export function detectPersona(context, query) {
    const q = query.toLowerCase();

    // 1. Remote user usually means tourist
    if (context.appMode === 'remote' || (context.distanceToMainSquare && context.distanceToMainSquare > 5000)) {
        return "tourist";
    }

    // 2. Specific local-only topics (Synced with intentMatcher + added local services)
    if (/parkol|rendszám|jegy|zóna|fizetés|szemétszállítás|okmányiroda|hivatali|ügyelet|patika|orvos/.test(q)) {
        return "local";
    }

    // 3. Tourist topics
    if (/látnivaló|műemlék|templom|vár|múzeum|legenda|szállás|szoba|panzió/.test(q)) {
        return "tourist";
    }

    return "hybrid";
}

/**
 * Updates the persistent AI profile based on the current decision and signals.
 * Uses the existing 'user_interests' table for flexibility.
 */
export async function updateAIProfile(userId, decision) {
    if (!userId || !decision?.signals) return;

    const { signals } = decision;
    const updates = {};

    // Map signals to user_profiles columns
    if (signals.romanticMode) updates.romantic_score = 0.8; // Set or increment? Let's use a logic to "boost" it
    if (signals.hasChildren) updates.family_score = 0.8;
    if (signals.indoorPreference) updates.indoor_preference = 0.8;

    // In v6, we can use a more sophisticated weighted update or just set a "high interest" flag/score
    // For now, let's upsert what we detected
    if (Object.keys(updates).length === 0) return;

    try {
        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                ...updates,
                updated_at: new Date().toISOString()
            });

        if (error) console.warn('Failed to update user_profiles:', error.message);
    } catch (err) {
        console.warn('Failed to update user_profiles:', err);
    }
}

/**
 * Loads the user AI profile from 'user_interests' and flattens it.
 */
export async function loadAIProfile(userId) {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        // Formats the data for the decision router (multipliers/boosters)
        return {
            romantic_score: (data.romantic_score || 0) * 10,
            family_score: (data.family_score || 0) * 10,
            indoor_score: (data.indoor_preference || 0) * 10,
            budget_level: data.budget_level || 2,
            accessibility_needed: data.accessibility_needed || false
        };

    } catch (err) {
        return null;
    }
}
