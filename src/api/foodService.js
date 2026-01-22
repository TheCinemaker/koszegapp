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
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);

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

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Prepare items for the RPC function
    const itemsJson = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));

    // Call the database function
    const { data, error } = await supabase.rpc('place_order_full', {
        p_restaurant_id: restaurantId,
        p_customer_name: customer.name,
        p_customer_phone: customer.phone,
        p_customer_address: customer.address,
        p_customer_note: customer.note || '',
        p_total_price: totalPrice,
        p_items: itemsJson
    });

    if (error) {
        console.error('RPC Error:', error);
        throw error;
    }

    return data;
}
