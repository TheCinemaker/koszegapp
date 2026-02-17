import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is missing!');
}
if (!process.env.VITE_SUPABASE_URL) {
    console.error('VITE_SUPABASE_URL is missing!');
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('VITE_SUPABASE_ANON_KEY is missing!');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

// System prompt for the AI assistant
const SYSTEM_PROMPT = `Te egy Kőszeg városi AI asszisztens vagy. Segítesz a turistáknak és helyieknek információkat találni.

NYELV:
Mindig a felhasználó nyelvén válaszolj.
- Ha magyarul ír, magyarul válaszolj.
- Ha németül ír, németül válaszolj (Kőszegen sok az osztrák turista!).
- Ha angolul ír, angolul válaszolj.

FONTOS SZABÁLYOK:
1. Csak a megadott adatok vagy a Google keresés (Grounding) alapján válaszolj
2. Ha nincs adat, keress rá a Google-ön vagy mondd meg őszintén
3. Rövid, lényegre törő, barátságos válaszok
4. Ha az app-ban tudsz segíteni (pl. megnyitni egy oldalt), ajánld fel
5. Tudj ajánlani eseményeket, látnivalókat, éttermeket, szállásokat

ELÉRHETŐ FUNKCIÓK:
- Google keresés (automatikus, ha nincs adatod)
- Események megtekintése és ajánlása
- Éttermek és ételrendelés (KoszegEats)
- Látnivalók információi és ajánlása
- Szállások keresése
- Parkolók keresése
- Szabadidős programok
- Navigáció az app-ban
- Parkolójegy vásárlás
- Sürgősségi hívás (112)

PÉLDA VÁLASZOK:
- "3 program van holnap: Koncert a várban 18:00-kor..."
- "Ich empfehle die Burg Jurisics! Sie ist das Wahrzeichen von Kőszeg..." (Német)
- "I can show you the best pizza places. Opening KoszegEats now!" (Angol)
- "Azonnal hívom a 112-t!"`;

// Available functions for the AI
const functions = [
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
                licensePlate: {
                    type: 'string',
                    description: 'License plate number to pre-fill (e.g., ABC123)',
                },
            },
        },
    },
    {
        name: 'call_emergency',
        description: 'Immediately call emergency services (112 - EU emergency number) for ambulance, fire, or police',
        parameters: {
            type: 'object',
            properties: {
                service: {
                    type: 'string',
                    enum: ['ambulance', 'fire', 'police', 'emergency'],
                    description: 'Type of emergency service needed',
                },
            },
            required: ['service'],
        },
    },
];

// Read JSON file helper - use fetch from deployed URL
async function readJSON(filename) {
    try {
        // In production, fetch from the deployed site
        const baseUrl = process.env.URL || 'https://koszegapp.hu';
        const response = await fetch(`${baseUrl}/data/${filename}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
}

// Gather context from all data sources
async function gatherContext(query) {
    const context = {};
    const lowerQuery = query.toLowerCase();

    // Always load key data
    try {
        // Supabase: Events
        const { data: events } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(5);
        if (events) context.events = events;

        // Supabase: Restaurants
        const { data: restaurants } = await supabase
            .from('restaurants')
            .select('*')
            .limit(10);
        if (restaurants) context.restaurants = restaurants;

        // JSON: Attractions
        const attractions = await readJSON('attractions.json');
        if (attractions) context.attractions = attractions;

        // JSON: Hotels
        if (lowerQuery.includes('szállás') || lowerQuery.includes('hotel')) {
            const hotels = await readJSON('hotels.json');
            if (hotels) context.hotels = hotels;
        }

        // JSON: Leisure
        if (lowerQuery.includes('szabadidő') || lowerQuery.includes('program')) {
            const leisure = await readJSON('leisure.json');
            if (leisure) context.leisure = leisure;
        }

        // JSON: Parking
        if (lowerQuery.includes('parkol')) {
            const parking = await readJSON('parking.json');
            if (parking) context.parking = parking;
        }

        // SMART FOOD RECOMMENDATIONS: Today's popular items (GDPR-compliant)
        if (lowerQuery.includes('étel') || lowerQuery.includes('rend') || lowerQuery.includes('pizza') || lowerQuery.includes('burger')) {
            const today = new Date().toISOString().split('T')[0];
            const { data: orders } = await supabase
                .from('orders')
                .select('id')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`);

            if (orders && orders.length > 0) {
                const orderIds = orders.map(o => o.id);
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select('item_name, quantity')
                    .in('order_id', orderIds);

                if (orderItems && orderItems.length > 0) {
                    // Aggregate by item name
                    const itemCounts = {};
                    orderItems.forEach(item => {
                        itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
                    });

                    // Sort by popularity
                    const popularItems = Object.entries(itemCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([name, count]) => ({ name, count }));

                    context.popularFoods = popularItems;
                }
            }
        }
    } catch (error) {
        console.error('Error gathering context:', error);
    }

    return context;
}

