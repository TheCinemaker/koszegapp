/**
 * index.js – ai-core-v2 (v5 Master Pipeline)
 *
 * Flow: detect → extract → context → state → route → execute → save → respond
 *
 * GPS-aware ✅  Speed-aware ✅  Multi-intent ✅  Deterministic parking ✅
 * Consent-safe save ✅  JSON-based answers ✅  LLM only for text ✅
 */
import { detectIntent } from './intentClassifier.js';
import { extractEntities } from './entityExtractor.js';
import { loadContext } from './contextLoader.js';
import { getState, saveState } from './stateRepository.js';
import { routeConversation } from './router.js';
import { executeAction } from './actionExecutor.js';
import { generateResponse } from './responseGenerator.js';
import { resolveIntents } from './intentResolver.js';

export async function runAI({ query, history, frontendContext, token }) {

    try {
        if (!token) throw new Error("JWT token missing – frontend must send Authorization header");
        if (!frontendContext?.userId) throw new Error("userId missing from frontendContext");

        const userId = frontendContext.userId;

        // 1️⃣ INTENT DETECTION (returns array, multi-intent)
        const rawIntents = detectIntent(query);
        const intents = resolveIntents(rawIntents); // priority-sorted, deduped

        // 2️⃣ ENTITY EXTRACTION (rendszám, időtartam, stb.)
        const entities = extractEntities(query);

        // 3️⃣ CONTEXT LOAD (GPS + speed + mobility + time-of-day)
        const context = await loadContext(frontendContext);

        // 4️⃣ LOAD CONVERSATION STATE (RLS via user JWT)
        const state = await getState(userId, token);

        // 5️⃣ DETERMINISTIC ROUTING (pure state machine)
        const routing = routeConversation({ intents, entities, state, context, query });

        // 6️⃣ EXECUTE ACTION (DB write or action payload build)
        const frontendAction = routing.action
            ? await executeAction(routing.action, userId, token)
            : null;

        // 7️⃣ PERSIST NEW STATE (RLS via user JWT)
        await saveState(userId, routing.newState, token);

        // 8️⃣ GENERATE TEXT RESPONSE (LLM only for language, reads JSON data)
        const response = await generateResponse({
            replyType: routing.replyType,
            state: routing.newState,
            context,
            query,
            intents
        });

        // executor action takes priority over generator action
        return {
            text: response.text,
            action: frontendAction ?? response.action ?? null
        };

    } catch (error) {
        console.error("ai-core-v2 error:", error.message);
        return {
            text: "Technikai hiba történt, próbáld újra! 🔧",
            action: null
        };
    }
}
