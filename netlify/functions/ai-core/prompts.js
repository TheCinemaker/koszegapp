
export const FUNCTIONS_DEF = [
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

export const SYSTEM_PROMPT = `Te egy Kőszeg városi AI asszisztens vagy (KőszegAPP).
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
