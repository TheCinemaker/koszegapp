import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// System prompt for the AI assistant
const SYSTEM_PROMPT = `Te egy Kőszeg városi AI asszisztens vagy. Segítesz a turistáknak és helyieknek információkat találni.

FONTOS SZABÁLYOK:
1. Csak a megadott adatok alapján válaszolj
2. Ha nincs adat, mondd meg őszintén: "Sajnálom, erről nincs információm"
3. NE találj ki információkat - csak a context-ben lévő adatokat használd
4. Rövid, lényegre törő, barátságos válaszok
5. Ha az app-ban tudsz segíteni (pl. megnyitni egy oldalt), ajánld fel
6. Tudj ajánlani eseményeket, látnivalókat, éttermeket, szállásokat

ELÉRHETŐ FUNKCIÓK:
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
- "Ajánlom a Jurisics várat! Ez Kőszeg jelképe, 1532-ben..."
- "Mutatom is, itt a KoszegEats! Mit keressek neked? Pizza?"
- "Megnyitom az eseményeket és mutatom a mai programokat!"
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
            .limit(10);
        if (events) context.events = events;

        // Supabase: Restaurants
        const { data: restaurants } = await supabase
            .from('restaurants')
            .select('*')
            .limit(20);
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
        context.attractions.slice(0, 10).forEach(a => {
            contextStr += `- ${a.name}: ${a.description?.substring(0, 100) || 'Kőszeg egyik látnivalója'}...\n`;
        });
        contextStr += '\n';
    }

    if (context.restaurants?.length > 0) {
        contextStr += 'ÉTTERMEK:\n';
        context.restaurants.slice(0, 10).forEach(r => {
            contextStr += `- ${r.name} (${r.address || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.hotels?.length > 0) {
        contextStr += 'SZÁLLÁSOK:\n';
        context.hotels.slice(0, 5).forEach(h => {
            contextStr += `- ${h.name} (${h.address || 'Kőszeg'})\n`;
        });
        contextStr += '\n';
    }

    if (context.parking?.length > 0) {
        contextStr += 'PARKOLÓK:\n';
        context.parking.slice(0, 5).forEach(p => {
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
        const { query, conversationHistory = [] } = JSON.parse(event.body);

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query is required' }),
            };
        }

        // Gather context from all sources
        const context = await gatherContext(query);
        const contextString = buildContextString(context);

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
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
        const text = response.text();

        // Check for function calls
        const functionCalls = response.functionCalls();
        let action = null;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            action = {
                type: call.name,
                params: call.args || {},
            };
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
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to process request',
                details: error.message,
            }),
        };
    }
}
