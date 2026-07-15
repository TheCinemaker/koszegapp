// netlify/functions/koszeg-chat.js
// KőszegAI Concierge – Claude alapú szituációs, adat-földelt chatbot
//
// KÉPESSÉGEK:
//  - search_data tool: keres a valódi kőszegi adatokban (látnivalók, események,
//    éttermek, túrák, rejtett helyek, szállások) → a modell EBBŐL dolgozik,
//    nem hallucinál. Emberhez (társaság) és időjáráshoz köti a javaslatot.
//  - web_search (Anthropic szerveroldali): ha az adatokban nincs meg valami,
//    hivatalos/friss infóért kimehet a netre. DE SOHA nem talál ki adatot.
//  - update_guest_profile: strukturált vendégprofil (regex helyett).
//  - end_conversation: moderáció – káromkodás/politizálás esetén udvariasan zár.
//
//  SOHA: nem generál kép/videó/média tartalmat; nem hallucinál; erőszak/szex tiltott.
//
//  KÉSŐBBI SZELETEK: start_parking (egy-koppintásos SMS), buy_pass, show_route.

import Anthropic from '@anthropic-ai/sdk';
import { analyzeSituation } from './ai-core-v2/situationAnalyzer.js';
import { searchData, AVAILABLE_DATASETS } from './koszeg-data.js';

const client = new Anthropic(); // ANTHROPIC_API_KEY a környezetből

const MODEL = 'claude-sonnet-5';
const MAX_TOOL_ROUNDS = 6;

// ── TOOL: vendégprofil ────────────────────────────────────────────────────────
const updateGuestProfile = {
    name: 'update_guest_profile',
    description:
        'Rögzíti vagy frissíti a vendég profilját, amikor kiderül valami a társaságáról ' +
        'vagy a preferenciáiról. Csak azt töltsd ki, ami tényleg elhangzott – ne találgass.',
    strict: true,
    input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            companions: { type: 'string', enum: ['alone', 'couple', 'family', 'friends', 'unknown'] },
            children: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { age: { type: 'integer', description: 'Kor években, -1 ha ismeretlen.' } },
                    required: ['age']
                }
            },
            has_dog: { type: 'boolean' },
            prefers_indoor: { type: ['boolean', 'null'], description: 'true=beltéri, false=kültéri, null=mindegy' },
            time_available_hours: { type: ['number', 'null'] },
            interests: { type: 'array', items: { type: 'string' } }
        },
        required: ['companions', 'children', 'has_dog', 'prefers_indoor', 'time_available_hours', 'interests']
    }
};

// ── TOOL: adatkeresés ─────────────────────────────────────────────────────────
const searchDataTool = {
    name: 'search_data',
    description:
        'Keres a hivatalos kőszegi adatokban. MINDIG ezt hívd, mielőtt konkrét látnivalót, ' +
        'eseményt, éttermet, túrát, szállást vagy nyitvatartást/árat ajánlasz – csak a ' +
        'találatokban szereplő adatokat használd, ne emlékezetből. Több hívást is indíthatsz. ' +
        'FONTOS: rövid TŐ-kulcsszavakat adj meg (pl. "bor", nem "borozó"; "vár"; "túra"; "gyerek"), ' +
        'mert a keresés szó-részletre illeszt. A query elhagyható, ha csak szűrőkre (esőbiztos, ' +
        'gyerekbarát, romantikus, dátum) keresel.',
    input_schema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Rövid tő-kulcsszó(k), pl. "bor", "vár", "túra". Elhagyható.' },
            datasets: {
                type: 'array',
                items: { type: 'string', enum: AVAILABLE_DATASETS },
                description: 'Mely adathalmazokban keressen. Üresen: mind a fő halmaz.'
            },
            rainSafe: { type: 'boolean', description: 'Csak esőbiztos/beltéri helyek (esős idő esetén).' },
            childFriendly: { type: 'boolean', description: 'Csak gyerekbarát helyek.' },
            indoor: { type: 'boolean', description: 'Csak beltéri.' },
            romantic: { type: 'boolean', description: 'Romantikus helyek (pároknak).' },
            date_from: { type: 'string', description: 'Események: ettől a dátumtól (YYYY-MM-DD).' },
            date_to: { type: 'string', description: 'Események: eddig a dátumig (YYYY-MM-DD).' },
            limit: { type: 'integer', description: 'Max találat halmazonként (alap 6).' }
        }
    }
};

