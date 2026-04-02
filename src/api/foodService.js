import { supabase } from '../lib/supabaseClient';

// 0. Éttermek listázása
export async function getRestaurants() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .order('name');

    if (error) throw error;
    return data ?? [];
}

// 1. Menü lekérése (Resilient version with fallback)
export async function getMenu(restaurantId) {
    if (!restaurantId) return [];

    let catQuery = supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId);

    const { data: categories, error: catError } = await catQuery.order('sort_order');

    if (catError) {
        if (catError.code === '42703') { // Fallback if sort_order missing
            const { data: fallbackCats, error: fbError } = await catQuery;
            if (fbError) throw fbError;
            return await fetchItemsForCategories(fallbackCats, restaurantId);
        }
        throw catError;
    }

    return await fetchItemsForCategories(categories, restaurantId);
}

// Helper to fetch items and handle errors
async function fetchItemsForCategories(categories, restaurantId) {
    let itemQuery = supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId);

    const { data: items, error: itemError } = await itemQuery.order('sort_order', { ascending: true });

    if (itemError) {
        if (itemError.code === '42703') { // Column doesn't exist
            const { data: fallbackItems, error: fallbackError } = await itemQuery;
            if (fallbackError) throw fallbackError;
            return assembleMenu(categories, fallbackItems);
        }
        throw itemError;
    }

    return assembleMenu(categories, items);
}

// Helper to assemble and sort in-memory as a safety measure
function assembleMenu(categories, items) {
    const sortedCats = [...(categories || [])].sort((a, b) => (a.sort_order ?? a.order_index ?? 0) - (b.sort_order ?? b.order_index ?? 0));
    const sortedItems = [...(items || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return sortedCats.map(cat => ({
        ...cat,
        items: sortedItems.filter(i => i.category_id === cat.id),
    }));
}

// 2. Rendelés leadása (RPC hívás - Biztonságos Transactions)
export async function placeOrder({ restaurantId, customer, cartItems }) {
    if (!restaurantId || !cartItems || cartItems.length === 0) {
        throw new Error('Érvénytelen rendelési adatok');
    }

    // SECURITY: Fetch latest flash sale status from DB
    const { data: restData } = await supabase
        .from('restaurants')
        .select('flash_sale')
        .eq('id', restaurantId)
        .single();
    
    const fs = restData?.flash_sale || {};
    const isFlashActive = fs.active && (!fs.end_time || new Date(fs.end_time) > new Date());
    const freshRules = isFlashActive ? (fs.items || {}) : {};

    const isCollection = customer.address === 'Személyes átvétel';
    const totalPrice = cartItems.reduce((sum, item) => {
        const price = item.price || 0;
        const qty = item.quantity || 0;
        const rule = freshRules[item.id];

        if (rule && rule.type === 'percent') {
            const discount = (rule.value || 0) / 100;
            return sum + Math.round(price * (1 - discount) * qty);
        }

        if (rule && rule.type === 'bogo') {
            const paidQty = qty - Math.floor(qty / 2);
            return sum + (price * paidQty);
        }

        return sum + (price * qty);
    }, 0);

    const itemsJson = cartItems.map(item => {
        const rule = freshRules[item.id];
        let effectivePrice = item.price;
        let displayName = item.name;

        if (rule && rule.type === 'percent') {
            effectivePrice = Math.round(item.price * (1 - (rule.value || 0) / 100));
            displayName = `${item.name} (-${rule.value}%)`;
        }

        return {
            id: (String(item.id).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) ? item.id : null,
            name: displayName,
            price: effectivePrice,
            quantity: item.quantity
        };
    });

    const { data, error } = await supabase.rpc('place_order_full', {
        p_restaurant_id: restaurantId,
        p_customer_name: customer.name,
        p_customer_phone: customer.phone,
        p_customer_address: customer.address,
        p_customer_note: customer.note || '',
        p_total_price: totalPrice,
        p_items: itemsJson,
        p_user_id: customer.userId || null,
        p_payment_method: customer.paymentMethod || 'cash'
    });

    if (error) {
        console.error('RPC Error:', error);
        throw error;
    }

    return data;
}
