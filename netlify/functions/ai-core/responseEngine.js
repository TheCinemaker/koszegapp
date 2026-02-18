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
