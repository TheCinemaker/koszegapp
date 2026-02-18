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
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', today)
            .order('date', { ascending: true })
            .limit(10); // Fetch more initially to allow filtering

        if (error) {
            console.error('Error fetching events:', error);
            return [];
        }

        const now = new Date();

        // Backend filtering: Remove events that have already ended
        // Assumption: If no end time, event lasts 2 hours from start time
        const activeEvents = events.filter(event => {
            if (!event.time && !event.start_time) {
                // No specific time -> Treat as all-day event (valid for today)
                return true;
            }

            const timeString = event.time || event.start_time;
            try {
                // Combine date and time to get start timestamp
                // Handle potential format issues if time doesn't match HH:mm
                const eventStart = new Date(`${event.date}T${timeString}`);

                // Implicit 2-hour duration
                const eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

                return eventEnd > now;
            } catch (e) {
                console.warn(`Invalid date/time for event ${event.id}:`, e);
                return true; // Keep on error to be safe
            }
        });

        // Return top 5 active events
        return activeEvents.slice(0, 5);
    } catch (err) {
        console.error('Unexpected error in loadEvents:', err);
        return [];
    }
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
