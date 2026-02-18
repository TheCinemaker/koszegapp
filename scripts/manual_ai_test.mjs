import fs from 'fs';
import path from 'path';

console.log("🚀 Initializing AI Test Environment...");

// 1. Helper to load .env manually
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let val = parts.slice(1).join('=').trim();
                    // Remove optional quotes
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
            console.log("✅ .env loaded manually (preserving existing env vars).");
        }
    } catch (e) {
        console.error("⚠️ Error loading .env:", e.message);
    }
}

loadEnv();

// 2. Override BASE_URL to production
process.env.URL = process.env.URL || 'https://koszegapp.hu';

if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is missing from .env and process.env!");
} else {
    // Mask key for log
    console.log(`🔑 GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY.substring(0, 5)}...`);
}

// 3. Dynamic Import of Handler AFTER env is set
const { handler } = await import('../netlify/functions/ai-assistant.js');

const query = process.argv[2] || "Milyen programok vannak ma?";

console.log(`\n🤖 AI Teszt indítása: "${query}"`);
console.log("------------------------------------------------");

const TEST_QUERY = "éttermek";
const TEST_CONTEXT = {
    mode: "city",
    location: { lat: 47.388, lng: 16.541 },
    distanceToMainSquare: 100
};

const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        query: TEST_QUERY,
        conversationHistory: [],
        context: TEST_CONTEXT
    })
};

const start = Date.now();
try {
    const response = await handler(mockEvent);
    const result = JSON.parse(response.body);

    console.log(`\n⏱️  Generálás ideje: ${((Date.now() - start) / 1000).toFixed(2)}s`);
    console.log("------------------------------------------------");

    if (result.debug && typeof result.debug === 'string') {
        console.error("❌ DEBUG INFO:", result.debug);
    }

    if (result.role === 'assistant') {
        console.log("✅ VÁLASZ:");
        console.log(result.content);
        console.log("\n------------------------------------------------");
        if (result.action) {
            console.log("🔧 ACTION:", JSON.stringify(result.action, null, 2));
        }
        if (result.debug) {
            console.log("🔍 KONFIDENCIA:", result.debug.confidence);
            if (result.debug.intent) console.log("🎯 INTENT:", result.debug.intent);
        }
    } else {
        console.log("⚠️ UNEXPECTED RESPONSE:", result);
    }

} catch (e) {
    console.error("CRITICAL TEST ERROR:", e);
}
console.log("\n");
