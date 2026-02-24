/**
 * responseGenerator.js – ai-core-v2 (v5 final)
 *
 * - Deterministic structured responses for parking/consent flows
 * - Reads REAL data from local JSON files (no hallucination)
 * - LLM (Gemini) ONLY used for natural Hungarian language formatting
 * - GPS-aware: shows distances, prioritized near places
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { rankByDistance, filterNearby } from './rankingEngine.js';
import { buildItinerary } from './itineraryEngine.js';
import { applyPersonality } from './personalityLayer.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dir, '../../../public/data');

function load(file) {
    try { return JSON.parse(readFileSync(join(dataPath, file), 'utf8')); }
    catch { return []; }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PERSONA = `Te a KőszegAPP barátságos, rövid és szókimondó asszisztense vagy, név nélkül.
Magyar, tömör, természetes hangneme van. Tegező. Max 2-3 mondat.
Soha ne találj ki helyet vagy adatot ami nincs megadva neked!
Ha van távolság adat, mondd meg ("innen kb X km").`;

async function llm(prompt, fallback) {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: PERSONA,
            generationConfig: { temperature: 0.55, maxOutputTokens: 220 }
        });
        const res = await model.generateContent(prompt);
        return applyPersonality(res.response.text().trim());
    } catch (e) {
        console.warn('LLM format failed:', e.message);
        return fallback;
    }
}

export async function generateResponse({ replyType, state, context, query, intents }) {
    const { location, mobility, isLunch, isEvening } = context || {};

    switch (replyType) {

        // ── GREETING ──────────────────────────────────────────────────────
        case 'greeting': {
            const text = await llm(
                `A felhasználó köszönt: "${query}". Köszönj vissza természetesen, kérdezd meg miben segíthetsz Kőszegen.`,
                'Szia! Miben segíthetek Kőszegen? 😊'
            );
            return { text, action: null };
        }

        // ── PARKING FLOW (teljesen determinisztikus szövegek) ─────────────
        case 'ask_plate':
            return { text: 'Add meg a rendszámodat és elindítom a parkolást! 🚗', action: null };

        case 'ask_duration':
            return { text: `Rendben, ${state.tempData?.licensePlate} – hány órára parkoljak? (pl. "2 óra")`, action: null };

        case 'confirm_parking':
            return {
                text: `${state.tempData?.licensePlate} rendszámmal ${state.tempData?.duration} órára indítsam? Körülbelül fizetős zóna – mehet? ✅`,
                action: null
            };

        case 'ask_save_consent':
            return {
                text: `Parkolás kész! Elmenthetem a ${state.tempData?.licensePlate} rendszámot, hogy jövőre ne kelljen begépelni? 💾`,
                action: null
            };

        case 'parking_success':
            return {
                text: 'Megnyitom a parkolóoldalt – az SMS küldés gombra kell majd nyomni. Jó sétát Kőszegen! 🚗',
                action: null // injected by index.js from executeAction
            };

        case 'parking_cancelled':
            return { text: 'Töröltük a parkolást. Miben segíthetek még?', action: null };

        // ── FOOD SEARCH (JSON alapú, geo-rendezve) ────────────────────────
        case 'food_search': {
            const all = load('restaurants.json');
            const top = location
                ? filterNearby(all, location, 3, 4)
                : all.slice(0, 4);

            if (top.length === 0) {
                return { text: 'Éttermet nem találtam az adatbázisban. Megnyissam az étterem oldalt?', action: { type: 'navigate_to_food', params: {} } };
            }

            const list = top.map(r => {
                const dist = r._distanceKm != null && r._distanceKm < Infinity ? ` (${r._distanceKm} km)` : '';
                return `${r.name}${dist}`;
            }).join(', ');

            const timeNote = isLunch ? 'Ebédidő van!' : isEvening ? 'Vacsorára is gondoltam.' : '';
            const text = await llm(
                `${timeNote} Ajánlj ezek közül éttermet Kőszegen röviden: ${list}. Ne találj ki semmit.`,
                `Íme a legközelebbi helyek: ${list}.`
            );
            return { text, action: null };
        }

        // ── ATTRACTIONS (JSON alapú, geo-rendezve) ────────────────────────
        case 'attractions': {
            const all = load('attractions.json');
            const top = location
                ? filterNearby(all, location, 5, 4)
                : all.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4);

            const list = top.map(a => {
                const dist = a._distanceKm != null && a._distanceKm < Infinity ? ` (${a._distanceKm} km)` : '';
                return `${a.name}${dist}`;
            }).join(', ');

            const text = await llm(
                `Mutasd be röviden ezeket a kőszegi látnivalókat: ${list}. Max 2 mondat.`,
                `Kőszeg legjobb látnivalói a közelben: ${list}.`
            );
            return { text, action: null };
        }

        // ── ITINERARY (food + attractions együtt) ─────────────────────────
        case 'build_itinerary': {
            const plan = buildItinerary({ intents: intents || [], context });
            if (plan.length === 0) {
                return { text: 'Nem találtam programot a közelben. Próbáljuk meg pontosítani?', action: null };
            }
            const summary = plan.map(p => p.name).filter(Boolean).join(', ');
            const text = await llm(
                `Összeállítottam egy Kőszeg-programot: ${summary}. Mutatod be természetesen és röviden${mobility === 'walking' ? ' (gyalog van)' : ''}?`,
                `A közelben: ${summary}.`
            );
            return { text, action: null };
        }

        // ── EVENTS ────────────────────────────────────────────────────────
        case 'events': {
            const events = load('events.json');
            const upcoming = events
                .filter(e => new Date(e.date || e.start_date) >= new Date())
                .slice(0, 3)
                .map(e => e.title || e.name);

            if (upcoming.length === 0) {
                return { text: 'A közeljövőben nincs meghirdetett esemény az adatbázisban.', action: { type: 'navigate_to_events', params: {} } };
            }
            const text = await llm(
                `Kőszegi közelgő programok: ${upcoming.join(', ')}. Ajánld röviden.`,
                `Közelgő programok: ${upcoming.join(', ')}.`
            );
            return { text, action: { type: 'navigate_to_events', params: {} } };
        }

        // ── HOTELS ───────────────────────────────────────────────────────
        case 'hotels': {
            const all = load('hotels.json');
            const top = (location ? filterNearby(all, location, 5, 3) : all.slice(0, 3)).map(h => h.name);
            const text = top.length
                ? await llm(`Kőszegi szálláslehetőségek: ${top.join(', ')}. Ajánld röviden.`, `Szállások: ${top.join(', ')}.`)
                : 'Szállások listáját itt találod:';
            return { text, action: { type: 'navigate_to_hotels', params: {} } };
        }

        // ── NAVIGATION ───────────────────────────────────────────────────
        case 'offer_navigation':
            return {
                text: 'Látom a pozíciódat! Hova navigáljalak? Add meg a célpontot.',
                action: null
            };

        case 'ask_destination':
            return { text: 'Hova szeretnél menni? Add meg a célpontot és megnyitom a navigációt.', action: null };

        // ── EMERGENCY ────────────────────────────────────────────────────
        case 'emergency':
            return {
                text: '🆘 Azonnal hívom a segélyszolgálatot!',
                action: { type: 'call_emergency', params: {} }
            };

        // ── NORMAL (LLM fallback) ──────────────────────────────────────
        case 'normal':
        default: {
            const text = await llm(
                `Kőszegen vagyunk. A felhasználó kérdezte: "${query}". Válaszolj röviden és segítőkészen. Ha nem tudod, mondd: "Erről nincs pontos adatom."`,
                'Pontosítanád a kérdést? Szívesen segítek!'
            );
            return { text, action: null };
        }
    }
}
