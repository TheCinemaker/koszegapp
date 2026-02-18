import { getModel } from './modelRouter.js';
const FUNCTIONS_DEF = [
    {
        name: 'navigate_to_events',
        description: 'Navigate to the events page to show upcoming events',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'navigate_to_food',
        description: 'Navigate to the food ordering page (KoszegEats) with optional search term',
        parameters: {
            type: 'object',
            properties: {
                search: { type: 'string', description: 'Search term for food items (e.g., pizza, burger)' },
            },
        },
    },
    {
        name: 'navigate_to_parking',
        description: 'Navigate to the parking page to show parking spots',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'navigate_to_attractions',
        description: 'Navigate to the attractions page to show sights',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'navigate_to_hotels',
        description: 'Navigate to the hotels page to show accommodations',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'navigate_to_leisure',
        description: 'Navigate to the leisure activities page',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'buy_parking_ticket',
        description: 'Navigate to parking page to buy a parking ticket with optional license plate pre-fill',
        parameters: {
            type: 'object',
            properties: {
                licensePlate: { type: 'string', description: 'License plate number' },
            },
        },
    },
    {
        name: 'call_emergency',
        description: 'Immediately call emergency services (112)',
        parameters: {
            type: 'object',
            properties: {
                service: { type: 'string', enum: ['ambulance', 'fire', 'police', 'emergency'] },
            },
            required: ['service'],
        },
    },
];

const FUNCTIONS_LIST_TEXT = FUNCTIONS_DEF.map(f => `- ${f.name}: ${f.description}`).join('\n');

const SYSTEM_PROMPT = `Te egy Kőszeg városi AI asszisztens vagy (KőszegAPP).
Válaszolj röviden, hasznosan és barátságosan, a felhasználó nyelvén (Magyar, Német, Angol). A stílusod legyen segítőkész, de laza.

FONTOS:
1. Ha kapsz KONTEXTUS ADATOKAT, elsősorban azokból dolgozz.
2. Ha NINCS kontextus adat ("Nincs extra adat."), vagy a kérdés általános (smalltalk), akkor használd a saját általános tudásodat! Nyugodtan beszélgess, válaszolj kérdésekre, mesélj viccet, vagy adj általános információt Kőszegről fejből.
3. Ne mondd azt, hogy "nem tudom", csak ha tényleg semmi infód nincs. Próbálj mindig konstruktív lenni.

KIMENETI FORMÁTUM (MINDIG VALID JSON):
{
 "text": "A válasz szövege...",
 "action": { "type": "function_name", "params": {} },
 "confidence": 0.0-1.0
}

Ha nincs action, az action mező legyen null.
Ne írj markdown-t a JSON köré (pl \`\`\`json), csak a nyers JSON stringet.

ELÉRHETŐ FUNKCIÓK (action):
${FUNCTIONS_LIST_TEXT}
- Google keresés (automatikus, ha nincs adatod)

PÉLDA VÁLASZOK:
- Ha pizzát keres: "Ajánlom a [Étterem Neve]-t, ott isteni a pizza!" + action: navigate_to_food
- Ha csak köszön: "Szia! Miben segíthetek ma Kőszegen?" + action: null
`;

export async function generateResponse({ intent, query, context, history }) {
    // 1. Select Model
    // For simple intents we could use smaller models, but 'default' (Gemini 2.0 Flash) is best for general chat
    const model = getModel("default");

    // 2. Prepare Tools (we attach them to the model in modelRouter, but here we define the definitions context if needed)
    // Adding function definitions to tools config in modelRouter is static. 
    // If we want dynamic tools based on intent, we would do it here. 
    // For now, modelRouter has global tools. We will trust the modelRouter config.
    // Note: In modelRouter.js I only added googleSearch. I should add function declarations there or here.
    // Let's rely on modelRouter returning a model with tools, but currently modelRouter only has googleSearch.
    // I need to update the tool definition logic. 
    // CORRECTION: I will pass the tools config to the chat session or update the model generation.
    // Actually, `startChat` doesn't take tools, `getGenerativeModel` does.
    // So I need to make sure modelRouter includes these functions. 
    // HOWEVER, the user request showed a pattern where I just call `model.generateContent`.
    // The user example used `toolUse` implictly or relied on structured output.
    // The user example had: "text", "action".
    // This assumes the model "hallucinates" the action structure based on the prompt instructions, 
    // OR acts as a function caller and we parse it.
    // The prompt explicitly asks for JSON with "action". This is a "Structured Output" approach, NOT native Function Calling API.
    // This is often faster and cheaper than native function calling loops for this specific "UI Action" use case.

    // 3. specific context string
    const contextString = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : "Nincs extra adat.";

    const fullPrompt = `
KONTEXTUS ADATOK (${intent}):
${contextString}

KÉRDÉS:
${query}

Beszélgetés előzmény:
${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}
`;

    // 4. Generate
    // 4. Generate
    const result = await model.generateContent(SYSTEM_PROMPT + fullPrompt);

    const raw = result.response.text();

    // 5. Parse JSON
    try {
        // Remove markdown code blocks if present
        const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanRaw);
    } catch (e) {
        console.warn('JSON Parse failed, returning raw text as fallback', e);
        return {
            text: raw, // Best effort: return the raw text
            action: null,
            confidence: 0.6
        };
    }
}
