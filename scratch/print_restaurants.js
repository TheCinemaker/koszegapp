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

  async function printRestaurants() {
    console.log("=== ALL QR RESTAURANTS ===");
    const { data: restaurants, error: err } = await supabase
      .from('qr_restaurants')
      .select('*');

    if (err) console.error(err);
    else console.log(JSON.stringify(restaurants, null, 2));
  }

  printRestaurants();

} catch (err) {
  console.error("Error:", err.message);
}
