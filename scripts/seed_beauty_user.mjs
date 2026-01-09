
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Load Env Config manually since we are in node
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    console.log('Creating Provider User: TheCinemaker...');

    const email = 'thecinemaker.koszeg@gmail.com';
    const password = 'Nyanyuska_0169';
    const fullName = 'TheCinemaker';
    const nickname = 'Baba';

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName } // Metadata
        }
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        // If user already exists, try to login to get ID
        if (authError.message.includes('already registered')) {
            console.log('User already exists, logging in...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;
            authData.user = loginData.user;
        } else {
            return;
        }
    }

    const userId = authData.user.id;
    console.log('User ID:', userId);

    // 2. Update Profile (Role & Nickname)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'provider',
            nickname: nickname
        })
        .eq('id', userId);

    if (profileError) console.error('Profile Update Error:', profileError);
    else console.log('Profile updated to Provider.');

    // 3. Create Provider Entry
    // Check if provider entry already exists
    const { data: existingProvider } = await supabase.from('providers').select('*').eq('user_id', userId).single();

    if (!existingProvider) {
        const { error: providerError } = await supabase
            .from('providers')
            .insert({
                user_id: userId,
                business_name: 'TheCinemaker Stúdió',
                category: 'Szépségápolás',
                description: 'A város legexkluzívabb szalonja.',
                location_address: 'Kőszeg, Fő tér 1.',
                image_url: 'https://images.unsplash.com/photo-1560066984-12186d30b73c?q=80&w=2574&auto=format&fit=crop'
            });

        if (providerError) console.error('Provider Creation Error:', providerError);
        else console.log('Provider "TheCinemaker Stúdió" created.');
    } else {
        console.log('Provider entry already exists.');
    }

    console.log('✅ SEED COMPLETED.');
    console.log(`Login Email: ${email}`);
    console.log(`Password: ${password}`);
}

seedUser();
