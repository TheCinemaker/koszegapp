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

  async function checkTriggersAndLocks() {
    console.log("Querying database triggers on qr_orders...");
    
    // Check triggers
    const { data: triggers, error: tErr } = await supabase.rpc('get_triggers_info');
    if (tErr) {
      // If RPC doesn't exist, let's try running a custom SQL query via RPC if available,
      // or we can run select on pg_trigger using a raw SQL block if we can.
      // Wait, there is no generic sql executor RPC unless we created one.
      // Let's see if we can check it using a known RPC, or if there is another way.
      console.warn("RPC 'get_triggers_info' not found, trying generic query if possible. Error:", tErr.message);
    } else {
      console.log("Triggers:", JSON.stringify(triggers, null, 2));
    }

    // Let's query pg_stat_activity to see if there are locks
    console.log("\nChecking for database locks...");
    // Let's run a query to check if there are active locks.
    // Wait, let's see if we can use a direct table query if there is any custom view or function.
  }

  checkTriggersAndLocks();

} catch (err) {
  console.error("Error:", err.message);
}
