
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvents() {
    const { data, error } = await supabase.from('ticket_events').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkEvents();
