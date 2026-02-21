import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Backend
// We use VITE_ keys because they are likely the ones available in the Environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials missing in backend!");
}

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function searchMenu(query) {
    if (!supabase) return [];

    console.time("SUPABASE_SEARCH");
    try {
        // Simple fuzzy search on name and description
        // leveraging Supabase's 'ilike' (case-insensitive)
        const searchTerm = `%${query}%`;

        const { data, error } = await supabase
            .from('menu_items')
            .select(`
                id,
                name,
                price,
                description,
                is_available,
                restaurant_id,
                restaurants (
                    name,
                    tier
                )
            `)
            .eq('is_available', true)
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            //.order('restaurants(tier)', { ascending: false }) // Ideal if Supabase relation sorting worked easily, but we'll do in JS
            .limit(10); // Limit higher to allow filtering

        if (error) {
            console.error("Supabase Search Error:", error);
            return [];
        }

        console.timeEnd("SUPABASE_SEARCH");

        // 💰 PAID PRIORITY SORTING
        const tierScore = (tier) => {
            if (tier === 'gold') return 3;
            if (tier === 'silver') return 2;
            return 1;
        };

        const sortedData = data.sort((a, b) => {
            const tierA = a.restaurants?.tier;
            const tierB = b.restaurants?.tier;
            return tierScore(tierB) - tierScore(tierA);
        });

        return sortedData.slice(0, 5).map(item => ({
            item: item.name,
            price: item.price,
            description: item.description,
            place: item.restaurants?.name,
            isPremium: item.restaurants?.tier === 'gold' || item.restaurants?.tier === 'silver'
        }));

    } catch (err) {
        console.error("Supabase Search Exception:", err);
        return [];
    }
}
