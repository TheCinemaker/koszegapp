import { detectIntent } from './intentMatcher.js'; // Rule-based
import { loadContext } from './contextLoader.js';
import { generateResponse } from './responseEngine.js';
import { getFallbackResponse } from './fallbackEngine.js';
import { decideAction } from './decisionRouter.js';
import { searchMenu } from './foodSearch.js';
import { logInteraction } from './logger.js'; // Import Logger
import { updateAIProfile } from './personalityEngine.js';

export async function runAI({ query, history, frontendContext }) {
    try {
        console.time("INTENT_DETECTION");
        let intents = detectIntent(query);
        console.timeEnd("INTENT_DETECTION");

        // 🧠 SESSION MEMORY (Extract last recommendations from history)
        let lastRecommendations = [];
        if (history && history.length > 0) {
            const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
            if (lastAssistantMsg && lastAssistantMsg.metadata?.topRecommendations) {
                lastRecommendations = lastAssistantMsg.metadata.topRecommendations;
            }
        }

        let decision = null;
        let menuItems = [];
        let topRecommendations = [];

        // 🧠 Decision Router (Situation-Aware Scoring)
        console.time("CONTEXT_LOAD");
        const backendContext = await loadContext(intents, query, frontendContext?.userId, frontendContext);
        console.timeEnd("CONTEXT_LOAD");

        const decisionContext = {
            ...backendContext,
            ...frontendContext,
            sessionMemory: lastRecommendations
        };

        console.time("DECISION_ROUTER");
        const decisionResult = decideAction({
            intents,
            query,
            context: decisionContext
        });
        console.timeEnd("DECISION_ROUTER");

        decision = decisionResult;
        const primaryIntent = decisionResult.intent;
        topRecommendations = decisionResult.topRecommendations || [];

        const allResolvedIntents = decisionResult.intents || [primaryIntent];

        // 🍔 Special Food Search (Trigger if any intent involves food)
        if (intents.some(i => i.includes('food')) || allResolvedIntents.some(i => i.includes('food'))) {
            const cleanQuery = query.replace(/rendel|házhoz|kiszállítás|futár|enni|beülni|étterem|pizzéria|szeretnék|kérek/gi, "").trim();
            if (cleanQuery.length > 2) {
                console.time("FOOD_SEARCH");
                menuItems = await searchMenu(cleanQuery);
                console.timeEnd("FOOD_SEARCH");
            }
        }

        console.log(`🧠 Decision Optimized: ${primaryIntent} -> ${decision?.action?.type || 'no action'} (Total Intents: ${allResolvedIntents.join(', ')})`);

        console.time("GENERATE_RESPONSE");
        // 3. Generate Response (Single LLM Call)
        const result = await generateResponse({
            intent: primaryIntent,
            query,
            context: { ...decisionContext, decision, menuItems, allIntents: allResolvedIntents },
            history
        });
        console.timeEnd("GENERATE_RESPONSE");

        // 🧠 LEARNING (Non-blocking)
        const userId = frontendContext?.userId;
        if (userId && decisionResult) {
            updateAIProfile(userId, decisionResult).catch(e => console.error('❌ Learning failed:', e.message));
        }

        // 📝 LOGGING (Non-blocking)
        logInteraction({
            userId: userId,
            authToken: frontendContext?.authToken,
            query,
            intent: primaryIntent,
            action: result.action,
            response: result.text,
            context: { mode: frontendContext?.mode, location: frontendContext?.location, allIntents: allResolvedIntents }
        }).catch(e => console.error('❌ Log failed:', e.message));

        return { ...result, intent: primaryIntent, topRecommendations };

    } catch (error) {
        console.error("AI run failed:", error);
        return getFallbackResponse(query);
    }
}
