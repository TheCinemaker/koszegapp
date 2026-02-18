/**
 * 🧠 Behavior Engine - Learns from User Actions
 * 
 * Tracks how many times a user ignores a specific type of suggestion.
 * If ignored > 2 times, it flags the category as "ignored".
 */

import { supabase } from '../lib/supabaseClient';

/**
 * 🧠 Behavior Engine - Learns from User Actions
 * Syncs with Supabase 'user_interests' table.
 */

// Cache locally to avoid UI lag
let localProfile = {};

export async function initBehaviorEngine(userId) {
    if (!userId) return;

    // 1. Load from Supabase
    const { data } = await supabase
        .from('user_interests')
        .select('category, score')
        .eq('user_id', userId);

    if (data) {
        data.forEach(item => {
            localProfile[item.category] = item.score;
        });
        localStorage.setItem("user_profile", JSON.stringify(localProfile));
        console.log("🧠 Behavior Loaded from Cloud:", localProfile);
    }
}

export async function registerUserIgnore(type, userId) {
    if (!type) return;

    // Local Tracking (Counts)
    const key = `ignore_${type}`;
    const current = parseInt(localStorage.getItem(key) || 0);
    localStorage.setItem(key, current + 1);

    // Interest Decay (Negative Feedback)
    // If ignored twice, reduce interest score significantly
    if (current >= 1) {
        updateInterest(type, -0.2, userId);
    }

    console.log(`🧠 Behavior Tracked: Ignored ${type} (${current + 1} times)`);
}

export function getBehaviorProfile() {
    return {
        ignoredDinner: parseInt(localStorage.getItem("ignore_food") || 0) > 2,
        ignoredEvents: parseInt(localStorage.getItem("ignore_event") || 0) > 2,
        ignoredRain: parseInt(localStorage.getItem("ignore_attraction") || 0) > 2,
        ignoredPlanning: parseInt(localStorage.getItem("ignore_planning") || 0) > 2,
        ignoredParking: parseInt(localStorage.getItem("ignore_parking") || 0) > 2
    };
}

// 🧠 User Interests (0.0 - 1.0)
export function getUserProfile() {
    try {
        const stored = localStorage.getItem("user_profile");
        if (stored) localProfile = JSON.parse(stored);
        return localProfile;
    } catch {
        return {};
    }
}

export async function updateInterest(category, delta, userId) {
    const profile = getUserProfile();
    const currentScore = profile[category] || 0.5; // Default neutral

    // Normalize new score between 0.1 and 1.5 (allow some boost above 1.0)
    let newScore = currentScore + delta;
    newScore = Math.max(0.1, Math.min(1.5, newScore));

    // Update Local
    profile[category] = newScore;
    localProfile[category] = newScore;
    localStorage.setItem("user_profile", JSON.stringify(profile));
    console.log(`🧠 Interest Updated: ${category} ${currentScore.toFixed(2)} -> ${newScore.toFixed(2)}`);

    // Sync Remote
    if (userId) {
        await supabase
            .from('user_interests')
            .upsert({
                user_id: userId,
                category: category,
                score: newScore,
                last_updated: new Date().toISOString()
            }, { onConflict: 'user_id, category' });
    }
}
