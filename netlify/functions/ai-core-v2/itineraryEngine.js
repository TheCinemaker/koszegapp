/**
 * itineraryEngine.js – ai-core-v2
 * Time + mobility + location aware itinerary builder.
 * Reads from local JSON. No hallucination.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { rankByDistance } from './rankingEngine.js';

const dataPath = join(process.cwd(), 'public/data');

function load(file) {
    try { return JSON.parse(readFileSync(join(dataPath, file), 'utf8')); }
    catch { return []; }
}

/**
 * Builds a context-aware itinerary based on:
 * - user location (GPS)
 * - mobility (walking/bike/car)
 * - time of day
 * - requested intents (food, attractions, etc.)
 */
export function buildItinerary({ intents, context }) {
    const { location, mobility, isLunch, isEvening, hour, situation } = context;
    const plan = [];

    // 🔥 1. HA NEM VAGY KŐSZEGEN, NE CSINÁLJ SEMMIT!
    if (situation?.status === 'not_in_city') {
        return []; // Üres terv → majd a responseGenerator figyelmeztet
    }

    // 🔥 2. HASZNÁLJUK A VÁROSKÖZPONTOT, HA NINCS GPS
    const effectiveLocation = location || { lat: 47.3895, lng: 16.541 };

    const maxAttractions = mobility === 'walking' ? 2 : 3;

    // 🔥 3. ATTRACTIONS – CSAK HA KÉRTÉK
    if (intents.includes('attractions')) {
        const attractions = load('attractions.json');
        const ranked = rankByDistance(attractions, effectiveLocation);
        plan.push(...ranked.slice(0, maxAttractions).map(a => ({
            type: 'attraction',
            name: a.name,
            description: a.description,
            distanceKm: a._distanceKm,
            coords: a.coordinates
        })));
    }

    // 🔥 4. FOOD – SZŰRJÜNK KATEGÓRIA SZERINT IS!
    if (intents.includes('food') || isLunch || isEvening) {
        const restaurants = load('restaurants.json');

        // Ha pizzát keres, csak pizzériákat hozzon
        const query = context.query?.toLowerCase() || '';
        const wantsPizza = query.includes('pizza') || query.includes('pizzát');

        let filtered = restaurants;
        if (wantsPizza) {
            filtered = restaurants.filter(r =>
                r.tags?.includes('pizzéria') ||
                r.name?.toLowerCase().includes('pizza') ||
                r.type === 'pizzéria'
            );
        }

        // Ha nincs pizzéria, akkor jöhet bármi
        if (filtered.length === 0) {
            filtered = restaurants;
        }

        const ranked = rankByDistance(filtered, effectiveLocation);
        const top = ranked.slice(0, 2).map(r => ({
            type: 'food',
            name: r.name,
            address: r.address,
            distanceKm: r._distanceKm,
            coords: r.coords,
            tags: r.tags // segítség a response-nek
        }));
        plan.push(...top);
    }

    // 🔥 5. EVENTS – CSAK HA KÉRTÉK!
    if (intents.includes('events')) {
        const events = load('events.json');
        const upcoming = events
            .filter(e => new Date(e.date) >= new Date())
            .slice(0, 2)
            .map(e => ({ type: 'event', name: e.title || e.name, date: e.date }));
        plan.push(...upcoming);
    }

    return plan;
}
