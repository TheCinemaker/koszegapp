import { getModel } from './modelRouter.js';

export async function classifyIntent(query) {
    try {
        const model = getModel("classifier"); // Uses gemini-2.5-flash

        const prompt = `
Osztályozd a felhasználó kérdését az alábbi kategóriák egyikébe (pontosan ezeket használd):
- food: Étel, ital, étterem, kávézó, pizzéria, cukrászda, "ennék valamit", "éhes vagyok".
- events: Programok, rendezvények, koncertek, mozi, színház, "mit csináljak ma".
- attractions: Látnivalók, műemlékek, Jézus Szíve templom, Jurisics vár, Óház-kilátó.
- hotels: Szállás, hotel, panzió, kemping.
- parking: Parkolás, parkolóhelyek, parkolójegy.
- leisure: Szabadidő, sport, túrázás, játszótér.
- emergency: Segélyhívás, orvos, gyógyszertár, rendőrség, tűzoltók.
- navigation: Útvonaltervezés, "hogyan jutok oda", térkép.
- smalltalk: Köszönés ("szia"), hogylét ("hogy vagy"), általános csevegés, időjárás, viccek.
- unknown: Ha a fentiek egyike sem illik rá egyértelműen.

PÉLDÁK:
"Hol tudok pizzát enni?" -> food
"Milyen programok vannak hétvégén?" -> events
"Mennyi a belépő a várba?" -> attractions
"Szia, ki vagy te?" -> smalltalk
"Hívj egy mentőt!" -> emergency
"Merre van a Fő tér?" -> navigation
"Mesélj egy viccet" -> smalltalk

Csak az intent kategória nevét add vissza (kisbetűvel), semmi mást.

Kérdés: "${query}"
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 100, // Increased to avoid truncation
                temperature: 0.3
            }
        });
        const intent = result.response.text().trim().toLowerCase();

        // Validate intent
        const validIntents = ['events', 'food', 'attractions', 'hotels', 'parking', 'leisure', 'emergency', 'navigation', 'smalltalk', 'unknown'];

        if (validIntents.includes(intent)) {
            return intent;
        } else {
            console.warn(`Intent validation failed. Raw: "${intent}"`);
            // Attempt to find intent in the response if model was chatty or truncated
            const found = validIntents.find(i => intent.includes(i) || i.startsWith(intent));
            if (found) {
                console.log(`Recovered intent from raw response "${intent}": ${found}`);
                return found;
            }
            return 'unknown';
        }
    } catch (error) {
        console.warn('Intent classification failed, defaulting to unknown:', error);
        return 'unknown';
    }
}

