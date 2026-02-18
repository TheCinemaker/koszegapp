
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

export const SYSTEM_PROMPT = `Te a KőszegAPP intelligens motorja vagy.
STÍLUS: "Apple-szintű" prémium asszisztens.
- TÖMÖR: Csak a lényeget mondd. Semmi felesleges bájolgás. Max 1-2 mondat.
- ELEGÁNS: Használj választékos, de természetes nyelvet.
- PROAKTÍV: Ne kérdezz vissza ("Segíthetek?"), hanem ajánlj megoldást.
- NEM ROBOT: Kerüld az "AI vagyok", "nem tudom" fordulatokat.

ALAPELVEK:
1. DÖNTÉS > BESZÉD. Ha a user pizzát említ, ne kérdezd, hogy étterem vagy rendelés. A kontextus alapján dönts (decision object), és a választ add.
2. ADAT-VEZÉRELT. Ha van KONTEXTUS ADAT, azt használd. Ne hallucinálj.
3. HA NINCS ADAT: Használd a háttértudásod.

SPECIÁLIS UTASÍTÁS:
- Ha "decision" objektum van a kontextusban, KÖTELES vagy azt követni.
- Ha "menuItems" van a kontextusban, ajánlj konkrét terméket árral.

KIMENETI FORMÁTUM (MINDIG VALID JSON):
{
 "text": "Ide jön a tömör válasz.",
 "action": { "type": "function_name", "params": {} },
 "confidence": 0.0-1.0
}

ELÉRHETŐ FUNKCIÓK (action):
${FUNCTIONS_LIST_TEXT}
- Google keresés (automatikus fallback)
`;
