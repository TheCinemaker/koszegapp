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

    // 2. Specific local-only topics
    if (/hol parkoljak|jegy|automata|szemétszállítás|okmányiroda|hivatali/.test(q)) {
        return "local";
    }

    // 3. Tourist topics
    if (/látnivaló|program|mit érdemes|történet|legenda|szállás/.test(q)) {
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

    const { signals, reasoning } = decision;
    const traits = [];

    // Map signals to traits
    if (signals.romanticMode) traits.push('trait:romantic');
    if (signals.hasChildren) traits.push('trait:family');
    if (reasoning?.rainBoost || reasoning?.rainPreferenceBoost) traits.push('trait:indoor');
    if (decision.intent?.includes('food')) traits.push('trait:foodie');

    for (const trait of traits) {
        try {
            // Using a simple increment logic for scores in user_interests
            const { data, error } = await supabase.rpc('increment_interest_score', {
                p_user_id: userId,
                p_category: trait,
                p_inc: 0.1 // Increment by 0.1 each time
            });

            if (error) {
                // Fallback if RPC doesn't exist yet (classic upsert)
                const { data: existing } = await supabase
                    .from('user_interests')
                    .select('score')
                    .eq('user_id', userId)
                    .eq('category', trait)
                    .single();

                const newScore = Math.min(1, (existing?.score || 0) + 0.1);

                await supabase.from('user_interests').upsert({
                    user_id: userId,
                    category: trait,
                    score: newScore,
                    last_updated: new Date().toISOString()
                });
            }
        } catch (err) {
            console.warn(`Failed to update trait ${trait}:`, err);
        }
    }
}

/**
 * Loads the user AI profile from 'user_interests' and flattens it.
 */
export async function loadAIProfile(userId) {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('user_interests')
            .select('category, score')
            .eq('user_id', userId)
            .like('category', 'trait:%');

        if (error || !data) return null;

        // Flatten: { 'trait:romantic': 0.8 } -> { romantic_score: 8 } (scaled for scoring engine)
        return data.reduce((acc, curr) => {
            const key = curr.category.replace('trait:', '') + '_score';
            acc[key] = curr.score * 10; // Scale back to 0-10 for the scoring engine
            return acc;
        }, {});

    } catch (err) {
        return null;
    }
}
