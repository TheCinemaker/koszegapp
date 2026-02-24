/**
 * intentResolver.js – ai-core-v2
 * Resolves and deduplicates multi-intent arrays.
 * Applies priority ordering (parking > emergency > food > attractions > navigation > smalltalk).
 */

const PRIORITY = ['emergency', 'parking', 'food', 'attractions', 'hotels', 'navigation', 'events', 'smalltalk', 'unknown'];

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
