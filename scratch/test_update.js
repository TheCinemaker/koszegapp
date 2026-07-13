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

  async function runUpdate() {
    console.log("Testing update on qr_orders table...");
    const orderId = '837b2581-4d4a-48c4-b7cc-9af535e73d12';
    
    // Read the current state first
    const { data: order, error: readErr } = await supabase
      .from('qr_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (readErr) {
      console.error("Read error:", readErr);
      process.exit(1);
    }

    console.log("Current order items:", JSON.stringify(order.items, null, 2));

    // Modify the items: mark Coca Cola as served
    const updatedItems = order.items.map(item => {
      if (item.name === 'Coca Cola') {
        return { ...item, served: !item.served }; // toggle served status
      }
      return item;
    });

    console.log("Sending update...");
    const startTime = Date.now();
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('qr_orders')
      .update({ items: updatedItems })
      .eq('id', orderId)
      .select()
      .single();

    const duration = Date.now() - startTime;
    console.log(`Update call finished in ${duration}ms`);

    if (updateErr) {
      console.error("Update error:", updateErr);
    } else {
      console.log("Updated order items:", JSON.stringify(updatedOrder.items, null, 2));
    }
  }

  runUpdate();

} catch (err) {
  console.error("Error:", err.message);
}
