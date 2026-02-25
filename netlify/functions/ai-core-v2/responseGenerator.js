/**
 * responseGenerator.js – ai-core-v2 (v7 LLM-enhanced + Robustness Merged)
 *
 * - LLM used for NATURAL, VARIED responses
 * - BUT strictly limited to REAL data from JSON files
 * - If no data found, offers Google search recommendation
 * - Zero hallucination – LLM only formats, never creates facts
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

const dataPath = join(process.cwd(), 'public/data');

function load(file) {
    try { return JSON.parse(readFileSync(join(dataPath, file), 'utf8')); }
    catch (e) {
        console.warn(`Failed to load ${file}:`, e.message);
        return [];
    }
}

function getGenAI() {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
}

const PERSONA = `Te a KőszegAPP barátságos, közvetlen asszisztense vagy. 
Magyarul beszélsz, tegező formában. Rövid, lényegre törő válaszokat adj (max 2-3 mondat).
A válaszod elején MINDIG a kért információt add meg, ne kertelj!
Válaszolj természetesen, mintha egy haverod beszélgetne veled.
De SOHA ne találj ki helyet, adatot, történelmi eseményt vagy bármit!
Csak a megadott listából dolgozhatsz. Válaszaidba ne írj olyan tényt ami nincs a listában.
Ha a felhasználó olyat kérdez, ami nincs az adatbázisban, ajánld fel, hogy keress a Google-on.
A távolságokat („innen kb. X km”) mindig említsd meg, ha van ilyen adat!`;

async function llm(prompt, fallback) {
    if (!process.env.GEMINI_API_KEY) return fallback;
    try {
        const model = getGenAI().getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: PERSONA,
            generationConfig: { temperature: 0.7, maxOutputTokens: 220 }
        });
        const res = await model.generateContent(prompt);
        return applyPersonality(res.response.text().trim());
    } catch (e) {
        console.warn('LLM format failed:', e.message);
        return fallback;
    }
}

/**
 * Szó normalizálása: kisbetű, ékezetek és írásjelek eltávolítása.
 */
function normalize(word) {
    if (!word) return "";
    return word.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
        .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u');
}

