import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testLog() {
    console.log("Testing Supabase Insert...");
    // Use a fixed test UUID that might exist or try null for anonymous if allowed
    const testUserId = "00000000-0000-0000-0000-000000000000";

    const { data, error } = await supabase
        .from('ai_logs')
        .insert({
            user_id: null, // Testing if anonymous logs are allowed or if NULL breaks RLS
            intent: "test",
            action: "test_action",
            context: { test: true },
            metadata: { query: "test query", response: "test response" }
        })
        .select();

    if (error) {
        console.error("Test Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("Test Succeeded:", data);
    }
}

testLog();