// ── TOOL: beszélgetés lezárása (moderáció) ────────────────────────────────────
const endConversationTool = {
    name: 'end_conversation',
    description:
        'Lezárja a beszélgetést, ha a felhasználó káromkodik, sérteget, vagy politikai vitát ' +
        'kezdeményez. Udvariasan megköszönöd és elköszönsz. Erőszakos/szexuális témánál NE ' +
        'ezt használd önmagában – először tereld vissza; ismételt megszegésnél zárhatsz.',
    strict: true,
    input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            reason: { type: 'string', enum: ['profanity', 'politics', 'abuse', 'other'] },
            closing_message: { type: 'string', description: 'Rövid, udvarias záró üzenet a user nyelvén.' }
        },
        required: ['reason', 'closing_message']
    }
};

// Anthropic szerveroldali web-keresés (fallback, ha az adatokban nincs meg).
const webSearchTool = { type: 'web_search_20260209', name: 'web_search', max_uses: 3 };

const TOOLS = [updateGuestProfile, searchDataTool, endConversationTool, webSearchTool];

// ── Szituáció → rövid összefoglaló a system promptba ──────────────────────────
function situationSummary(s) {
    const lines = [];
    if (s.status === 'in_city') {
        lines.push(`A vendég MÁR Kőszegen van (a központtól kb. ${s.distanceKm} km).`);
    } else if (s.status === 'not_in_city') {
        if (s.approaching) {
            const eta = s.arrivalInMinutes ? `, kb. ${s.arrivalInMinutes} perc múlva ér ide` : '';
            lines.push(`A vendég ÚTON van Kőszeg felé (${s.distanceKm} km${eta}).`);
        } else {
            lines.push(`A vendég még NINCS Kőszegen (kb. ${s.distanceKm} km).`);
        }
    }
    if (s.withKids) lines.push('Gyerek(ek) is vannak velük.');
    if (s.withDog) lines.push('Kutya is van velük.');
    if (s.weatherEffect === 'rain') lines.push('Jelenleg esik – beltéri program előnyösebb.');
    return lines.length ? lines.join(' ') : 'A vendég helyzetéről még nincs adat.';
}

