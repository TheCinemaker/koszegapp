import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

export async function generateResponse({ intent, query, context, history }) {
    // Intelligent Routing: Hybrid Data Layer
    // Only enable Google Search if local context is insufficient
    // This saves tokens and latency (and billing).

    const hasLocalData =
        (context.events && context.events.length > 0) ||
        (context.attractions && context.attractions.length > 0) ||
        (context.restaurants && context.restaurants.length > 0) ||
        (context.hotels && context.hotels.length > 0);

    // If no local data found OR intent is specifically external/general/unknown
    const enableSearch = !hasLocalData || ['general_info', 'unknown'].includes(intent);

    if (enableSearch) {
        console.log(`🌍 Hybrid Layer: Enabling Google Search (Intent: ${intent}, LocalData: ${hasLocalData})`);
    }

    // 1. Select Model
    // Refactored to use the new object-based signature
    const model = getModel({
        enableSearch,
        systemInstruction: SYSTEM_PROMPT
    });

    // 2. Prepare Context
    // Inject Current Time for accurate temporal reasoning
    const now = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });
    const contextString = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : "Nincs extra adat.";

    // Apple-level Context Injection & Enforce JSON
    // 🧠 PRO JAVÍTÁS: Explicit App Mode & Distance
    const fullPrompt = `
AKTUÁLIS IDŐ: ${now}

FELHASZNÁLÓ KONTEXTUS:
- App mode: ${context.mode || 'unknown'}
- Távolság Kőszeg főtértől: ${context.distanceToMainSquare ? Math.round(context.distanceToMainSquare) + ' méter' : 'Ismeretlen'}
- Felhasználó jelenleg: ${context.mode === 'remote' ? 'NEM tartózkodik Kőszegen (TÁVOLI FELHASZNÁLÓ)' : 'Kőszegen tartózkodik (HELYI FELHASZNÁLÓ)'}

KONTEXTUS ADATOK (${intent}):
${contextString}

DÖNTÉS MOTOR (Ezt kötelező követni, ha van):
${context.decision ? JSON.stringify(context.decision) : "Nincs kényszerített döntés."}

KERESETT ÉTELEK (Ha releváns):
${context.menuItems ? JSON.stringify(context.menuItems, null, 2) : "Nincs találat."}

KÉRDÉS:
${query}

UTASÍTÁS (FONTOS):
1. Ha a felhasználó REMOTE (nem Kőszegi):
   - NE indíts navigációt ("navigate_to_..."), kivéve ha kifejezetten útvonalat kér.
   - Inkább adj információt ("A Kékfény étterem híres a pizzájáról...").
   - Rendelést ne ajánlj fel, mert messze van.
2. Ha használtad a Google Keresést, a talált információt foglald össze röviden.
3. MINDENKÉPPEN JSON formátumban válaszolj!
`;

    // 3. Prepare History (Convert to Gemini Format)
    // History should NOT contain the system prompt, as that's handled by the model config
    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || "" }] // Safety guard
    }));

    // 4. Start Chat
    const chat = model.startChat({
        history: chatHistory
    });

    // 5. Generate Response
    try {
        const result = await chat.sendMessage(fullPrompt);
        const raw = result.response.text();

        // 6. Parse JSON Robustly (Regex Extraction)
        // Find the first JSON object in the response (handles markdown, extra text)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.warn("No JSON found in model response, raw:", raw);
            throw new Error("No JSON found in model response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Basic schema guard
        if (typeof parsed.text !== "string") {
            throw new Error("Invalid schema: 'text' field is missing or not a string");
        }

        if (!("confidence" in parsed)) {
            parsed.confidence = 0.8; // Default confidence
        }

        if (!("action" in parsed)) {
            parsed.action = null;
        }

        // 🛡️ ENTERPRISE SAFEGUARD: Remote Mode Validation
        // If user is remote, prevent implicit navigation commands that make no sense
        if (context.mode === 'remote' && parsed.action && parsed.action.type.startsWith('navigate_to_food')) {
            console.log("🛡️ BLOCKED Remote Navigation: User is not in city.");
            parsed.action = null; // Kill the action
            // Optional workflow: Change text to explain? 
            // Trusting LLM to have handled text correctly via prompt, but action is killed for safety.
        }

        return parsed;
    } catch (e) {
        console.warn('Response generation or parsing failed:', e);
        // Best effort fallback
        return {
            text: "Elnézést, egy technikai hiba miatt nem tudom feldolgozni a kérést. Próbáld újra később.",
            action: null,
            confidence: 0.0
        };
    }
}
