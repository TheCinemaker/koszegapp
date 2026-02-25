/**
 * intentClassifier.js – ai-core-v2 (multi-intent)
 * Returns an ARRAY of intents - a single message can contain multiple.
 * Loads synonyms.json at startup – this is the ONLY source of truth.
 * No license plate detection here (→ entityExtractor).
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Load synonyms once at cold start (updated automatically by suggest-corrections)
let SYNONYMS = { categories: {} };
try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'public/data/synonyms.json'), 'utf8'));
    SYNONYMS = raw.categories ? raw : { categories: raw };
} catch {
    console.warn('⚠️ synonyms.json missing or invalid – using empty dictionary');
}

/**
 * Szó normalizálása: kisbetű, írásjelek eltávolítása, alapvető ragozás kezelése.
 */
function normalize(word) {
    if (!word) return "";
    return word.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
        .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u');
}

/**
 * Szinonimaszótár keresés – ez az EGYETLEN forrás!
 */
function findIntentsFromSynonyms(query) {
    const qNormalized = normalize(query);
    const intents = [];

    for (const [category, subcategories] of Object.entries(SYNONYMS.categories)) {
        const allWords = [];
        if (typeof subcategories === 'object') {
            Object.values(subcategories).forEach(words => {
                if (Array.isArray(words)) allWords.push(...words);
            });
        }

        // Egyezés keresése: normalized query vs normalized synonym
        if (allWords.some(word => {
            const wNorm = normalize(word);
            return qNormalized.includes(wNorm) || wNorm.includes(qNormalized);
        })) {
            intents.push(category);
        }
    }

    return intents;
}

/**
 * Emergency detektálás – kivétel, mert ez mindent felülír
 */
function isEmergency(q) {
    const emergencyWords = [
        'orvos', 'mentő', 'rendőr', 'baleset',
        'rosszul', 'segítség', 'ügyelet', 'mentők', 'kórház'
    ];
    return emergencyWords.some(word => q.includes(word));
}

export function detectIntent(query) {
    const q = query.toLowerCase();

    // 🔥 1. Emergency ellenőrzés – ez mindent felülír!
    if (isEmergency(q)) {
        return ['emergency'];
    }

    // 🔥 2. Minden más a szinonimaszótárból!
    let intents = findIntentsFromSynonyms(q);

    // 3. Ha nincs intent, akkor unknown
    if (intents.length === 0) {
        // Lehet, hogy csak köszönés?
        const greetingWords = ['szia', 'hello', 'hali', 'jó napot', 'üdv', 'hey', 'hi', 'szevasz', 'cső', 'helló'];
        if (greetingWords.some(word => q.includes(word))) {
            intents.push('smalltalk');
        } else {
            intents.push('unknown');
        }
    }

    return intents;
}
