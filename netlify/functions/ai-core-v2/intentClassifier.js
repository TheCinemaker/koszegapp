/**
 * intentClassifier.js – ai-core-v2 (multi-intent)
 * Returns an ARRAY of intents - a single message can contain multiple.
 * Loads synonyms.json at startup for dynamic AI-learned patterns.
 * No license plate detection here (→ entityExtractor).
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Load synonyms once at cold start (updated automatically by suggest-corrections)
let SYNONYMS = {};
try {
    SYNONYMS = JSON.parse(readFileSync(join(process.cwd(), 'public/data/synonyms.json'), 'utf8'));
} catch {
    // Synonyms file missing or invalid → silently use empty
}

function checkSynonyms(q) {
    for (const [intent, phrases] of Object.entries(SYNONYMS)) {
        if (Array.isArray(phrases) && phrases.some(p => q.includes(p.toLowerCase()))) {
            return intent;
        }
    }
    return null;
}

export function detectIntent(query) {
    const q = query.toLowerCase();
    const intents = [];

    if (/szia|hello|hali|jó napot|üdv|hey|hi|szevasz|cső/.test(q)) intents.push('smalltalk');

    // Parking INFO (questions about cost/rules) vs COMMAND (buy/start)
    if (/mennyibe kerül.*parkol|ingyenes.*parkol|fizetős.*parkol|kell.*parkolójegy|kell.*parkolni|parkolás ingyen|parkolás.*ár|parkolás.*díj|parkolás.*infó/.test(q)) {
        intents.push('parking_info');
    } else if (/vegyél.*parkoló|indíts.*parkolást|parkol|parkolás|parkolnék|parkolhatok|parkolójegy/.test(q)) {
        intents.push('parking');
    }

    // Food: café, coffee, 'innék', 'ennék', 'kóstolnék', reggeli
    if (/pizza|étterem|enni|kávé|kávézó|fagylalt|fagyi|fagyiz|cukrászda|büfé|kaja|hamburger|burger|kebab|kebap|lángos|bor|fröccs|innék|ennék|reggeli|kóstolnék/.test(q)) intents.push('food');

    // Attractions: 'megnéznék', 'felfedez', 'történelem', 'ostrom'
    if (/vár|látnivaló|múzeum|séta|néznék|megnéznék|kirándulás|látnék|felfedez|történelem|ostrom|emlékmű/.test(q)) intents.push('attractions', 'history');

    if (/merre|hol van|hogyan jutok|vezess|térkép|útvonal|mennyi idő/.test(q)) intents.push('navigation');
    if (/patika|orvos|mentő|rendőr|baleset|rosszul|segítség|ügyelet/.test(q)) {
        intents.push('emergency');
        intents.push('practical');
    }
    if (/szállás|hotel|panzió|ágy|éjszaka|camping|apartman/.test(q)) intents.push('hotels');
    if (/program|esemény|fesztivál|koncert|előadás|ma este|hétvégén/.test(q)) intents.push('events');

    // New Tourist Intents
    if (/túra|túrázni|írottkő|kilátó|tanösvény|bicikli|bringa|kerékpár/.test(q)) intents.push('tours');
    if (/ajándék|szuvenír|vásárlás|bolt|piac|kézműves|helyi termék|borbolt|abc|nyitva/.test(q)) intents.push('shopping');
    if (/wc|mosdó|atm|bankautomata|pénz|posta|wifi|töltés|információs iroda|tourinform|csomagmegőrző/.test(q)) intents.push('practical');
    if (/játszótér|gyerek|család|babakocsi|állatsimogató|kisgyerek/.test(q)) intents.push('families');
    if (/akadálymentes|mozgáskorlátozott|kutya|kutyabarát|gluténmentes|laktózmentes/.test(q)) intents.push('accessibility');

    // 🧠 Synonym check: AI-learned patterns from unknown_phrases
    if (intents.length === 0) {
        const learned = checkSynonyms(q);
        if (learned) intents.push(learned);
    }

    if (intents.length === 0) intents.push('unknown');

    return intents;
}
