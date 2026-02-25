/**
 * rankingEngineV2.js – ai-core-v2
 * Full scoring pipeline: base → GPS/speed → weather → profile → revenue
 * Deterministic. No LLM.
 */

/**
 * Derives place flags from JSON metadata.
 * Works with both restaurants and attractions.
 */
function deriveFlags(place) {
    const amenities = (place.amenities || []).join(' ').toLowerCase();
    const tags = (place.tags || []).join(' ').toLowerCase();
    const text = `${amenities} ${tags}`;
    const type = (place.type || '').toLowerCase();

    return {
        isIndoor: place.rainSafe === true || text.includes('klimatiz') || text.includes('belső tér'),
        isOutdoor: text.includes('kültér') || text.includes('természet') || text.includes('séta'),
        hasHeating: text.includes('klimatiz') || text.includes('fűtés'),
        hasTerrace: text.includes('terasz') || tags.includes('terasz'),
        hasShade: text.includes('árnyék') || text.includes('terasz'),
        walkingFriendly: type === 'attraction' || text.includes('séta') || text.includes('park'),
        walkingOnly: text.includes('gyalogos csak') || text.includes('várkör'),
        // Revenue flags derived from existing tier field
        partnerTier: place.tier || 'none',
        sponsored: place.sponsored === true
    };
}

/**
 * Score a single place with all modifiers.
 */
function scorePlace(place, { weather, profile, speed }) {
    let score = place.priority ? place.priority * 5 : 50; // base (1-10 → 5-50)
    const flags = deriveFlags(place);

    // ── GPS / SPEED ──────────────────────────────────────────────────────
    if (speed != null) {
        if (speed > 10) {
            // In a moving vehicle → parking is relevant, walking tours less so
            if (flags.walkingOnly) score -= 15;
        }
        if (speed < 3) {
            // Slow/stopped → walking spots get a boost
            if (flags.walkingFriendly) score += 10;
        }
    }

    // ── WEATHER ──────────────────────────────────────────────────────────
    if (weather) {
        const { temperature, isRain, isCloudy } = weather;

        if (isRain) {
            if (flags.isOutdoor && !flags.isIndoor) score -= 25;
            if (flags.isIndoor) score += 15;
        }

        if (isCloudy && !isRain) {
            if (flags.isOutdoor && !flags.hasTerrace) score -= 8;
        }

        if (temperature < 5) {
            if (flags.hasHeating) score += 10;
            if (flags.isOutdoor) score -= 15;
        }

        if (temperature > 28) {
            if (flags.hasTerrace && flags.hasShade) score += 8;
            if (!flags.hasShade && flags.isOutdoor) score -= 10;
            // Ice cream and cafés love hot weather
            const tags = (place.tags || []).join(' ').toLowerCase();
            if (tags.includes('fagylalt') || tags.includes('kávé')) score += 12;
        }
    }

    // ── USER PROFILE ─────────────────────────────────────────────────────
    if (profile) {
        if (profile.indoor_preference > 0.7 && flags.isIndoor) score += 10;
        if (profile.indoor_preference < 0.3 && flags.isOutdoor) score += 8;
        if (profile.romantic_score > 0.5 && place.romantic > 6) score += 8;
        if (profile.family_score > 0.5 && place.childFriendly) score += 12;

        // 🔥 ÚJ: konkrétabb preferenciák
        if (profile.pizza_preference > 0.7 && (place.tags?.includes('pizzéria') || place.name?.toLowerCase().includes('pizza'))) {
            score += 15;
        }
        if (profile.culture_score > 0.6 && (place.type === 'attraction' || place.tags?.includes('múzeum') || place.tags?.includes('történelem'))) {
            score += 10;
        }
        if (profile.outdoor_score > 0.6 && flags.isOutdoor && (place.type === 'leisure' || place.tags?.includes('túra'))) {
            score += 10;
        }
    }

    // ── REVENUE / MONETIZATION ────────────────────────────────────────────
    if (flags.partnerTier === 'gold') score += 15;
    if (flags.partnerTier === 'silver') score += 8;
    if (flags.sponsored) score += 20;

    return Math.max(0, Math.round(score));
}

/**
 * Ranks a list of places with all modifiers applied.
 * @param {Array} places - JSON data items (restaurants, attractions, etc.)
 * @param {Object} opts - { weather, profile, speed }
 * @returns sorted array with `finalScore` field added
 */
export function rankPlaces(places, opts = {}) {
    return places
        .map(place => ({ ...place, finalScore: scorePlace(place, opts) }))
        .sort((a, b) => b.finalScore - a.finalScore);
}
