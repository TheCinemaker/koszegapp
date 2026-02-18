import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

export async function generateResponse({ intent, query, context, history }) {
    // Intelligent Routing: Hybrid Data Layer
    const hasLocalData =
        (context.events && context.events.length > 0) ||
        (context.attractions && context.attractions.length > 0) ||
        (context.restaurants && context.restaurants.length > 0) ||
        (context.hotels && context.hotels.length > 0);

    const enableSearch = !hasLocalData || ['general_info', 'unknown'].includes(intent);

    // 1. Select Model
    const model = getModel({
        enableSearch,
        systemInstruction: SYSTEM_PROMPT
    });

    // 2. Prepare Context
    const now = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });
    const contextString = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : "Nincs extra adat.";

    const fullPrompt = `
AKTUÁLIS IDŐ: ${now}

KÖRNYEZET:
- Időjárás: ${context.weather ? `${context.weather.temp}°C, ikon: ${context.weather.icon}` : 'Ismeretlen'}
- App mode: ${context.mode || 'unknown'}
- Távolság Kőszeg főtértől: ${context.distanceToMainSquare ? Math.round(context.distanceToMainSquare) + ' méter' : 'Ismeretlen'}
- Felhasználó: ${context.mode === 'remote' ? 'NEM' : 'IGEN'}, Kőszegen tartózkodik.

KONTEXTUS ADATOK (${intent}):
${contextString}

DÖNTÉS MOTOR:
${context.decision ? JSON.stringify(context.decision) : "Nincs kényszerített döntés."}

KERESETT ÉTELEK:
${context.menuItems ? JSON.stringify(context.menuItems, null, 2) : "Nincs találat."}

KÉRDÉS:
${query}

UTASÍTÁS:
MINDENKÉPPEN JSON-ben válaszolj ("text" és "action" mezőkkel).
`;

    // 3. Prepare History
    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || "" }]
    }));

    // 4. Start Chat
    const chat = model.startChat({
        history: chatHistory
    });

    // 5. Generate Response
    try {
        const result = await chat.sendMessage(fullPrompt);
        const raw = result.response.text();

        let parsed = null;

        // Try to parse JSON from text
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("JSON Parse failed, trying function fallback");
            }
        }

        // 🧠 NATIVE TOOL CALL FALLBACK
        // If Gemini returns a function call instead of JSON text
        if (!parsed) {
            const calls = result.response.functionCalls();
            if (calls && calls.length > 0) {
                console.log("🛠️ Tool-Call Fallback:", calls[0].name);
                parsed = {
                    text: "Parancs végrehajtása...",
                    action: { type: calls[0].name, params: calls[0].args },
                    confidence: 1.0
                };
            }
        }

        if (!parsed) {
            throw new Error("No JSON or FunctionCall found");
        }

        // Schema defaults
        if (!parsed.text) parsed.text = "Sikerült!";
        if (!parsed.action) parsed.action = null;

        // 🛡️ ENTERPRISE SAFEGUARD: Block Non-Public Features
        if (parsed.action && (
            parsed.action.type.includes('food') ||
            parsed.action.type.includes('game') ||
            parsed.action.type.includes('ticket')
        )) {
            console.log("🛡️ BLOCKED Restricted Action:", parsed.action.type);
            parsed.action = null;
        }

        return parsed;
    } catch (e) {
        console.warn('Response generation failed:', e);
        return {
            text: "Elnézést, technikai hiba történt. Próbáld újra később.",
            action: null,
            confidence: 0.0
        };
    }
}
