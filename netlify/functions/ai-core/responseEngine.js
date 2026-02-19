import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

export async function generateResponse({ intent, query, context, history }) {
    // Intelligent Routing: Hybrid Data Layer
    const appData = context.appData || {};
    const hasLocalData =
        (appData.events && appData.events.length > 0) ||
        (appData.attractions && appData.attractions.length > 0) ||
        (appData.restaurants && appData.restaurants.length > 0) ||
        (appData.hotels && appData.hotels.length > 0) ||
        (appData.parking && appData.parking.length > 0);

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
- Felhasználó távolsága a főtértől: ${context.distanceToMainSquare ? Math.round(context.distanceToMainSquare) + ' méter' : 'Ismeretlen'}
- Felhasználó Kőszegen van-e: ${context.distanceToMainSquare && context.distanceToMainSquare < 5000 ? 'IGEN' : context.distanceToMainSquare ? 'NEM - TÁVOL VAN, ne üdvözöld helyi userként!' : 'ISMERETLEN - ne feltételezd hogy ott van!'}
- App mode: ${context.mode || 'ismeretlen'}

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
        const response = result.response;
        const rawText = response.text();

        let parsed = null;

        // Try to parse JSON from text
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
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
            try {
                const calls = response.functionCalls();
                if (calls && calls.length > 0) {
                    console.log("🛠️ Tool-Call Fallback:", calls[0].name);
                    parsed = {
                        text: "Parancs végrehajtása...",
                        action: { type: calls[0].name, params: calls[0].args },
                        confidence: 1.0
                    };
                }
            } catch (fe) {
                console.warn("No function calls found in response.");
            }
        }

        if (!parsed) {
            // Ha van rawText, használjuk azt szövegként
            if (rawText && rawText.length > 10) {
                return {
                    text: rawText.replace(/```json|```/g, '').trim(),
                    action: null,
                    confidence: 0.5
                };
            }
            throw new Error("Empty response");
        }

        // Schema defaults
        if (!parsed.text) parsed.text = "Sikerült!";
        if (!parsed.action) parsed.action = null;

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
