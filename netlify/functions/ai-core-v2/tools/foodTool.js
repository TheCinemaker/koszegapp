/**
 * tools/foodTool.js – KőszegAI v2.1
 * 
 * NOTE: Restaurants data currently lives in public/data/restaurants.json
 * (not yet in Supabase). This tool reads from the JSON file as primary source.
 * When data is migrated to Supabase, swap readJson() for a supabase query.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRestaurants() {
    try {
        const filePath = join(__dirname, '../../../../public/data/restaurants.json');
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch {
        return [];
    }
}

/**
 * Search restaurants by category/tag from local JSON.
 * Returns max 5 results to avoid overwhelming the user.
 */
export function searchFood(query) {
    const all = loadRestaurants();
    const q = query?.toLowerCase() || '';

    const matches = all.filter(r => {
        const tags = (r.tags || []).join(' ').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const type = (r.type || '').toLowerCase();
        return tags.includes(q) || name.includes(q) || type.includes(q) || q === '';
    });

    // Return top 5, preferring gold tier
    return matches
        .sort((a, b) => {
            if (a.tier === 'gold' && b.tier !== 'gold') return -1;
            if (b.tier === 'gold' && a.tier !== 'gold') return 1;
            return 0;
        })
        .slice(0, 5)
        .map(r => ({ id: r.id, name: r.name, address: r.address, type: r.type, tags: r.tags }));
}
