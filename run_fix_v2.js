
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log("Fixing 'Finomságok'...");

    // 1. Check exactly what matches (maybe whitespace?)
    const { data: checks } = await supabase.from('menu_categories').select('*').ilike('name', '%Finomságok%');
    console.log("Found matches:", checks);

    if (checks && checks.length > 0) {
        // 2. Update by ID to be sure
        for (const cat of checks) {
            const { error } = await supabase
                .from('menu_categories')
                .update({ name: 'Hidegtálak' })
                .eq('id', cat.id);

            if (error) console.error("Error updating ID", cat.id, error);
            else console.log("Updated ID", cat.id);
        }
    } else {
        console.log("No partial matches found either. Weird.");
    }
}

fix();
