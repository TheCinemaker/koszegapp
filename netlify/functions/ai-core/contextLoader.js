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
            .limit(40); // Increased to cover future month requests (e.g. March)

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

async function loadRecentLogs(userId) {
    if (!userId) return [];

    const { data } = await supabase
        .from('ai_logs')
        .select('intent, action, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    return data ? data.map(log => `(Previous Intent: ${log.intent}, Action: ${log.action})`).join('; ') : '';
}

export async function loadContext(intent, query, userId) {
    console.log(`Loading context for intent: ${intent}`);

    // Always fetch recent history for context continuity
    const recentHistory = await loadRecentLogs(userId);

    const baseContext = { recentHistory };

    switch (intent) {
        case 'food':
            return {
                ...baseContext,
                restaurants: await loadRestaurants(),
                popular: await loadPopularFood()
            };

        case 'events':
            return {
                ...baseContext,
                events: await loadEvents()
            };

        case 'attractions':
            const attractions = await readJSON('attractions.json');
            return attractions ? { ...baseContext, attractions } : baseContext;

        case 'hotels':
            const hotels = await readJSON('hotels.json');
            return hotels ? { ...baseContext, hotels } : baseContext;

        case 'parking':
            const parking = await readJSON('parking.json');
            return parking ? { ...baseContext, parking } : baseContext;

        case 'leisure':
            const leisure = await readJSON('leisure.json');
            return leisure ? { ...baseContext, leisure } : baseContext;

        case 'unknown':
        case 'smalltalk':
        default:
            return baseContext;
    }
}
