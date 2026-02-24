/**
 * monetizationEngine.js – ai-core-v2
 * Optional revenue boost layer.
 * Runs AFTER weather and profile modifiers.
 * Purely deterministic – no LLM.
 */

/**
 * Applies partner/sponsor score boosts to already-ranked places.
 * Kept as a separate module so revenue logic can be toggled/audited independently.
 */
export function applyMonetizationBoost(places) {
    return places.map(place => {
        let score = place.finalScore ?? 50;
        const tier = place.tier || 'none';

        if (tier === 'gold') score += 15;
        else if (tier === 'silver') score += 8;
        if (place.sponsored === true) score += 20;

        return { ...place, finalScore: Math.round(score) };
    }).sort((a, b) => b.finalScore - a.finalScore);
}
