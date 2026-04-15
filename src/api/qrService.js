import { supabase, supabaseGuest } from '../lib/supabaseClient';

// ============================================================
// QR Platform Service v3 — TELJES IZOLÁCIÓ
// Saját qr_restaurants, qr_menu_*, qr_orders táblák.
// SEMMI köze az EATS restaurants / menu_items táblákhoz.
// ============================================================

// ── ÉTTEREM ───────────────────────────────────────────────

export async function getQRRestaurant(qrRestaurantId) {
    const { data, error } = await supabaseGuest
        .from('qr_restaurants')
        .select('*')
        .eq('id', qrRestaurantId)
        .single();
    if (error) throw error;
    return data;
}

export async function getMyQRRestaurant(userId) {
    const { data, error } = await supabase
        .from('qr_restaurants')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function registerQRRestaurant({ userId, name, address, phone, logoUrl }) {
    const { data, error } = await supabase
        .from('qr_restaurants')
        .insert({
            owner_id: userId,
            name,
            address,
            phone,
            logo_url: logoUrl,
            subscription_active: true
        })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateQRRestaurant(qrRestaurantId, updates) {
    const { data, error } = await supabase
        .from('qr_restaurants')
        .update(updates)
        .eq('id', qrRestaurantId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ── ÉTLAP (vendég) ────────────────────────────────────────

export async function getQRMenu(qrRestaurantId) {
    if (!qrRestaurantId) return [];

    const { data: categories, error: catErr } = await supabaseGuest
        .from('qr_menu_categories')
        .select('*')
        .eq('qr_restaurant_id', qrRestaurantId)
        .eq('is_active', true)
        .order('sort_order');

    if (catErr) throw catErr;
    if (!categories?.length) return [];

    const { data: items, error: itemErr } = await supabaseGuest
        .from('qr_menu_items')
        .select('*')
        .eq('qr_restaurant_id', qrRestaurantId)
        .eq('is_available', true)
        .order('sort_order');

    if (itemErr) throw itemErr;

    return categories.map(cat => ({
        ...cat,
        items: (items || []).filter(i => i.category_id === cat.id)
    }));
}

// ── ÉTLAP (admin — minden tétel, is_available szűrés nélkül) ──

export async function getQRMenuAdmin(qrRestaurantId) {
    if (!qrRestaurantId) return [];

    const { data: categories, error: catErr } = await supabase
        .from('qr_menu_categories')
        .select('*')
        .eq('qr_restaurant_id', qrRestaurantId)
        .order('sort_order');

    if (catErr) throw catErr;

    const { data: items, error: itemErr } = await supabase
        .from('qr_menu_items')
        .select('*')
        .eq('qr_restaurant_id', qrRestaurantId)
        .order('sort_order');

    if (itemErr) throw itemErr;

    return (categories || []).map(cat => ({
        ...cat,
        items: (items || []).filter(i => i.category_id === cat.id)
    }));
}

// ── SESSION KEZELÉS ───────────────────────────────────────

export function generateSessionToken(qrRestaurantId, tableId) {
    const date = new Date().toISOString().slice(0, 10);
    return `${qrRestaurantId}_${tableId}_${date}`;
}

const inflightSessions = new Map();

export async function getOrCreateTableSession(qrRestaurantId, tableId) {
    if (!qrRestaurantId || !tableId) return null;

    const token = generateSessionToken(qrRestaurantId, tableId);

    // Ha épp folyamatban van ennek a létrehozása/lekérése (pl. React double-mount), visszadjuk a folyamatban lévő promise-t
    if (inflightSessions.has(token)) return inflightSessions.get(token);

    const promise = (async () => {
        const { data: existingList } = await supabaseGuest
            .from('qr_orders')
            .select('*')
            .eq('session_token', token)
            .in('status', ['active', 'payment_requested'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (existingList && existingList.length > 0) return existingList[0];

        const { data: newSession, error } = await supabaseGuest
            .from('qr_orders')
            .insert({
                qr_restaurant_id: qrRestaurantId,
                table_id: tableId,
                session_token: token,
                items: [],
                total_price: 0,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return newSession;
    })();

    inflightSessions.set(token, promise);

    try {
        const result = await promise;
        return result;
    } catch (e) {
        inflightSessions.delete(token);
        throw e;
    } finally {
        setTimeout(() => inflightSessions.delete(token), 1000);
    }
}



// ── RENDELÉS KEZELÉS ──────────────────────────────────────

export async function addItemsToOrder(orderId, newItems, existingItems) {
    const merged = [...existingItems];

    newItems.forEach(newItem => {
        const existing = merged.find(i => i.id === newItem.id);
        if (existing) {
            existing.qty += newItem.qty;
        } else {
            merged.push({ ...newItem, ordered_at: new Date().toISOString(), served: false });
        }
    });

    const total = merged.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const { data, error } = await supabaseGuest
        .from('qr_orders')
        .update({ items: merged, total_price: total, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function callWaiter(orderId) {
    const { data, error } = await supabaseGuest
        .from('qr_orders')
        .update({ waiter_called: true, waiter_called_at: new Date().toISOString() })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data;
}

export async function requestPayment(orderId, method) {
    const { data, error } = await supabaseGuest
        .from('qr_orders')
        .update({ 
            status: 'payment_requested', 
            payment_requested_at: new Date().toISOString(),
            notes: method 
        })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data;
}

// ── PINCÉR / ADMIN ────────────────────────────────────────

export async function getActiveOrders(qrRestaurantId) {
    const { data, error } = await supabase
        .from('qr_orders')
        .select('*')
        .eq('qr_restaurant_id', qrRestaurantId)
        .in('status', ['active', 'payment_requested'])
        .order('created_at');
    if (error) throw error;
    return data || [];
}

export async function markItemServed(orderId, itemId, existingItems) {
    const updated = existingItems.map(item =>
        item.id === itemId ? { ...item, served: true } : item
    );
    const { data, error } = await supabase
        .from('qr_orders')
        .update({ items: updated })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data;
}

export async function closeTable(orderId) {
    const { data, error } = await supabase
        .from('qr_orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data;
}

export async function acknowledgeWaiterCall(orderId) {
    const { data, error } = await supabase
        .from('qr_orders')
        .update({ waiter_called: false })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data;
}

// ── ÉTLAP SZERKESZTÉS ─────────────────────────────────────

export async function saveQRCategory(qrRestaurantId, category, isNew = true) {
    if (isNew) {
        const { id, ...rest } = category;
        const { data, error } = await supabase
            .from('qr_menu_categories')
            .insert({ ...rest, qr_restaurant_id: qrRestaurantId })
            .select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('qr_menu_categories')
            .update(category)
            .eq('id', category.id)
            .select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteQRCategory(categoryId) {
    const { error } = await supabase.from('qr_menu_categories').delete().eq('id', categoryId);
    if (error) throw error;
}

export async function saveQRItem(qrRestaurantId, item, isNew = true) {
    if (isNew) {
        const { id, ...rest } = item;
        const { data, error } = await supabase
            .from('qr_menu_items')
            .insert({ ...rest, qr_restaurant_id: qrRestaurantId })
            .select().single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('qr_menu_items')
            .update(item)
            .eq('id', item.id)
            .select().single();
        if (error) throw error;
        return data;
    }
}

export async function deleteQRItem(itemId) {
    const { error } = await supabase.from('qr_menu_items').delete().eq('id', itemId);
    if (error) throw error;
}

export async function toggleQRItemAvailability(itemId, currentStatus) {
    const { data, error } = await supabase
        .from('qr_menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId)
        .select().single();
    if (error) throw error;
    return data;
}
