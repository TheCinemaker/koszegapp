import { detectIntent } from './intentMatcher.js'; // Rule-based
import { loadContext } from './contextLoader.js';
import { generateResponse } from './responseEngine.js';
import { getFallbackResponse } from './fallbackEngine.js';

export async function runAI({ query, history, frontendContext }) {
    try {
        console.time("INTENT_MATCH");
        // 1. Detect Intent (Rule-based, 0 latency)
        const intent = detectIntent(query);
        console.timeEnd("INTENT_MATCH");
        console.log(`Intent detected: ${intent}`);

        console.time("CONTEXT_LOAD");
        // 2. Load Context (Backend data)
        const backendContext = await loadContext(intent, query);
        console.timeEnd("CONTEXT_LOAD");

        console.time("GENERATE_RESPONSE");
        // 3. Generate Response (Single LLM Call)
        const result = await generateResponse({
            intent,
            query,
            context: { ...backendContext, ...frontendContext }, // Merge contexts
            history
        });
        console.timeEnd("GENERATE_RESPONSE");

        return result;

    } catch (error) {
        console.error("AI run failed:", error);
        return getFallbackResponse(query);
    }
}
