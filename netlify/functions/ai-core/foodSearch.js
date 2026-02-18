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
                    name
                )
            `)
            .eq('is_available', true)
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5); // Limit to top 5 matches to save token context

        if (error) {
            console.error("Supabase Search Error:", error);
            return [];
        }

        console.timeEnd("SUPABASE_SEARCH");
        return data.map(item => ({
            item: item.name,
            price: item.price,
            description: item.description,
            place: item.restaurants?.name
        }));

    } catch (err) {
        console.error("Supabase Search Exception:", err);
        return [];
    }
}
