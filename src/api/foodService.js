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

// 2. Rendelés leadása (RLS-safe, anon user)
export async function placeOrder({ restaurantId, customer, cartItems }) {
    if (!restaurantId) {
        throw new Error('Missing restaurantId');
    }

    if (!cartItems || cartItems.length === 0) {
        throw new Error('Empty cart');
    }

    // 1️⃣ Order insert (NO select!)
    const { error: orderError } = await supabase
        .from('orders')
        .insert({
            restaurant_id: restaurantId,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_address: customer.address,
            customer_note: customer.note || null,
            status: 'new',
            total_price: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        });

    if (orderError) {
        console.error('Order insert failed:', orderError);
        throw orderError;
    }

    // 2️⃣ Legutóbbi order ID lekérése (SAFE workaround)
    const { data: orderRow, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (fetchError) {
        console.error('Order fetch failed:', fetchError);
        throw fetchError;
    }

    // 3️⃣ Order items
    const orderItems = cartItems.map(item => ({
        order_id: orderRow.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Order items insert failed:', itemsError);
        throw itemsError;
    }

    return { id: orderRow.id };
}
