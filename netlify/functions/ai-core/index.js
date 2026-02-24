import { detectIntent } from './intentMatcher.js';
import { loadContext } from './contextLoader.js';
import { generateResponse } from './responseEngine.js';
import { getFallbackResponse } from './fallbackEngine.js';
import { decideAction } from './decisionRouter.js';
import { searchMenu } from './foodSearch.js';
import { logInteraction } from './logger.js';
import { updateAIProfile } from './personalityEngine.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

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
        const decision = decideAction({
            intents,
            query,
            context: decisionContext
        });
        console.timeEnd("DECISION_ROUTER");

        const userId = frontendContext?.userId;
        const primaryIntent = decision.primaryIntent;
        topRecommendations = decision.primaryRecommendations || [];
        const allResolvedIntents = [primaryIntent, ...(decision.secondaryIntents || [])];

        // 🍔 Special Food Search
        if (intents.some(i => i?.includes('food')) || (primaryIntent && primaryIntent.includes('food'))) {
            const cleanQuery = query.replace(/rendel|házhoz|kiszállítás|futár|enni|beülni|étterem|pizzéria|szeretnék|kérek/gi, "").trim();
            if (cleanQuery.length > 2) {
                console.time("FOOD_SEARCH");
                menuItems = await searchMenu(cleanQuery);
                console.timeEnd("FOOD_SEARCH");
            }
        }

        console.log(`🧠 Decision Optimized: ${primaryIntent} -> ${decision?.action?.type || 'no action'} (Total Intents: ${allResolvedIntents.join(', ')})`);

        console.time("GENERATE_RESPONSE");
        const result = await generateResponse({
            intent: primaryIntent,
            query,
            context: { ...decisionContext, decision, menuItems, allIntents: allResolvedIntents },
            history
        });
        console.timeEnd("GENERATE_RESPONSE");

        // 💾 AUTO SAVE VEHICLE (szerver-oldali, frontend körút nélkül)
        // Ha új rendszámot detektált a decisionRouter ÉS a user be van jelentkezve, mentsük el automatikusan
        if (decision?.pureParkingFlow && decision?.detectedPlate && userId) {
            const detectedPlate = decision.detectedPlate;
            const knownPlates = (backendContext.userVehicles || []).map(v => v.license_plate?.toUpperCase());

            if (!knownPlates.includes(detectedPlate)) {
                // Új rendszám – mentjük (non-blocking)
                supabase.from('user_vehicles').insert({
                    user_id: userId,
                    license_plate: detectedPlate,
                    carrier: '70', // alapértelmezett előhívó, LLM majd megkérdezi
                    is_default: knownPlates.length === 0, // első autó legyen alapértelmezett
                }).then(({ error }) => {
                    if (error) console.warn('⚠️ Auto-save vehicle failed:', error.message);
                    else console.log(`✅ Auto-saved new vehicle: ${detectedPlate} for user ${userId}`);
                });
            }
        }

        // 🧠 LEARNING (Non-blocking)
        if (userId && decision) {
            updateAIProfile(userId, decision).catch(e => console.error('❌ Learning failed:', e.message));
        }

        // 📝 LOGGING (Non-blocking)
        logInteraction({
            userId,
            authToken: frontendContext?.authToken,
            query,
            intent: primaryIntent,
            action: result.action,
            response: result.text,
            context: { mode: frontendContext?.mode, location: frontendContext?.location, allIntents: allResolvedIntents }
        }).catch(e => console.error('❌ Log failed:', e.message));

        return {
            ...result,
            intent: primaryIntent,
            topRecommendations,
            metadata: {
                primaryIntent,
                secondaryIntents: decision.secondaryIntents,
                topRecommendations
            }
        };

    } catch (error) {
        console.error("AI run failed:", error);
        return getFallbackResponse(query);
    }
}
