import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const restaurantId = '7f054252-ff1c-48fa-93cd-1d5fc40e36dc';

  async function printMenu() {
    console.log("=== CATEGORIES ===");
    const { data: categories, error: catErr } = await supabase
      .from('qr_menu_categories')
      .select('*')
      .eq('qr_restaurant_id', restaurantId);
    
    if (catErr) console.error(catErr);
    else console.log(JSON.stringify(categories, null, 2));

    console.log("\n=== ITEMS ===");
    const { data: items, error: itemErr } = await supabase
      .from('qr_menu_items')
      .select('*')
      .eq('qr_restaurant_id', restaurantId);

    if (itemErr) console.error(itemErr);
    else console.log(JSON.stringify(items, null, 2));
  }

  printMenu();

} catch (err) {
  console.error("Error:", err.message);
}
