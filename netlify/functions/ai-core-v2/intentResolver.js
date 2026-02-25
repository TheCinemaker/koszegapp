/**
 * intentResolver.js – ai-core-v2
 * Resolves and deduplicates multi-intent arrays.
 * Applies priority ordering (parking > emergency > food > attractions > navigation > smalltalk).
 */

const PRIORITY = [
    'emergency',        // mindent felülír
    'parking',          // parkolás indítás
    'parking_info',     // parkolás info
    'food',             // éttermek
    'attractions',      // látnivalók
    'tours',            // túraútvonalak
    'events',           // programok
    'hotels',           // szállások
    'shopping',         // vásárlás
    'practical',        // wc, atm, info
    'families',         // gyerekekkel
    'accessibility',    // speciális igények
    'navigation',       // útvonaltervezés
    'smalltalk',        // köszönés
    'unknown'           // ismeretlen
];

export function resolveIntents(intents) {
    if (!Array.isArray(intents)) intents = [intents];

    // Deduplicate
    const unique = [...new Set(intents)];

    // Sort by priority
    return unique.sort((a, b) => {
        const ai = PRIORITY.indexOf(a);
        const bi = PRIORITY.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}
