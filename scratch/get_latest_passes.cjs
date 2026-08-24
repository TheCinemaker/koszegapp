const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '..', '.env');
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
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function run() {
    console.log("Fetching latest KőszegPass registrations...");
    const { data, error } = await supabase
      .from('koszeg_passes')
      .select('id, holder_name, pass_type, status, purchased_at')
      .order('purchased_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
  }

  run();

} catch (err) {
  console.error("Error:", err.message);
}
