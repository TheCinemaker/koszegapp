/**
 * entityExtractor.js – KőszegAI v2
 * Szótár alapú entitás kinyerés
 */
import { readFileSync } from 'fs';
import { join } from 'path';

// Szótár betöltése
let synonyms = {};
try {
    const synonymsPath = join(process.cwd(), 'public/data/synonyms.json');
    synonyms = JSON.parse(readFileSync(synonymsPath, 'utf8'));
} catch (err) {
    console.warn('entityExtractor: synonyms.json not found or invalid');
}

function matchInSynonyms(query, category) {
    const q = query.toLowerCase();
    const cat = synonyms[category];
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

    // 1. Ki?
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

    // 2. Hol van?
    if (matchInSynonyms(q, 'already_there')) {
        entities.presence = 'already_there';
        entities.presenceConfidence = 0.9;
    } else if (matchInSynonyms(q, 'on_the_way')) {
        entities.presence = 'on_the_way';
        entities.presenceConfidence = 0.8;
    }

    // 3. Mikor?
    if (matchInSynonyms(q, 'now')) {
        entities.timing = 'now';
        entities.timingConfidence = 0.9;
    }

    // 4. Rendszám (meglévő)
    const normalized = q.replace(/[\s\-]/g, '');
    const plateMatch = normalized.match(/[a-zA-Z]{2,4}\d{3}/i);
    if (plateMatch) {
        entities.licensePlate = plateMatch[0].toUpperCase();
    }

    // 5. Időtartam (meglévő)
    const durationMatch = q.match(/(\d+)\s*(óra|h\b)/i);
    if (durationMatch) {
        entities.duration = parseInt(durationMatch[1], 10);
    }

    return entities;
}
