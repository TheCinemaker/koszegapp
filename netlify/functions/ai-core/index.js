import { detectIntent } from './intentMatcher.js'; // Rule-based
import { loadContext } from './contextLoader.js';
import { generateResponse } from './responseEngine.js';
import { getFallbackResponse } from './fallbackEngine.js';
import { decideFoodAction } from './decisionRouter.js';
import { searchMenu } from './foodSearch.js';
import { logInteraction } from './logger.js'; // Import Logger

export async function runAI({ query, history, frontendContext }) {
    try {
        console.time("INTENT_MATCH");
        // 1. Detect Intent (Rule-based, 0 latency)
        let intent = detectIntent(query);
        console.timeEnd("INTENT_MATCH");

        let decision = null;
        let menuItems = [];

        // 🧠 Decision Router (Situational Inference)
        if (intent === 'food_general') {
            const { mode } = frontendContext || {};
            const hour = new Date().getHours();

            const decisionResult = decideFoodAction({ query, appMode: mode, hour });
            decision = decisionResult.action;
            intent = decisionResult.intent; // Refine intent (food_place vs food_delivery)

            // 🍔 Supabase Power Search
            if (decisionResult.fetchMenu) {
                // Extract search term from query (simple heuristic)
                // Remove trigger words to get product name
                const cleanQuery = query.replace(/rendel|házhoz|kiszállítás|futár|enni|beülni|étterem|pizzéria|szeretnék|kérek/gi, "").trim();
                // Ensure query is not empty or too short
                if (cleanQuery.length > 2) {
                    menuItems = await searchMenu(cleanQuery);
                }
            }

            console.log(`🧠 Decision Optimized: ${intent} -> ${decision.type}`);
        }

        console.log(`Intent detected: ${intent}`);

        console.time("CONTEXT_LOAD");
        // 2. Load Context (Backend data)
        const userId = frontendContext?.userId;
        const backendContext = await loadContext(intent, query, userId);
        console.timeEnd("CONTEXT_LOAD");

        console.time("GENERATE_RESPONSE");
        // 3. Generate Response (Single LLM Call)
        const result = await generateResponse({
            intent,
            query,
            context: { ...backendContext, ...frontendContext, decision, menuItems }, // Pass menu items
            history
        });
        console.timeEnd("GENERATE_RESPONSE");

        // 📝 LOGGING (Wait for completion)
        await logInteraction({
            userId: frontendContext?.userId,
            authToken: frontendContext?.authToken, // 🔥 Use JWT
            query,
            intent,
            action: result.action,
            response: result.text,
            context: { mode: frontendContext?.mode, location: frontendContext?.location }
        });

        return { ...result, intent };

    } catch (error) {
        console.error("AI run failed:", error);
        return getFallbackResponse(query);
    }
}
