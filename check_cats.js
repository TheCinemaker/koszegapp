
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    console.log("Checking menu_categories table...");
    const { data, error } = await supabase
        .from('menu_categories')
        .select('name');

    if (error) {
        console.error(error);
        return;
    }

    const uniqueNames = [...new Set(data.map(c => c.name))];
    console.log("Distinct Categories in DB:", uniqueNames);

    if (uniqueNames.includes('Finomságok')) {
        console.log("❌ ALERT: 'Finomságok' still exists!");
    } else {
        console.log("✅ 'Finomságok' is NOT present.");
    }
}

checkCategories();
