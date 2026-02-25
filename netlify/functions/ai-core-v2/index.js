/**
 * index.js – ai-core-v2 (v6 Full Intelligence Pipeline)
 *
 * 1.  Intent + Entities
 * 2.  Context (GPS, speed, mobility, time)
 * 3.  Situation Analyzer (in_city / not_in_city / approaching)
 * 4.  Weather (Open-Meteo, silent fail)
 * 5.  State (Supabase RLS)
 * 6.  User Profile (Supabase RLS)
 * 7.  Router (deterministic state machine)
 * 8.  Action Execution (Supabase writes)
 * 9.  State Persist (Supabase RLS)
 * 10. Response (rankingEngineV2 + LLM text only)
 * 11. Upsell injection (optional, no active flow only)
 */
import { detectIntent } from './intentClassifier.js';
import { extractEntities } from './entityExtractor.js';
import { loadContext } from './contextLoader.js';
import { analyzeSituation } from './situationAnalyzer.js';
import { getWeather } from './weatherService.js';
import { getState, saveState } from './stateRepository.js';
import { getUserProfile } from './profileEngine.js';
import { routeConversation } from './router.js';
import { executeAction } from './actionExecutor.js';
import { generateResponse } from './responseGenerator.js';
import { resolveIntents } from './intentResolver.js';

export async function runAI({ query, history, frontendContext, token }) {
    try {
        if (!frontendContext?.userId && !token) {
            console.warn('ai-core-v2: guest session (no JWT, no userId)');
        }

        const userId = frontendContext?.userId || 'guest';

        // 1️⃣ INTENT + ENTITIES
        const rawIntents = detectIntent(query);
        const intents = resolveIntents(rawIntents);
        const entities = extractEntities(query);

        // 2️⃣ CONTEXT (GPS, speed, mobility, time of day)
        const context = await loadContext(frontendContext);

        // 3️⃣ SITUATION ANALYSIS (in_city vs not / approaching)
        const situation = analyzeSituation(frontendContext);
        context.situation = situation;

        // Speed-aware suppression: fast-moving → suppress walking suggestions
        context.suppressWalking = situation.speed > 15;

        // 4️⃣ WEATHER (real-time, silent fail)
        let weather = frontendContext?.weather || null;
        if (!weather && context.location?.lat && context.location?.lng) {
            weather = await getWeather(context.location.lat, context.location.lng);
        }
        context.weather = weather;

        // 5️⃣ STATE (RLS via JWT)
        const state = await getState(userId, token);

        // 6️⃣ USER PROFILE (null for new users, silent fail)
        const profile = await getUserProfile(userId, token);
        context.profile = profile;

        // 7️⃣ ROUTING (deterministic state machine)
        const routing = routeConversation({ intents, entities, state, context, query });

        // 8️⃣ ACTION EXECUTION (Supabase writes, RLS safe)
        const frontendAction = routing.action
            ? await executeAction(routing.action, userId, token)
            : null;

        // 9️⃣ PERSIST STATE (RLS via JWT)
        await saveState(userId, routing.newState, token);

        // 🔟 GENERATE RESPONSE (JSON + rankingEngineV2 + LLM text)
        const response = await generateResponse({
            replyType: routing.replyType,
            state: routing.newState,
            context,
            weather,
            profile,
            query,
            intents
        });

        // 1️⃣1️⃣ UPSELL (only when no active flow)
        const isInFlow = routing.newState.phase !== 'idle';
        const secondarySuggestion = (!isInFlow && response._rankedPlaces?.length > 3)
            ? response._rankedPlaces[3]
            : null;

        return {
            text: response.text,
            action: frontendAction ?? response.action ?? null,
            ...(secondarySuggestion ? { upsell: secondarySuggestion } : {})
        };

    } catch (error) {
        console.error("ai-core-v2 error:", error.message);
        return { text: "Technikai hiba történt, próbáld újra! 🔧", action: null };
    }
}
