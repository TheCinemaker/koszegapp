/**
 * itineraryEngine.js – ai-core-v2
 * Time + mobility + location aware itinerary builder.
 * Reads from local JSON. No hallucination.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { rankByDistance } from './rankingEngine.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dir, '../../../public/data');

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
    const { location, mobility, isLunch, isEvening, hour } = context;

    const plan = [];
    const maxAttractions = mobility === 'walking' ? 2 : 3;

    // Attractions
    if (intents.includes('attractions')) {
        const attractions = load('attractions.json');
        const ranked = rankByDistance(attractions, location);
        plan.push(...ranked.slice(0, maxAttractions).map(a => ({
            type: 'attraction',
            name: a.name,
            description: a.description,
            distanceKm: a._distanceKm,
            coords: a.coordinates
        })));
    }

    // Food – only suggest if lunch/evening time or explicitly requested
    if (intents.includes('food') || isLunch || isEvening) {
        const restaurants = load('restaurants.json');
        const ranked = rankByDistance(restaurants, location);
        const top = ranked.slice(0, 2).map(r => ({
            type: 'food',
            name: r.name,
            address: r.address,
            distanceKm: r._distanceKm,
            coords: r.coords
        }));
        plan.push(...top);
    }

    // Events – always check
    if (intents.includes('events') || plan.length < 2) {
        const events = load('events.json');
        const upcoming = events
            .filter(e => new Date(e.date) >= new Date())
            .slice(0, 2)
            .map(e => ({ type: 'event', name: e.title || e.name, date: e.date }));
        plan.push(...upcoming);
    }

    return plan;
}
