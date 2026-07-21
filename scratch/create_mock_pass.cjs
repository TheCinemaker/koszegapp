const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    console.log("Creating a permanent mock pass for layout testing...");
    
    // Check if mock pass already exists
    const { data: existing } = await supabase
      .from('koszeg_passes')
      .select('id')
      .eq('holder_name', 'MINTA JÁNOS (TESZT)')
      .maybeSingle();

    if (existing) {
      console.log(`Mock pass already exists! ID: ${existing.id}`);
      console.log(`Use URL: /.netlify/functions/koszeg-pass-apple?passId=${existing.id}`);
      process.exit(0);
    }

    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: newPass, error } = await supabase
      .from('koszeg_passes')
      .insert({
        holder_name: 'MINTA JÁNOS (TESZT)',
        holder_email: 'teszt@visitkoszeg.hu',
        pass_type: 'individual',
        stripe_session_id: 'mock_session_' + crypto.randomBytes(4).toString('hex'),
        amount_paid: 400000,
        status: 'active',
        qr_token: crypto.randomUUID(),
        slug: 'minta.janos.teszt',
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        billing_zip: '9730',
        billing_city: 'Kőszeg',
        billing_address: 'Fő tér 1.'
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      process.exit(1);
    }

    console.log(`✅ Mock pass created successfully! ID: ${newPass.id}`);
    console.log(`Direct download link:`);
    console.log(`https://visitpointer-dev--koszegapp.netlify.app/.netlify/functions/koszeg-pass-apple?passId=${newPass.id}`);
  }

  run();

} catch (err) {
  console.error("Error:", err.message);
}
