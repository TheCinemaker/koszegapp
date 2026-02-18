// Shared configuration and environment validation
export const CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    BASE_URL: process.env.URL || 'https://koszegapp.hu',
    IS_DEV: process.env.NODE_ENV === 'development',
};

// Validate critical env vars
if (!CONFIG.GEMINI_API_KEY) console.error('CRITICAL: GEMINI_API_KEY is missing!');
if (!CONFIG.SUPABASE_URL) console.error('CRITICAL: VITE_SUPABASE_URL is missing!');
if (!CONFIG.SUPABASE_ANON_KEY) console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is missing!');
