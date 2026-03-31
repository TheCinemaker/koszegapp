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

// 1. Menü lekérése
export async function getMenu(restaurantId) {
    if (!restaurantId) return [];

    const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

    if (catError) throw catError;

    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (itemError) throw itemError;

    return categories.map(cat => ({
        ...cat,
        items: items.filter(i => i.category_id === cat.id),
    }));
}

// 2. Rendelés leadása (RPC hívás - Biztonságos Transactions)
export async function placeOrder({ restaurantId, customer, cartItems }) {
    if (!restaurantId || !cartItems || cartItems.length === 0) {
        throw new Error('Érvénytelen rendelési adatok');
    }

    // SECURITY: Fetch latest flash sale status from DB to prevent stale rules exploitation
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
        const rule = freshRules[item.id]; // Use FRESH rule

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

    // Prepare items for the RPC function
    const itemsJson = cartItems.map(item => {
        const rule = freshRules[item.id]; // Use FRESH rule
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

    // Call the database function
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
