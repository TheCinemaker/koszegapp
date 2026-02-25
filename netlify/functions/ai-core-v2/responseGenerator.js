/**
 * responseGenerator.js – ai-core-v2 (v6 final)
 *
 * - Deterministic structured responses for parking/consent/arrival flows
 * - Reads REAL data from local JSON files (no hallucination)
 * - LLM ONLY used for natural Hungarian language formatting
 * - GPS-aware, weather-aware, profile-aware (via rankingEngineV2)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { filterNearby } from './rankingEngine.js';
import { rankPlaces } from './rankingEngineV2.js';
import { buildItinerary } from './itineraryEngine.js';
import { applyPersonality } from './personalityLayer.js';
import { buildArrivalMessage } from './situationAnalyzer.js';
import { getForecastForTime, parseArrivalTime } from './forecastService.js';

// process.cwd() = /var/task on Netlify, project root locally
// Works in both ESM and CJS bundled mode (no import.meta.url)
const dataPath = join(process.cwd(), 'public/data');

function load(file) {
    try { return JSON.parse(readFileSync(join(dataPath, file), 'utf8')); }
    catch { return []; }
}

// Deferred – instantiated at call time, not module load, to avoid init crashes
function getGenAI() {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
}

const PERSONA = `Te a KőszegAPP barátságos, rövid és szókimondó asszisztense vagy, név nélkül.
Magyar, tömör, természetes hangnemet használsz. Tegező. Max 2-3 mondat.
Soha ne találj ki helyet vagy adatot ami nincs megadva neked!
Ha van távolság adat, mondd meg ("innen kb X km").`;


async function llm(prompt, fallback) {
    try {
        const model = getGenAI().getGenerativeModel({
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

export async function generateResponse({ replyType, query, state, context, profile, weather, intents }) {
    const { location, mobility, isLunch, isEvening } = context || {};
    const speed = context?.speed ?? null;

    // Segédfüggvény változatos válaszokhoz
    function randomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }

    switch (replyType) {

        // ── GREETING ──────────────────────────────────────────────────────
        case 'greeting': {
            const text = await llm(
                `A felhasználó köszönt: "${query}". Köszönj vissza természetesen, kérdezd meg miben segíthetsz Kőszegen.`,
                'Szia! Miben segíthetek Kőszegen? 😊'
            );
            return { text, action: null };
        }

        // ── PARKING (teljesen determinisztikus) ───────────────────────────
        case 'ask_plate':
            return {
                text: randomMessage([
                    'Add meg a rendszámodat és elindítom a parkolást! 🚗',
                    'Kérem a rendszámot, és mehet az SMS parkolás!',
                    'Rendszámot kérek szépen, és csináljuk!'
                ]), action: null
            };

        case 'ask_duration':
            return {
                text: randomMessage([
                    `Rendben, ${state.tempData?.licensePlate || 'ezzel a rendszámmal'} – hány órára parkoljak? (pl. "2 óra")`,
                    `Oké, ${state.tempData?.licensePlate} – mennyi időre szóljon a jegy?`,
                    `Már csak az időtartam kell! Hány órára?`
                ]), action: null
            };

        case 'confirm_parking':
            return {
                text: randomMessage([
                    `${state.tempData?.licensePlate} rendszámmal ${state.tempData?.duration} órára indítsam? Mehet? ✅`,
                    `Akkor ${state.tempData?.licensePlate}, ${state.tempData?.duration} óra. Így jó lesz?`,
                    `Megerősíted? ${state.tempData?.licensePlate} – ${state.tempData?.duration} óra.`
                ]), action: null
            };

        case 'ask_save_consent':
            return {
                text: randomMessage([
                    `Parkolás kész! Elmenthetem a ${state.tempData?.licensePlate} rendszámot jövőre? 💾`,
                    `El is menthetném a ${state.tempData?.licensePlate} rendszámot, hogy legközelebb gyorsabb legyen. Megtehetem?`,
                    `Érdemes elmenteni a ${state.tempData?.licensePlate} rendszámot? Ha igen, legközelebb gyorsabb lesz!`
                ]), action: null
            };

        case 'parking_success':
            return {
                text: randomMessage([
                    'Megnyitom a parkolóoldalt – az SMS gombra kell nyomni. Jó sétát Kőszegen! 🚗',
                    'Kész! Az SMS gombra nyomj, és indulhat a parkolás. Jó szórakozást!',
                    'Minden oké, mehet a parkolás! Az SMS gombot keresd. Ha gond van, szólj!'
                ]), action: null
            };

        case 'parking_cancelled':
            return {
                text: randomMessage([
                    'Töröltük a parkolást. Miben segíthetek még?',
                    'Oké, töröltük. Ha mégis kell, szólj!',
                    'Rendben, nincs parkolás. Miben segíthetek?'
                ]), action: null
            };

        case 'parking_offer_declined':
            return {
                text: randomMessage([
                    'Rendben, ha mégis kell, szólj! 😊',
                    'Oké, akkor majd ha kell, jelezz!',
                    'Semmi gond, itt vagyok ha kellek!',
                    'Rendicsek! Mással tudok segíteni?'
                ]), action: null
            };

        case 'parking_offer_clarify':
            return {
                text: randomMessage([
                    'Bocsi, nem értettem pontosan. Indítsam a parkolást? (igen/nem)',
                    'Elnezést, zavar van a levegőben... Indíthatom?',
                    'Nem egészen világos. Akkor csináljuk vagy ne?'
                ]), action: null
            };

        case 'continue_current_flow':
            return {
                text: randomMessage([
                    'Még nem fejeztük be az előzőt. Hogyan tovább?',
                    'Előbb ezt zárjuk le: hogyan tovább?',
                    'Hol is tartottunk? Segíts, kérlek!'
                ]), action: null
            };

        // Valós kőszegi árak: I. zóna (piros): 440 Ft/h, II. zóna (zöld): 320 Ft/h
        // Díjköteles: H-P 8:00–17:00 | Szombat-vasárnap INGYENES!
        case 'parking_info':
            return {
                text: randomMessage([
                    'Kőszegen két zóna van: Piros (belváros): 440 Ft/óra, Zöld (külső): 320 Ft/óra. SMS-sel is megy. Szólj ha indítsam!',
                    'Díjfizetés H-P 8:00–17:00 között: Piros zóna 440 Ft/h, Zöld zóna 320 Ft/h. Szombaton-vasárnap ingyenes! 🎉',
                    'Parkolás? Piros zóna 440 Ft/h, Zöld 320 Ft/h, de szombat-vasárnap mindenhol ingyenes! SMS-el is fizethetsz.'
                ]), action: null
            };

        case 'parking_info_not_in_city':
            return {
                text: randomMessage([
                    'Kőszegen van fizetős parkolás: Piros zóna 440 Ft/h, Zöld zóna 320 Ft/h. Szombaton-vasárnap ingyenes! Amikor megérkezel, szólj és elindítom.',
                    'Még nem vagy itt, de ha odaértél, szólj! Piros 440 Ft/h, Zöld 320 Ft/h, H-P 8–17 közt. 🚗',
                    'Addig is: Piros zóna 440 Ft/h, Zöld 320 Ft/h, szombaton-vasárnap ingyenes. Ha itt vagy, csináljuk!'
                ]), action: null
            };

        case 'parking_info_user_there':
            return {
                text: randomMessage([
                    'Ha már itt vagy, akkor nyugodtan indíthatjuk! Add meg a rendszámot és csináljuk. 💪',
                    'Király, akkor most itt vagy! Add a rendszámot és mehet az SMS parkolás.',
                    'Szuper, akkor már parkolhatsz is! Kérem a rendszámot, és indulhat.',
                    'Akkor gyerünk! Milyen rendszámra szóljon a parkolás?'
                ]), action: null
            };

        case 'parking_info_wife_there':
            return {
                text: randomMessage([
                    'Ha a feleséged már ott van Kőszegen, akkor neki indulhat a parkolás! Add meg a rendszámát. 💪',
                    'Akkor a feleséged már ott van! Neki vegyek parkolójegyet? Add meg a rendszámát!',
                    'De jó, a feleséged már Kőszegen van! Ő nyugodtan parkolhat. Kérem a rendszámát!',
                    'Feleséged már ott van? Akkor neki kéne parkolójegy? Add meg a rendszámát!'
                ]), action: null
            };

        case 'parking_not_in_city':
            return {
                text: randomMessage([
                    'Kőszegen van fizetős parkolás. Amikor megérkezel, szólj és elindítom az SMS parkolást! 🚗',
                    'Még nem vagy Kőszegen, de ha odaértél, szólj – pár kattintással megvan a jegy.',
                    'Ha megérkezel, jelezz – elindítom a parkolást. Piros 440 Ft/h, Zöld 320 Ft/h.'
                ]), action: null
            };

        // ── FOOD (rankingEngineV2: GPS + weather + profile + revenue) ─────
        case 'food_search': {
            const all = load('restaurants.json');
            const ranked = rankPlaces(all, { weather, profile, speed });
            const top = location ? filterNearby(ranked, location, 3, 4) : ranked.slice(0, 4);

            if (top.length === 0) {
                return { text: 'Éttermet nem találtam. Megnyissam az étterem oldalt?', action: { type: 'navigate_to_food', params: {} } };
            }

            const list = top.map(r => {
                const dist = r._distanceKm != null && r._distanceKm < Infinity ? ` (${r._distanceKm} km)` : '';
                return `${r.name}${dist}`;
            }).join(', ');

            const weatherNote = weather?.isRain ? '☂️ Most esik – beltéri helyeket javaslok. ' : '';
            const timeNote = isLunch ? 'Ebédidő. ' : isEvening ? 'Vacsorára idő. ' : '';
            const text = await llm(
                `${weatherNote}${timeNote}Ajánlj ezek közül éttermet Kőszegen röviden: ${list}. Ne találj ki semmit.`,
                `Íme a legközelebbi helyek: ${list}.`
            );
            return { text, _rankedPlaces: ranked, action: null };
        }

        // ── ATTRACTIONS (geo + idő + weather alapján) ─────────────────────
        case 'attractions': {
            const all = load('attractions.json');
            const ranked = rankPlaces(all, { weather, profile, speed });
            const top = location
                ? filterNearby(ranked, location, 5, 4)
                : ranked.slice(0, 4);

            const list = top.map(a => {
                const dist = a._distanceKm != null && a._distanceKm < Infinity ? ` (${a._distanceKm} km)` : '';
                return `${a.name}${dist}`;
            }).join(', ');

            const weatherNote = weather?.isRain ? '☂️ Esős az idő – fedett látnivalókat ajánlom. ' : '';
            const text = await llm(
                `${weatherNote}Mutasd be röviden ezeket a kőszegi látnivalókat: ${list}. Max 2 mondat.`,
                `Kőszeg legjobb látnivalói: ${list}.`
            );
            return { text, _rankedPlaces: ranked, action: null };
        }

        // ── ITINERARY (food + attractions együtt) ─────────────────────────
        case 'build_itinerary': {
            const plan = buildItinerary({ intents: intents || [], context });
            if (plan.length === 0) {
                return { text: 'Nem találtam programot a közelben. Pontosítsuk?', action: null };
            }
            const summary = plan.map(p => p.name).filter(Boolean).join(', ');
            const text = await llm(
                `Összeállítottam egy Kőszeg-programot: ${summary}. Mutasd be természetesen${mobility === 'walking' ? ' (gyalog van)' : ''}.`,
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
                return { text: 'Nincs közelgő esemény az adatbázisban.', action: { type: 'navigate_to_events', params: {} } };
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
            return { text: 'Látom a pozíciódat! Hova navigáljalak?', action: null };

        case 'ask_destination':
            return { text: 'Hova szeretnél menni? Add meg a célpontot és megnyitom a navigációt.', action: null };

        // ── ARRIVAL PLANNING ─────────────────────────────────────────────
        case 'ask_arrival_time': {
            const situation = context?.situation || {};
            return {
                text: buildArrivalMessage(situation.distanceKm || '?', situation.approaching),
                action: null
            };
        }

        case 'arrival_planning': {
            const arrivalTs = parseArrivalTime(query);
            if (!arrivalTs) {
                return { text: 'Nem értettem mikor érkezel. Próbáld: "holnap 15 óra" vagy "pénteken délután".', action: null };
            }
            const lat = location?.lat ?? 47.3895;
            const lng = location?.lng ?? 16.541;
            const forecast = await getForecastForTime(lat, lng, arrivalTs);

            if (!forecast) {
                return { text: 'Előrejelzés nem elérhető, de szívesen segítek a programtervezésben!', action: null };
            }

            const all = [...load('restaurants.json'), ...load('attractions.json')];
            const ranked = rankPlaces(all, { weather: forecast, profile, speed: 0 });
            const top3 = ranked.slice(0, 3).map(p => p.name).filter(Boolean);
            const weatherDesc = forecast.isRain
                ? '☂️ Esőt mutat a rendszer – beltéri hangulatos helyeket javaslok.'
                : '☀️ Szép idő várható – kültéri programra is megyünk!';

            const text = await llm(
                `${weatherDesc} Érkezésre előkészített program: ${top3.join(', ')}. Mutasd be röviden.`,
                `${weatherDesc} Javaslom: ${top3.join(', ')}.`
            );
            return { text, _rankedPlaces: ranked, action: null };
        }

        case 'build_itinerary': {
            const plan = buildItinerary({ intents, context });

            // Ha nem vagy a városban
            if (context.situation?.status === 'not_in_city') {
                return {
                    text: `Még ${context.situation.userDistance} km-re vagy Kőszegtől. Ha odaértél, segítek programot választani! Mikor érkezel?`,
                    action: null
                };
            }

            // Ha nincs terv
            if (plan.length === 0) {
                return {
                    text: 'Nem találtam programot a közelben. Pontosítsd, mit szeretnél?',
                    action: null
                };
            }

            // Szépen összerakjuk a tervet
            const places = plan.map(p => p.name).join(' → ');
            const distances = plan.filter(p => p.distanceKm).map(p =>
                `${p.name} (${Math.round(p.distanceKm * 10) / 10} km)`
            ).join(', ');

            return {
                text: `Összeraktam neked egy kis programot: ${places}. ${distances ? `Mind ${distances} környékén van.` : ''}`,
                action: null
            };
        }

        // ── EMERGENCY ────────────────────────────────────────────────────
        case 'emergency':
            return { text: '🆘 Azonnal hívom a segélyszolgálatot!', action: { type: 'call_emergency', params: {} } };

        // ── NORMAL (LLM fallback) ─────────────────────────────────────────
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
