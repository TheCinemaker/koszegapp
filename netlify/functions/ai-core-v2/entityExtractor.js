/**
 * entityExtractor.js – KőszegAI v2
 * Szótár alapú entitás kinyerés + helyek, időpontok, speciális igények
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Szótár betöltése
let synonyms = {};
let attractions = [];
let restaurants = [];

try {
    const dataPath = join(process.cwd(), 'public/data');

    synonyms = JSON.parse(readFileSync(join(dataPath, 'synonyms.json'), 'utf8'));
    attractions = JSON.parse(readFileSync(join(dataPath, 'attractions.json'), 'utf8'));
    restaurants = JSON.parse(readFileSync(join(dataPath, 'restaurants.json'), 'utf8'));
} catch (err) {
    console.warn('entityExtractor: valamelyik JSON hiányzik vagy hibás', err.message);
}

function matchInSynonyms(query, category) {
    const q = query.toLowerCase();
    const cat = synonyms.categories?.[category] || synonyms[category];
    if (!cat) return false;

    // Végignézünk minden alkategóriát (basic, slang, phrases)
    for (const subcat of Object.values(cat)) {
        if (Array.isArray(subcat)) {
            for (const pattern of subcat) {
                if (q.includes(pattern.toLowerCase())) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function extractEntities(query, context = {}) {
    const entities = {};
    const q = query.toLowerCase();

    // ── 1. KI? ─────────────────────────────────────────────
    if (matchInSynonyms(q, 'wife')) {
        entities.subject = 'wife';
        entities.subjectConfidence = 0.9;
    } else if (matchInSynonyms(q, 'husband')) {
        entities.subject = 'husband';
        entities.subjectConfidence = 0.9;
    } else if (matchInSynonyms(q, 'child')) {
        entities.subject = 'child';
        entities.subjectConfidence = 0.8;
    } else if (matchInSynonyms(q, 'friend')) {
        entities.subject = 'friend';
        entities.subjectConfidence = 0.7;
    } else {
        entities.subject = 'user';
        entities.subjectConfidence = 0.5;
    }

    // ── 2. HOL VAN? ────────────────────────────────────────
    if (matchInSynonyms(q, 'already_there')) {
        entities.presence = 'already_there';
        entities.presenceConfidence = 0.9;
    } else if (matchInSynonyms(q, 'on_the_way')) {
        entities.presence = 'on_the_way';
        entities.presenceConfidence = 0.8;
    }

    // ── 3. MIKOR? ──────────────────────────────────────────
    if (matchInSynonyms(q, 'now')) {
        entities.timing = 'now';
        entities.timingConfidence = 0.9;
    }

    // ── 4. KONKRÉT HELYEK (attractions) ────────────────────
    for (const place of attractions) {
        if (q.includes(place.name.toLowerCase())) {
            entities.place = {
                id: place.id,
                name: place.name,
                type: 'attraction',
                coords: place.coordinates || place.coords
            };
            entities.placeConfidence = 0.95;
            break;
        }
    }

    // ── 5. KONKRÉT HELYEK (restaurants) ────────────────────
    if (!entities.place) {
        for (const place of restaurants) {
            if (q.includes(place.name.toLowerCase())) {
                entities.place = {
                    id: place.id,
                    name: place.name,
                    type: 'restaurant',
                    coords: place.coords
                };
                entities.placeConfidence = 0.95;
                break;
            }
        }
    }

    // ── 6. IDŐPONTOK ───────────────────────────────────────
    const timeMatch = q.match(/(\d{1,2})[.:](\d{2})\s*(óra|kor)?/);
    if (timeMatch) {
        entities.time = `${timeMatch[1]}:${timeMatch[2]}`;
    }

    // "ma", "holnap", "hétvégén"
    if (q.includes('ma')) entities.date = 'today';
    if (q.includes('holnap')) entities.date = 'tomorrow';
    if (q.includes('hétvégén')) entities.date = 'weekend';

    // ── 7. TÁVOLSÁG / HELYSZÍN ─────────────────────────────
    if (q.includes('főtér') || q.includes('fő téren')) {
        entities.location = 'main_square';
    }
    if (q.includes('közel') || q.includes('közelben')) {
        entities.proximity = 'nearby';
    }

    // ── 8. SPECIÁLIS IGÉNYEK ───────────────────────────────
    if (/(gyerek|család|kicsik)/.test(q)) entities.withKids = true;
    if (/(kutya|eb|dog)/.test(q)) entities.withDog = true;
    if (/(gluténmentes|gluten-free)/.test(q)) entities.dietary = 'gluten-free';
    if (/(laktózmentes|lactose-free)/.test(q)) entities.dietary = 'lactose-free';

    // ── 9. RENDSZÁM ────────────────────────────────────────
    const normalized = q.replace(/[\s\-]/g, '');
    const plateMatch = normalized.match(/[a-zA-Z]{2,4}\d{3}/i);
    if (plateMatch) {
        entities.licensePlate = plateMatch[0].toUpperCase();
    }

    // ── 10. IDŐTARTAM ──────────────────────────────────────
    const durationMatch = q.match(/(\d+)\s*(óra|h\b)/i);
    if (durationMatch) {
        entities.duration = parseInt(durationMatch[1], 10);
    }

    return entities;
}