// Build context string for AI
function buildContextString(context) {
    let contextStr = 'ELÉRHETŐ ADATOK:\n\n';

    if (context.events?.length > 0) {
        contextStr += 'ESEMÉNYEK:\n';
        context.events.forEach(e => {
            contextStr += `- ${e.name} (${e.date}, ${e.location || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.attractions?.length > 0) {
        contextStr += 'LÁTNIVALÓK:\n';
        context.attractions.slice(0, 5).forEach(a => {
            contextStr += `- ${a.name}: ${a.description?.substring(0, 50) || 'Kőszeg egyik látnivalója'}...\n`;
        });
        contextStr += '\n';
    }

    if (context.restaurants?.length > 0) {
        contextStr += 'ÉTTERMEK:\n';
        context.restaurants.slice(0, 5).forEach(r => {
            contextStr += `- ${r.name} (${r.address || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.hotels?.length > 0) {
        contextStr += 'SZÁLLÁSOK:\n';
        context.hotels.slice(0, 3).forEach(h => {
            contextStr += `- ${h.name} (${h.address || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.parking?.length > 0) {
        contextStr += 'PARKOLÓK:\n';
        context.parking.slice(0, 3).forEach(p => {
            contextStr += `- ${p.name} (${p.address || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.popularFoods?.length > 0) {
        contextStr += 'MA NÉPSZERŰ ÉTELEK (amit mások rendeltek):\n';
        context.popularFoods.forEach(f => {
            contextStr += `- ${f.name} (${f.count}x rendelve ma)\n`;
        });
        contextStr += '\n';
    }

    return contextStr;
}

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('AI Assistant function called');

        // Check environment variables
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is missing');
        }

        const { query, conversationHistory = [] } = JSON.parse(event.body);

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query is required' }),
            };
        }

        console.log('Query received:', query);

        // Gather context from all sources
        const context = await gatherContext(query);
        const contextString = buildContextString(context);

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPT,
            tools: [
                { functionDeclarations: functions },
                { googleSearch: {} }, // Enable Google Search Grounding relative to request
            ],
        });

        // Build conversation history
        const history = conversationHistory.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        // Start chat session
        const chat = model.startChat({
            history,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        });

        // Send message with context
        const fullQuery = `${contextString}\n\nFELHASZNÁLÓ KÉRDÉSE: ${query}`;
        const result = await chat.sendMessage(fullQuery);
        const response = result.response;

        // Check for function calls FIRST
        const functionCalls = response.functionCalls();
        let action = null;
        let text = '';

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            action = {
                type: call.name,
                params: call.args || {},
            };

            // If function call exists, generate friendly text based on action
            const actionMessages = {
                navigate_to_events: 'Megnyitom az eseményeket!',
                navigate_to_food: 'Megnyitom a KoszegEats-t!',
                navigate_to_parking: 'Megnyitom a parkolókat!',
                navigate_to_attractions: 'Megnyitom a látnivalókat!',
                navigate_to_hotels: 'Megnyitom a szállásokat!',
                navigate_to_leisure: 'Megnyitom a szabadidős programokat!',
                buy_parking_ticket: 'Megnyitom a parkolójegy vásárlást!',
                call_emergency: 'Azonnal hívom a 112-t!',
            };
            text = actionMessages[action.type] || 'Rendben, intézem!';
        } else {
            // Only try to get text if no function call, otherwise it might throw
            try {
                text = response.text();
            } catch (e) {
                console.error('Error getting text from response:', e);
                text = 'Sajnálom, nem értettem pontosan.';
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: text,
                action,
            }),
        };
    } catch (error) {
        console.error('AI Assistant Error:', error);
        // Return 200 with error message to see it in frontend console instead of generic 500
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: `Sajnálom, hiba történt a rendszerben. (Hibakód: ${error.message})`,
                debug: error.stack
            }),
        };
    }
}