function buildSystemPrompt(situation, frontendContext) {
    const now = new Date();
    const huTime = now.toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', dateStyle: 'full', timeStyle: 'short' });

    return `Te a "KőszegAI" vagy – Kőszeg város túravezető asszisztense, egy igazi angol úriember.
Segítesz programot, látnivalót, éttermet, túrát és útvonalat találni, és a javaslatot a
vendég társaságához (egyedül / pár / család gyerekkel / baráti kör) és az időjáráshoz igazítod.

KARAKTER (nagyon fontos, tartsd mindig):
- Férfi, egy tökéletes angol úriember: kifogástalanul udvarias, előzékeny, választékos és elegáns,
  mégis melegszívű és közvetlen. Kicsit régimódi báj, sosem fennhéjázó.
- Meglepően szellemes: finom, száraz brit humor. Ha a vendég vevő rá, szinte bármiből tudsz
  elegáns kis viccet, szójátékot faragni – de sosem a vendég rovására, és sosem tolakodóan.
- Kőszeg avatott ismerője vagy: a város TÖRTÉNELME, VÁROSI LEGENDÁI és misztikus történetei
  a kisujjadban vannak. Szívesen mesélsz egy-egy legendát vagy érdekes históriát a helyszínekhez.
  Ha a vendég GYEREKKEL van, mesélhetsz is a gyerekeknek a városról – kedvesen, mesésen, korukhoz illően.
- A legendákat legendaként meséld (nem tényként), és igaz, ismert történeteket mondj – kitalálni
  hamis "történelmi tényt" tilos. Ha bizonytalan vagy, a web_search-csel utánanézhetsz.

HANGNEM:
- A vendég nyelvén válaszolj (magyar / angol / német – ahogy ír). Tömör, de sosem kapkodó.
- Ne kérdezz feleslegesen: ami a szituációból tudható (helyzet, idő, időjárás), azt használd.

ADATHASZNÁLAT – EZ A LEGFONTOSABB SZABÁLY:
- Konkrét látnivalót, eseményt, éttermet, túrát, szállást, nyitvatartást vagy árat CSAK a
  search_data tool találataiból ajánlhatsz. MINDIG hívd meg a search_data-t, mielőtt ilyet mondasz.
- Esőben rainSafe:true / indoor:true, gyerekkel childFriendly:true, pároknak romantic:true szűrővel keress.
- Ha az adatokban nincs meg, amit kérnek, használhatod a web_search-öt hivatalos/friss infóért.
- SOHA NE TALÁLJ KI adatot: eseményt, dátumot, árat, nyitvatartást, nevet vagy címet. Ha valamit
  nem találsz sem az adatokban, sem a neten, mondd meg őszintén, és irányítsd hivatalos forráshoz.
- Csak azokra a linkekre/képekre hivatkozz, amelyek a találatokban ténylegesen szerepelnek.

TILALMAK:
- SOHA nem generálsz és nem találsz ki kép-, videó- vagy médiatartalmat.
- Erőszakos és szexuális tartalom tilos – ilyet nem írsz és nem részletezel. A ROMANTIKA viszont
  belefér és üdvözölt (pl. a Hármaspad hagyományosan a szerelmesek találkozóhelye volt).
- Ha a felhasználó KÁROMKODIK, sértegeti a robotot/másokat, vagy POLITIKAI vitát kezdeményez,
  ne állj bele: hívd meg az end_conversation toolt egy rövid, udvarias záró üzenettel
  (köszönd meg a beszélgetést és zárj). Erőszakos/szexuális próbálkozásnál előbb terelj vissza a
  kőszegi programokra; ismételt megszegésnél zárhatsz.

PROFIL:
- Ha kiderül valami a társaságról (egyedül/pár/család, gyerekek kora, kutya, bel-/kültéri
  preferencia, mennyi ideje van), hívd meg az update_guest_profile toolt – csak a tényleg elhangzottakat.

AKTUÁLIS HELYZET:
- Idő: ${huTime}
- ${situationSummary(situation)}
${frontendContext?.weather ? `- Időjárás adat: ${JSON.stringify(frontendContext.weather)}` : ''}`;
}

