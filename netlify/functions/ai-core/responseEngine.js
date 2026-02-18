import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

export async function generateResponse({ intent, query, context, history }) {
    // 1. Select Model (response model with system instruction from modelRouter)
    // We pass the SYSTEM_PROMPT text to getModel so it can set it as systemInstruction
    const model = getModel("response", SYSTEM_PROMPT);

    // 2. Prepare Context
    const contextString = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : "Nincs extra adat.";

    const fullPrompt = `
KONTEXTUS ADATOK (${intent}):
${contextString}

KÉRDÉS:
${query}
`;

    // 3. Prepare History (Convert to Gemini Format)
    // History should NOT contain the system prompt, as that's handled by the model config
    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // 4. Start Chat
    const chat = model.startChat({
        history: chatHistory
    });

    // 5. Generate Response
    try {
        const result = await chat.sendMessage(fullPrompt);
        const raw = result.response.text();

        // 6. Parse JSON
        // Remove markdown code blocks if present
        const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanRaw);
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
