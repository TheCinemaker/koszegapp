/**
 * suggest-corrections.js – Admin-only Netlify function
 * Run manually or schedule weekly via Netlify scheduled functions.
 *
 * POST /.netlify/functions/suggest-corrections
 * Headers: x-admin-secret: <ADMIN_SECRET env var>
 *
 * What it does:
 * 1. Fetches top N unreviewed unknown phrases from Supabase
 * 2. For each: asks LLM what the user probably meant
 * 3. Saves suggested corrected_intent back to Supabase for human review
 * 4. autoUpdateSynonyms(): phrases >= THRESHOLD with corrected_intent → synonyms.json update
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const THRESHOLD = 10;
const SYNONYMS_PATH = join(process.cwd(), 'netlify/functions/ai-core-v2/synonyms.json');

function supabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

async function llmSuggest(query) {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return null;

    const prompt = `A felhasználó ezt írta egy Kőszeg városában működő magyar turisztikai AI chatbot-nak: "${query}"
    
Mit akarhat? Válassz PONTOSAN EGYET az alábbiak közül, és CSAK a kategória nevét add vissza:
- parking (parkolni akar)
- parking_info (parkolásról érdeklődik)
- food (enni/inni akar)
- attractions (látni akar valamit)
- navigation (útvonalat keres)
- hotels (szállást keres)
- events (programot keres)
- planning (tervezi a látogatását)
- smalltalk (csak cseveg)
- emergency (segítségre van szüksége)
- unknown (nem kapcsolódik Kőszeghez)

Csak a kategória nevét írd!`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
        const valid = ['parking', 'parking_info', 'food', 'attractions', 'navigation', 'hotels', 'events', 'planning', 'smalltalk', 'emergency', 'unknown'];
        return valid.includes(raw) ? raw : null;
    } catch { return null; }
}

async function autoUpdateSynonyms(db) {
    const { data } = await db
        .from('unknown_phrases')
        .select('query, corrected_intent')
        .gte('frequency', THRESHOLD)
        .not('corrected_intent', 'is', null)
        .eq('reviewed', false);

    if (!data?.length) return 0;

    let synonyms = {};
    try { synonyms = JSON.parse(readFileSync(SYNONYMS_PATH, 'utf8')); }
    catch { synonyms = {}; }

    let updated = 0;
    for (const item of data) {
        const intent = item.corrected_intent;
        if (!synonyms[intent]) synonyms[intent] = [];
        if (!synonyms[intent].includes(item.query)) {
            synonyms[intent].push(item.query);
            updated++;
        }
        await db.from('unknown_phrases').update({ reviewed: true }).eq('query', item.query);
    }

    if (updated > 0) {
        writeFileSync(SYNONYMS_PATH, JSON.stringify(synonyms, null, 2));
    }
    return updated;
}

export default async function handler(req) {
    // Admin auth
    const secret = req.headers.get('x-admin-secret');
    if (secret !== process.env.ADMIN_SECRET) {
        return new Response('Unauthorized', { status: 401 });
    }

    const db = supabase();
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '30');

    // 1. Fetch top unknowns without correction yet
    const { data: phrases, error } = await db
        .from('unknown_phrases')
        .select('query, frequency')
        .is('corrected_intent', null)
        .order('frequency', { ascending: false })
        .limit(limit);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    // 2. LLM suggest + save
    const results = [];
    for (const item of phrases || []) {
        const intent = await llmSuggest(item.query);
        if (intent && intent !== 'unknown') {
            await db.from('unknown_phrases')
                .update({ corrected_intent: intent })
                .eq('query', item.query);
        }
        results.push({ query: item.query, frequency: item.frequency, suggested: intent });
    }

    // 3. Auto-update synonyms for phrases over threshold
    const synonymsUpdated = await autoUpdateSynonyms(db);

    return new Response(JSON.stringify({ processed: results.length, synonymsUpdated, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export const config = { path: '/api/admin/suggest-corrections' };
