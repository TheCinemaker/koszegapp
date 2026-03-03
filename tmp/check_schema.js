
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching tickets:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in tickets table:', Object.keys(data[0]));
    } else {
        console.log('No data in tickets table to infer columns.');
        // Try to insert a dummy row with extra columns to see if it fails
        const { error: insertError } = await supabase
            .from('tickets')
            .insert({ buyer_phone: 'test' })
            .select();

        if (insertError) {
            console.log('Column buyer_phone likely does not exist:', insertError.message);
        } else {
            console.log('Column buyer_phone exists!');
        }
    }
}

checkSchema();