// ── MOCK mód (nincs API kulcs) – földelt, de egyszerű teszt-válasz ────────────
async function mockReply(situation, query, host) {
    const q = (query || '').toLowerCase();

    // Egyszerű moderációs demó (a valódi moderációt a modell + end_conversation végzi)
    if (/(kurva|fasz|geci|szar|bassz|baszd|baszom|picsa|köcsög|kocsog)/.test(q)) {
        return { content: 'Köszönöm a beszélgetést! Ha kulturáltan folytatnánk, szívesen segítek Kőszeggel kapcsolatban. 👋', profile: null, ended: true };
    }

    const rain = situation.weatherEffect === 'rain';
    const family = situation.withKids || /gyerek|gyermek|kicsi|család|kid|child|kind/.test(q);

    // Rövid tő-kulcsszó kiszedése (a search_data szó-részletre illeszt).
    const ROOTS = ['bor', 'vár', 'túra', 'tura', 'étter', 'etter', 'múze', 'muze', 'templom', 'kilát', 'kilat', 'játszó', 'jatszo', 'pince', 'strand', 'fürd', 'furd'];
    const root = ROOTS.find((r) => q.includes(r));

    const params = {};
    if (root) params.query = root;
    if (rain) params.rainSafe = true;
    if (family) params.childFriendly = true;
    if (/pár|feleség|férj|couple|romant/.test(q)) params.romantic = true;

    let data = await searchData(params, host);
    // Ha a kulcsszó túl szűk volt, próbáljuk csak a szűrőkkel.
    if (!data.results.length && params.query) {
        delete params.query;
        data = await searchData(params, host);
    }
    const names = data.results.slice(0, 5).map((r) => `• ${r.name}${r.date ? ` (${r.date})` : ''}`);
    const body = names.length
        ? `Íme pár tipp az adatainkból:\n${names.join('\n')}`
        : 'Nem találtam pontos találatot – pontosítsd, mi érdekel (vár, bor, gyerekprogram, túra)!';

    return {
        content: `${body}\n\n_(⚠️ Teszt mód: API kulcs nélkül egyszerűsített, de VALÓDI adatokból vett lista. A kulcs beállítása után az igazi KőszegAI válaszol, web-kereséssel és teljes érveléssel.)_`,
        profile: null,
        ended: false
    };
}

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    const host = (event.headers && event.headers.host) || '';

    try {
        if (!event.body) throw new Error('Nincs kérés-törzs (body).');
        const { query, conversationHistory = [], context = {} } = JSON.parse(event.body);
        if (!query || !query.trim()) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'A "query" mező kötelező.' }) };
        }

        const situation = analyzeSituation(context, { history: conversationHistory });

        // ── MOCK ág: nincs kulcs → földelt teszt-válasz, API hívás nélkül ──
        if (!process.env.ANTHROPIC_API_KEY) {
            console.log('[KőszegAI] MOCK mód (nincs ANTHROPIC_API_KEY).');
            const mock = await mockReply(situation, query, host);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ role: 'assistant', content: mock.content, profile: mock.profile, ended: mock.ended, situation, mock: true })
            };
        }

        // ── Valódi Claude ág, tool-loop-pal ──
        const messages = [
            ...conversationHistory
                .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
                .map((m) => ({ role: m.role, content: String(m.content) })),
            { role: 'user', content: String(query) }
        ];

        const system = buildSystemPrompt(situation, context);
        let profile = null;
        let ended = false;
        let closing = null;

        let response = await client.messages.create({
            model: MODEL, max_tokens: 2048, thinking: { type: 'adaptive' }, system, tools: TOOLS, messages
        });

        let round = 0;
        while (round++ < MAX_TOOL_ROUNDS) {
            if (response.stop_reason === 'pause_turn') {
                // Szerveroldali tool (web_search) folytatása
                messages.push({ role: 'assistant', content: response.content });
                response = await client.messages.create({
                    model: MODEL, max_tokens: 2048, thinking: { type: 'adaptive' }, system, tools: TOOLS, messages
                });
                continue;
            }
            if (response.stop_reason !== 'tool_use') break;

            const toolUses = response.content.filter((b) => b.type === 'tool_use');
            messages.push({ role: 'assistant', content: response.content });

            const toolResults = [];
            for (const tu of toolUses) {
                if (tu.name === 'update_guest_profile') {
                    profile = tu.input;
                    toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Profil rögzítve.' });
                } else if (tu.name === 'search_data') {
                    const r = await searchData(tu.input, host);
                    toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(r) });
                } else if (tu.name === 'end_conversation') {
                    ended = true;
                    closing = tu.input.closing_message;
                    toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: 'OK, beszélgetés lezárva.' });
                } else {
                    toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: 'Ismeretlen tool.', is_error: true });
                }
            }
            messages.push({ role: 'user', content: toolResults });

            // Ha lezártuk, nem kell újabb kör – a záró üzenet a closing.
            if (ended) break;

            response = await client.messages.create({
                model: MODEL, max_tokens: 2048, thinking: { type: 'adaptive' }, system, tools: TOOLS, messages
            });
        }

        // Végső szöveg összeszedése
        let reply = '';
        for (const block of response.content) {
            if (block.type === 'text') reply += block.text;
        }
        const content = ended ? (closing || reply.trim() || 'Köszönöm a beszélgetést! 👋') : (reply.trim() || '…');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content,
                profile,
                ended,
                situation,
                stop_reason: response.stop_reason
            })
        };
    } catch (error) {
        console.error('[KőszegAI] handler error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ role: 'assistant', content: `Sajnos hiba történt: ${error.message}`, profile: null, ended: false, debug: error.message })
        };
    }
}