export async function generateResponse({ replyType, query, state, context, profile, weather, intents }) {
    const { location, mobility, isLunch, isEvening } = context || {};
    const speed = context?.speed ?? null;
    const qNorm = normalize(query);

    // =====================================================
    // KERESŐ FÜGGVÉNY – visszaadja a találatokat
    // =====================================================
    function searchInCategory(category, searchTerm) {
        const q = normalize(searchTerm);
        const qWords = q.split(/\s+/).filter(w => w.length > 2);
        const results = [];

        // ÉTTERMEK, CUKRÁSZDÁK, PIZZÉRIÁK
        if (category === 'food' || category === 'all') {
            const places = load('restaurants.json');
            places.forEach(p => {
                const name = normalize(p.name || '');
                const tags = (p.tags || []).join(' ').toLowerCase();
                const allText = `${name} ${normalize(tags)}`;

                if ((q.includes('cukraszda') || q.includes('sutemeny')) &&
                    (allText.includes('cukraszda') || allText.includes('suti'))) {
                    results.push({ ...p, type: 'cukrászda', category: 'food' });
                }
                else if ((q.includes('pizza') || q.includes('pizzeri')) &&
                    (allText.includes('pizza') || allText.includes('pizzeri'))) {
                    results.push({ ...p, type: 'pizzéria', category: 'food' });
                }
                else if ((q.includes('etterem') || q.includes('enni') || q.includes('kaja')) &&
                    (allText.includes('etterem') || allText.includes('vendeglo'))) {
                    results.push({ ...p, type: 'étterem', category: 'food' });
                }
                else if (qWords.some(qw => allText.includes(qw))) {
                    results.push({ ...p, category: 'food' });
                }
            });
        }

        // LÁTNIVALÓK
        if (category === 'attractions' || category === 'all') {
            const places = load('attractions.json');
            places.forEach(p => {
                const name = normalize(p.name || '');
                const desc = normalize(p.description || '');
                const allText = `${name} ${desc}`;
                if (q.includes('var') || q.includes('templom') || q.includes('muzeum') || qWords.some(qw => allText.includes(qw))) {
                    results.push({ ...p, category: 'attraction' });
                }
            });
        }

        // GYAKORLATI INFÓK (patika, wc, atm)
        if (category === 'practical' || category === 'all') {
            const places = load('info.json');
            places.forEach(p => {
                const title = normalize(p.title || '');
                const content = normalize(p.content || '');
                const allText = `${title} ${content}`;

                // Patika vs Patikamúzeum
                if (q.includes('patika') && !q.includes('muzeum')) {
                    if ((allText.includes('patika') || allText.includes('gyogyszertar')) && !allText.includes('muzeum')) {
                        results.push({ ...p, type: 'pharmacy', category: 'practical' });
                    }
                } else if (q.includes('patikamuzeum') || (q.includes('patika') && q.includes('muzeum'))) {
                    if (allText.includes('patikamuzeum')) {
                        results.push({ ...p, type: 'museum', category: 'practical' });
                    }
                } else if (q.includes('wc') || q.includes('mosdo') || q.includes('vece')) {
                    if (allText.includes('wc') || allText.includes('mosdo') || allText.includes('vece') || allText.includes('mosdó')) {
                        results.push({ ...p, type: 'wc', category: 'practical' });
                    }
                } else if (q.includes('atm') || q.includes('penz') || q.includes('bank') || q.includes('automata')) {
                    if (allText.includes('atm') || allText.includes('penz') || allText.includes('bank') || allText.includes('automata')) {
                        results.push({ ...p, type: 'atm', category: 'practical' });
                    }
                } else if (qWords.some(qw => allText.includes(qw))) {
                    results.push({ ...p, category: 'practical' });
                }
            });
        }

        // TÖRTÉNELEM
        if (category === 'history' || category === 'all') {
            const places = load('hidden_gems.json');
            places.forEach(p => {
                const name = normalize(p.name || '');
                const desc = normalize(p.description || p.content || '');
                const allText = `${name} ${desc}`;
                if (allText.includes('ostrom') || allText.includes('1532') || qWords.some(qw => allText.includes(qw))) {
                    results.push({ ...p, category: 'history' });
                }
            });
        }

        // Távolság alapú rendezés & 15km+ korlát feloldása
        if (location && results.length > 0) {
            const ranked = rankPlaces(results, { weather, profile, speed });
            const topDist = ranked[0]._distanceKm || 0;
            const radius = topDist > 15 ? topDist + 5 : 15;
            return filterNearby(ranked, location, radius, 5);
        }

        return results.slice(0, 5);
    }

    // =====================================================
    // VÁLASZOK – MINDENHOL LLM-MEL!
    // =====================================================
    switch (replyType) {

        // ── GREETING ─────────────────────────────────────
        case 'greeting': {
            const text = await llm(
                `A felhasználó köszöntött: "${query}". Köszönj vissza változatosan, barátságosan, kérdezd meg miben segíthetsz Kőszegen!`,
                'Szia! Miben segíthetek Kőszegen? 😊'
            );
            return { text, action: null };
        }

        // ── PARKING ───────────────────────────────────────
        case 'ask_plate': {
            const text = await llm(
                `A felhasználó el akarja indítani a parkolást. Kérd meg közvetlenül, hogy adja meg a rendszámát. 
                 Válaszolj változatosan, de ne legyen hosszú!`,
                'Add meg a rendszámodat!'
            );
            return { text, action: null };
        }

        case 'ask_duration': {
            const plate = state.tempData?.licensePlate || 'a rendszámot';
            const text = await llm(
                `A felhasználó rendszáma: ${plate}. Kérdezd meg, hány órára szeretne parkolni. 
                 Legyél közvetlen és változatos!`,
                `Rendben, ${plate} – hány órára parkoljak?`
            );
            return { text, action: null };
        }

        case 'confirm_parking': {
            const { licensePlate, duration } = state.tempData || {};
            const text = await llm(
                `A felhasználó ${licensePlate} rendszámmal ${duration} órára akar parkolni. 
                 Megerősítést várunk tőle. Kérdezd meg, hogy mehet-e az indítás.`,
                `${licensePlate} rendszámmal ${duration} órára indítsam? Mehet?`
            );
            return { text, action: null };
        }

        case 'parking_success': {
            const text = await llm(
                `A parkolás előkészítése kész. Mondd meg neki, hogy most megnyílik a parkolóoldal, ahol az SMS gombra kell majd nyomnia. 
                 Kívánj neki szép napot vagy jó sétát Kőszegen!`,
                'Megnyitom a parkolóoldalt – az SMS gombra kell nyomni. Jó sétát!'
            );
            return { text, action: { type: 'buy_parking_ticket', params: state.tempData } };
        }

        case 'parking_cancelled': {
            const text = await llm(`A felhasználó lemondta a parkolást. Nyugtázd sajnálkozás nélkül, barátságosan!`, 'Rendben, töröltem a parkolást.');
            return { text, action: null };
        }

        case 'parking_info': {
            const text = await llm(`Mondd el a parkolási díjakat: Piros zóna (belváros) 440 Ft/h, Zöld zóna 320 Ft/h. H-P 8-17-ig fizetős, hétvégén ingyenes!`, 'Kőszegen a piros zóna 440 Ft/h, a zöld 320 Ft/h. Hétvégén ingyenes!');
            return { text, action: null };
        }

        case 'parking_info_not_in_city': {
            const text = await llm(`Még nem vagy a városban. Mondd el a tarifákat (440/320 Ft), és ígérd meg, hogy ha ideérsz, segítesz indítani.`, 'Még nem vagy itt, de ha megérkezel, segítek a parkolásban (440/320 Ft/h).');
            return { text, action: null };
        }

        case 'parking_info_user_there': {
            const text = await llm(`A látogató már itt van Kőszegen! Biztasd, hogy indíthatjuk a parkolást (440/320 Ft), és kérd a rendszámot.`, 'Szuper, hogy itt vagy! Add meg a rendszámodat és indítom a parkolást.');
            return { text, action: null };
        }

        case 'parking_info_wife_there': {
            const text = await llm(`A felesége már Kőszegen van! Kérd meg a felhasználót, hogy adja meg a felesége rendszámát, és elindítod neki a parkolást.`, 'Akkor a feleségednek indítsunk parkolást? Kérem a rendszámát!');
            return { text, action: null };
        }

        case 'parking_not_in_city': {
            const text = await llm(`Szólj, hogy Kőszegen fizetős a parkolás, de mivel még nem vagy itt, majd akkor indítsuk, ha megérkeztél!`, 'Ha megérkezel Kőszegre, szólj és indítjuk a parkolást!');
            return { text, action: null };
        }

        case 'parking_offer_declined': {
            const text = await llm(`A felhasználó nem kért parkolást. Nyugtázd kedvesen, és kérdezd meg, miben segíthetsz még.`, 'Semmi gond, miben segíthetek még?');
            return { text, action: null };
        }

        case 'parking_offer_clarify': {
            const text = await llm(`Sajnos nem volt világos: menjen a parkolás vagy ne? Kérdezd meg újra, röviden.`, 'Bocsi, nem értettem. Indítsuk a parkolást?');
            return { text, action: null };
        }

        case 'ask_save_consent': {
            const plate = state.tempData?.licensePlate;
            const text = await llm(
                `A parkolás majdnem kész. Kérdezd meg, elmenthetem-e az alábbi rendszámot (${plate}) a következő alkalomra, hogy gyorsabb legyen?`,
                `Elmenthetem a ${plate} rendszámot legközelebbre?`
            );
            return { text, action: null };
        }

        // ── ARRIVAL ───────────────────────────────────────
        case 'ask_arrival_time': {
            const distance = context.situation?.distanceKm || 'pár';
            const text = await llm(
                `A felhasználó ${distance} km-re van Kőszegtől. 
                 Érdeklődj barátságosan, hogy mikor érkezik a városba!`,
                `Minden megvan, csak azt mondd meg, mikor érkezel Kőszegre?`
            );
            return { text, action: null };
        }

        case 'arrival_time_received': {
            const time = state.tempData?.arrivalTime || 'akkor';
            const text = await llm(
                `A felhasználó megadta az érkezési időt: ${time}. 
                 Nyugtázd kedvesen, és kérdezd meg, miben segíthetsz addig is (pl. programkeresés)!`,
                `Oké, ${time} körül találkozunk! Addig is nézzünk valami jó programot?`
            );
            return { text, action: null };
        }

        case 'arrival_time_acknowledged': {
            const text = await llm(`A felhasználó korábban már mondott egy érkezési időt. Most visszatértünk a kéréséhez. Folytasd barátságosan!`, 'Rendben, akkor nézzük a többi dolgot!');
            return { text, action: null };
        }

        case 'rainy_day_recommendations': {
            const text = await llm(`Sajnos esik az eső Kőszegen. Ajánlj benti programokat (vár, múzeumok, kávézók) az adatbázis alapján!`, 'Mivel esik az eső, ajánlok pár benti programot: Jurisics vár, Gyógyszertár múzeum.');
            return { text, action: { type: 'navigate_to_attractions' } };
        }

        case 'families': {
            const text = await llm(`Családdal/gyerekkel érkező vendégnek ajánlj játszótereket, állatsimogatót (Chernel-kert) vagy a várat!`, 'Kőszeg szuper hely családoknak! Ajánlom a várat és az Alpokalja kalandparkot.');
            return { text, action: { type: 'navigate_to_attractions' } };
        }

        case 'tours': {
            const text = await llm(`Túrázási lehetőségeket (Írottkő, Óház-kilátó, Hétforrás) ajánlj barátságosan.`, 'Kőszeg környéke tele van túraútvonalakkal! Írottkő vagy Hétforrás?');
            return { text, action: { type: 'navigate_to_attractions' } };
        }

        case 'shopping': {
            const text = await llm(`Vásárlási lehetőségeket, helyi termékeket (bor, méz, szuvenír) ajánlj a városban.`, 'Helyi portékát keresel? A Fő téren és a vár környékén találsz szuvenírt és bort is.');
            return { text, action: null };
        }

        case 'accessibility': {
            const text = await llm(`Akadálymentes vagy speciális igényű (pl. gluténmentes) helyekről adj tájékoztatást barátságosan.`, 'Igyekszünk mindenben segíteni! Vannak akadálymentes látnivalóink is.');
            return { text, action: null };
        }

        // ── FOOD SEARCH ───────────────────────────────────
        case 'food_search': {
            const results = searchInCategory('food', query);

            if (results.length === 0) {
                const text = await llm(
                    `A felhasználó éttermet keres: "${query}". Sajnos nem találtunk semmit az adatbázisban.
                     Mondd el ezt neki udvariasan, és ajánld fel, hogy a Google-ön is utánanézhetsz.`,
                    'Sajnos nem találtam ilyen helyet a közelben. Szeretnéd, hogy megkeressem a Google-on?'
                );
                return {
                    text,
                    action: { type: 'google_search', params: { query } }
                };
            }

            const placesList = results.map(r => `${r.name} (${r._distanceKm ? r._distanceKm + ' km' : 'itt Kőszegen'})`).join(', ');

            const text = await llm(
                `A felhasználó éttermet keres: "${query}". Találtam ezeket a helyeket: ${placesList}. 
                 Sorold fel őket és a távolságokat! Legyél rövid és segítőkész.`,
                `Találtam néhány szuper helyet: ${placesList}.`
            );

            return { text, action: { type: 'navigate_to_food' } };
        }

        // ── ATTRACTIONS ───────────────────────────────────
        case 'attractions': {
            const results = searchInCategory('attractions', query);

            if (results.length === 0) {
                const text = await llm(
                    `A felhasználó látnivalót keres: "${query}". Nem találtam semmit.
                     Mondd meg neki kedvesen, és ajánld fel a Google keresés lehetőségét.`,
                    'Nem találtam ilyen látnivalót a közelben. Szeretnéd, hogy megnézzem a Google-on?'
                );
                return {
                    text,
                    action: { type: 'google_search', params: { query } }
                };
            }

            const placesList = results.map(r => `${r.name} (${r._distanceKm ? r._distanceKm + ' km' : 'itt Kőszegen'})`).join(', ');

            const text = await llm(
                `Ezeket a látnivalókat találtam: ${placesList}. 
                 Ajánld fel neki a listát, légy lelkes és közvetlen!`,
                `Itt van pár látnivaló, amit nem érdemes kihagyni: ${placesList}.`
            );

            return { text, action: { type: 'navigate_to_attractions' } };
        }

        // ── PRACTICAL (patika, wc, atm) ───────────────────
        case 'practical': {
            const results = searchInCategory('practical', query);

            if (results.length === 0) {
                const text = await llm(
                    `A felhasználó valamilyen szolgáltatást keres: "${query}". Nem találtam az adatbázisban.
                     Mondd meg neki, és kérdezd meg, keressünk-e rá a Google-on.`,
                    'Sajnos nem találtam ilyen szolgáltatást a közelben. Megnézzem a Google-on?'
                );
                return {
                    text,
                    action: { type: 'google_search', params: { query } }
                };
            }

            const placesList = results.map(r => `${r.title || r.name} (${r._distanceKm ? r._distanceKm + ' km' : 'itt Kőszegen'})`).join(', ');

            if (results.some(r => r.type === 'museum')) {
                const text = await llm(
                    `A felhasználó patikát keresett, de csak a Patikamúzeumot találtam: ${placesList}. 
                     Figyelmeztesd, hogy ez egy múzeum, nem egy működő gyógyszertár!`,
                    `Találtam egy helyet: ${placesList}. De figyelem: ez már egy múzeum, nem gyógyszertár!`
                );
                return { text, action: null };
            }

            const text = await llm(
                `ADATOK: ${placesList}. A felhasználó kérése: "${query}". 
                 Add meg a pontos adatokat (nyitvatartás, cím, telefon), amik a listában vannak! Ne kérdezz vissza, csak add át az infót!`,
                `Találtam: ${placesList}.`
            );

            return { text, action: null };
        }

        // ── HISTORY ───────────────────────────────────────
        case 'history': {
            const results = searchInCategory('history', query);

            if (results.length === 0) {
                const text = await llm(
                    `A felhasználó a történelemről kérdezett: "${query}". Nincs adatom róla.
                     Kérj elnézést, és ajánld fel a Google-t.`,
                    'Erről a történelmi eseményről sajnos nincs adatom. Szeretnéd, hogy megkeressem a Google-on?'
                );
                return {
                    text,
                    action: { type: 'google_search', params: { query } }
                };
            }

            const item = results[0];
            const text = await llm(
                `Történelmi infó a kérésre: ${item.name}. Leírás: ${item.description || item.content}.
                 Meséld el ezt neki röviden és érdekfeszítően!`,
                `🏰 ${item.name}: ${item.description || item.content}`
            );

            return { text, action: null };
        }

        // ── EVENTS ────────────────────────────────────────
        case 'events': {
            const events = load('events.json');
            const upcoming = events
                .filter(e => new Date(e.date || e.start_date) >= new Date())
                .slice(0, 5)
                .map(e => `${e.title || e.name} (${e.date})`);

            if (upcoming.length === 0) {
                const text = await llm(
                    'Jelenleg nincs közelgő esemény rögzítve az adatbázisban. Mondd meg ezt neki sajnálkozva.',
                    'Sajnos mostanában nem lesznek események.'
                );
                return { text, action: { type: 'navigate_to_events' } };
            }

            const eventsList = upcoming.join(', ');
            const text = await llm(
                `Ezek az események lesznek mostanában: ${eventsList}. Ajánld fel neki a programokat!`,
                `Közelgő programok, amik érdekelhetnek: ${eventsList}.`
            );

            return { text, action: { type: 'navigate_to_events' } };
        }

        // ── HOTELS ────────────────────────────────────────
        case 'hotels': {
            const hotelsList = load('hotels.json').slice(0, 5).map(h => h.name).join(', ');
            const text = await llm(
                `Íme néhány szálláshely Kőszegen: ${hotelsList}. Ajánld fel neki őket barátságosan!`,
                `Ha szállást keresel, ezeket ajánlom: ${hotelsList}.`
            );
            return { text, action: { type: 'navigate_to_hotels' } };
        }

        // ── NORMAL (LLM fallback) ─────────────────────
        case 'normal':
        default: {
            // Először keresünk minden kategóriában a query alapján
            const results = searchInCategory('all', query);

            if (results.length > 0) {
                const placesList = results.map(r => {
                    const name = r.name || r.title;
                    const dist = r._distanceKm ? ` (${r._distanceKm} km)` : '';
                    return `${name}${dist}`;
                }).join(', ');

                const text = await llm(
                    `A felhasználó kérdezett valamit: "${query}". 
                     Találtam ezeket a helyeket, amik relevánsak lehetnek: ${placesList}. 
                     Válaszolj neki kedvesen, és említsd meg ezeket a találatokat!`,
                    `Találtam néhány dolgot Kőszegen: ${placesList}. Segíthetek még valamiben?`
                );

                return { text, action: null };
            }

            // Ha semmiképp nincs találat, Google keresés felajánlása
            const text = await llm(
                `A felhasználó kérdezte: "${query}". Sajnos semmit nem találtam az adatbázisom egyik kategóriájában sem.
                 Mondd el neki udvariasan, hogy itt sajnos nincs erről infó, de ha szeretné, rákereshetsz a honlapon/Google-on!`,
                'Hű, erről sajnos nincs információm. Szeretnéd, hogy utánanézzek a Google-on?'
            );

            return {
                text,
                action: { type: 'google_search', params: { query } }
            };
        }
    }
}
