import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

const supabase = createClient(
    CONFIG.SUPABASE_URL || 'https://dummy.supabase.co',
    CONFIG.SUPABASE_ANON_KEY || 'dummy-key'
);

// Helper to read JSON data
async function readJSON(filename) {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}/data/${filename}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
}

// Data loaders
async function loadEvents() {
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);
    return events || [];
}

async function loadRestaurants() {
    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .limit(10);
    return restaurants || [];
}

async function loadPopularFood() {
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
            const itemCounts = {};
            orderItems.forEach(item => {
                itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
            });

            return Object.entries(itemCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));
        }
    }
    return [];
}

export async function loadContext(intent, query) {
    console.log(`Loading context for intent: ${intent}`);

    switch (intent) {
        case 'food':
            return {
                restaurants: await loadRestaurants(),
                popular: await loadPopularFood()
            };

        case 'events':
            return {
                events: await loadEvents()
            };

        case 'attractions':
            return {
                attractions: await readJSON('attractions.json')
            };

        case 'hotels':
            return {
                hotels: await readJSON('hotels.json')
            };

        case 'parking':
            return {
                parking: await readJSON('parking.json')
            };

        case 'leisure':
            return {
                leisure: await readJSON('leisure.json')
            };

        case 'unknown':
        case 'smalltalk':
        default:
            return {};
    }
}
