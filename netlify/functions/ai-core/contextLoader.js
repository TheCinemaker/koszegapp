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
        // ALWAYS Load local JSON data FIRST
        const localEvents = await readJSON('events.json') || [];

        // Use Supabase only as a secondary check for very new items
        let dbEvents = [];
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('events')
                .select('*')
                .gte('date', today)
                .order('date', { ascending: true })
                .limit(20);
            dbEvents = data || [];
        } catch (e) {
            console.warn("Supabase loadEvents failed");
        }

        // Merge (Avoid duplicates by ID)
        const combined = [...localEvents];
        const seenIds = new Set(localEvents.map(e => String(e.id)));

        dbEvents.forEach(evt => {
            if (!seenIds.has(String(evt.id))) {
                combined.push(evt);
                seenIds.add(String(evt.id));
            }
        });

        const now = new Date();
        const activeEvents = combined.filter(event => {
            if (!event.date) return false;

            const eventDate = new Date(event.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (eventDate < today) return false;

            if (!event.time && !event.start_time) return true;

            const timeString = event.time || event.start_time;
            try {
                const eventStart = new Date(`${event.date}T${timeString}`);
                const eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
                return eventEnd > now;
            } catch (e) {
                return true;
            }
        });

        return activeEvents.slice(0, 20); // Give 20 events to AI
    } catch (err) {
        console.error('Unexpected error in loadEvents:', err);
        return [];
    }
}

async function loadRestaurants() {
    // Priority: local JSON
    const local = await readJSON('restaurants.json') || [];
    try {
        const { data: db } = await supabase.from('restaurants').select('*').limit(5);
        if (db) {
            const seenNames = new Set(local.map(r => r.name.toLowerCase()));
            db.forEach(r => {
                if (!seenNames.has(r.name.toLowerCase())) {
                    local.push(r);
                }
            });
        }
    } catch (e) { }
    return local.slice(0, 15);
}

async function loadPopularFood() {
    try {
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
                return Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
            }
        }
    } catch (e) { }
    return [];
}

async function loadRecentLogs(userId) {
    if (!userId) return '';
    try {
        const { data } = await supabase
            .from('ai_logs')
            .select('intent, action, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
        return data ? data.map(log => `(Prev: ${log.intent}, Act: ${log.action})`).join('; ') : '';
    } catch (e) { return ''; }
}

async function loadUserProfile(userId) {
    if (!userId) return null;
    try {
        const { data } = await supabase
            .from('koszegpass_users')
            .select('full_name, card_type, points') // license_plate ELTÁVOLÍTVA - több autó miatt
            .eq('id', userId)
            .single();
        return data;
    } catch (e) { return null; }
}

// ✅ ÚJ: Felhasználó autóinak betöltése
async function loadUserVehicles(userId) {
    if (!userId) return [];
    try {
        const { data, error } = await supabase
            .from('user_vehicles')
            .select('id, license_plate, nickname, carrier, is_default')
            .eq('user_id', userId)
            .order('is_default', { ascending: false }) // default autó először
            .order('created_at', { ascending: true });

        if (error) {
            console.warn('loadUserVehicles failed:', error.message);
            return [];
        }

        return data || [];
    } catch (e) {
        console.warn('loadUserVehicles exception:', e);
        return [];
    }
}

export async function loadContext(intent, query, userId) {
    console.log(`🧠 LOADING MASTER CONTEXT for: ${intent}`);

    const [recentHistory, profile, vehicles, events, restaurants, attractions, hotels, leisure, info, parking] = await Promise.all([
        loadRecentLogs(userId),
        loadUserProfile(userId),
        loadUserVehicles(userId), // ✅ ÚJ
        loadEvents(),
        loadRestaurants(),
        readJSON('attractions.json'),
        readJSON('hotels.json'),
        readJSON('leisure.json'),
        readJSON('info.json'),
        readJSON('parking.json')
    ]);

    const baseContext = {
        recentHistory,
        userProfile: profile,
        userVehicles: vehicles, // ✅ ÚJ - az AI látja az összes autót
        currentQuery: query,
        appData: {
            events: (events || []).slice(0, 15),
            restaurants: (restaurants || []).slice(0, 10),
            attractions: (attractions || []).slice(0, 10),
            hotels: (hotels || []).slice(0, 8),
            leisure: (leisure || []).slice(0, 8),
            info: (info || []).slice(0, 5),
            parking: (parking || [])
        }
    };

    switch (intent) {
        case 'restricted':
            return baseContext;
        case 'food_general':
            return { ...baseContext, popular: await loadPopularFood() };
        case 'events':
        case 'attractions':
        case 'hotels':
        case 'parking':
        case 'leisure':
        case 'emergency':
        case 'navigation':
        default:
            return baseContext;
    }
}
