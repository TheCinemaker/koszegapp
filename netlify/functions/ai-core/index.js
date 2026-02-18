import { classifyIntent } from './intentClassifier.js';
import { loadContext } from './contextLoader.js';
import { generateResponse } from './responseEngine.js';
import { fallbackResponse } from './fallbackEngine.js';

export async function runAI({ query, history }) {
    console.time('AI_RUN');
    try {
        // 1. Intent Classification
        console.time('INTENT');
        const intent = await classifyIntent(query);
        console.timeEnd('INTENT');
        console.log(`Intent detected: ${intent}`);

        // 2. Load Context
        console.time('CONTEXT');
        const context = await loadContext(intent, query);
        console.timeEnd('CONTEXT');

        // 3. Generate Response
        console.time('GENERATE');
        const result = await generateResponse({
            intent,
            query,
            context,
            history
        });
        console.timeEnd('GENERATE');

        console.timeEnd('AI_RUN');
        return result;

    } catch (error) {
        console.error("AI Core global error:", error);
        return fallbackResponse(query);
    }
}
