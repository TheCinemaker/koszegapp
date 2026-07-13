import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually to avoid extra dependencies
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

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function checkDb() {
    console.log("Checking Supabase tables...");
    
    // 1. QR Restaurants
    const { data: restaurants, error: rErr } = await supabase.from('qr_restaurants').select('*');
    if (rErr) console.error("Error fetching qr_restaurants:", rErr);
    else console.log(`\n--- qr_restaurants (${restaurants?.length || 0} db) ---`, JSON.stringify(restaurants, null, 2));

    // 2. QR Menu Categories
    const { data: categories, error: cErr } = await supabase.from('qr_menu_categories').select('*');
    if (cErr) console.error("Error fetching qr_menu_categories:", cErr);
    else console.log(`\n--- qr_menu_categories (${categories?.length || 0} db) ---`, JSON.stringify(categories, null, 2));

    // 3. QR Menu Items
    const { data: items, error: iErr } = await supabase.from('qr_menu_items').select('*');
    if (iErr) console.error("Error fetching qr_menu_items:", iErr);
    else console.log(`\n--- qr_menu_items (${items?.length || 0} db) ---`, JSON.stringify(items, null, 2));

    // 4. QR Orders
    const { data: orders, error: oErr } = await supabase.from('qr_orders').select('*');
    if (oErr) console.error("Error fetching qr_orders:", oErr);
    else console.log(`\n--- qr_orders (${orders?.length || 0} db) ---`, JSON.stringify(orders, null, 2));

    // 5. Public Profiles / Users
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, full_name, role');
    if (pErr) console.error("Error fetching profiles:", pErr);
    else console.log(`\n--- profiles (${profiles?.length || 0} db) ---`, JSON.stringify(profiles, null, 2));
  }

  checkDb();

} catch (err) {
  console.error("Failed to read .env file:", err.message);
}
