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

  async function printAllItems() {
    console.log("=== ALL QR MENU ITEMS ===");
    const { data: items, error: itemErr } = await supabase
      .from('qr_menu_items')
      .select('*');

    if (itemErr) console.error(itemErr);
    else console.log(JSON.stringify(items, null, 2));
  }

  printAllItems();

} catch (err) {
  console.error("Error:", err.message);
}
