// netlify/functions/koszeg-chat.js
// KőszegAI Concierge – Claude (Sonnet 5) alapú szituációs chatbot
//
// 1. SZELET: működő váz + STRUKTURÁLT profilozás (a törékeny regex helyett).
//    - Figyeli a szituációt (GPS/sebesség/idő) a meglévő situationAnalyzer-rel
//    - A Claude tool-callinggal ad vissza egy validált vendégprofilt
//      (társaság, gyerekek+koruk, kutya, bel-/kültéri preferencia, időkeret)
//    - Természetes, meleg hangvételű szöveges választ ad a user nyelvén
//
//    KÉSŐBBI SZELETEK: parkolás (egy-koppintásos SMS), KőszegPass vásárlás,
//    útvonal a rankingEngineV2 + itineraryEngine fölött.

import Anthropic from '@anthropic-ai/sdk';
import { analyzeSituation } from './ai-core-v2/situationAnalyzer.js';

const client = new Anthropic(); // ANTHROPIC_API_KEY a környezetből

const MODEL = 'claude-sonnet-4-6';


// ── Vendégprofil tool ────────────────────────────────────────────────────────
// A Claude ezt hívja meg, amikor megtud valamit a társaságról. A strict:true
// garantálja, hogy a visszaadott input pontosan illeszkedik a sémára – nincs
// többé regex-alapú találgatás magyar szövegen.
const updateGuestProfile = {
    name: 'update_guest_profile',
    description:
        'Rögzíti vagy frissíti a vendég profilját, amikor kiderül valami a társaságáról ' +
        'vagy a preferenciáiról a beszélgetésből. Csak azokat a mezőket töltsd ki, ' +
        'amelyek ténylegesen elhangzottak vagy egyértelműen következnek – ne találgass.',
    strict: true,
    input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            companions: {
                type: 'string',
                enum: ['alone', 'couple', 'family', 'friends', 'unknown'],
                description: 'A társaság típusa.'
            },
            children: {
                type: 'array',
                description: 'Gyerekek listája, ha vannak. Üres tömb, ha nincs gyerek.',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        age: {
                            type: 'integer',
                            description: 'A gyerek életkora években. -1, ha nem tudjuk pontosan.'
                        }
                    },
                    required: ['age']
                }
            },
            has_dog: {
                type: 'boolean',
                description: 'Van-e velük kutya.'
            },
            prefers_indoor: {
                type: ['boolean', 'null'],
                description:
                    'true = beltéri programot szeretne (pl. eső miatt), false = kültéri, ' +
                    'null = nem tudjuk / mindegy.'
            },
            time_available_hours: {
                type: ['number', 'null'],
                description: 'Hány órája van a városnézésre. null, ha nem mondta.'
            },
            interests: {
                type: 'array',
                description: 'Érdeklődési címkék (pl. "vár", "bor", "gasztronómia", "túra", "múzeum").',
                items: { type: 'string' }
            }
        },
        required: [
            'companions',
            'children',
            'has_dog',
            'prefers_indoor',
            'time_available_hours',
            'interests'
        ]
    }
};

// ── Szituáció → rövid, ember által is olvasható összefoglaló a system promptba ──
function situationSummary(situation) {
    const lines = [];
    if (situation.status === 'in_city') {
        lines.push(`A vendég MÁR Kőszegen van (a központtól kb. ${situation.distanceKm} km).`);
    } else if (situation.status === 'not_in_city') {
        if (situation.approaching) {
            const eta = situation.arrivalInMinutes ? `, kb. ${situation.arrivalInMinutes} perc múlva ér ide` : '';
            lines.push(`A vendég ÚTON van Kőszeg felé (${situation.distanceKm} km${eta}).`);
        } else {
            lines.push(`A vendég még NINCS Kőszegen (kb. ${situation.distanceKm} km).`);
        }
    }
    if (situation.withKids) lines.push('A beszélgetés alapján gyerek(ek) is vannak velük.');
    if (situation.withDog) lines.push('Kutya is van velük.');
    if (situation.weatherEffect === 'rain') lines.push('Jelenleg esik – beltéri program előnyösebb lehet.');
    return lines.length ? lines.join(' ') : 'A vendég helyzetéről még nincs adat.';
}

// ── MOCK mód ─────────────────────────────────────────────────────────────────
// Ha nincs ANTHROPIC_API_KEY, a function determinisztikus, de a szituációra
// reagáló választ ad – ugyanabban a formátumban, mint az igazi Claude-válasz.
// Így a teljes folyamat (frontend, szituáció, profil, akciók) tesztelhető kulcs
// és költség nélkül. A kulcs beállításakor automatikusan az igazi modell felel.
function mockReply(situation, query) {
    const q = (query || '').toLowerCase();
    // A situationAnalyzer csak az előzményből néz gyereket/kutyát; a demóhoz az
    // aktuális kérdésből is felismerjük (az igazi modell ezt amúgy is megteszi).
    const family = situation.withKids || /gyerek|gyermek|kicsi|család|kid|child|kind/.test(q);
    const dog = situation.withDog || /kutya|eb|dog|hund/.test(q);
    const rain = situation.weatherEffect === 'rain';

    let opener;
    if (situation.status === 'in_city') {
        opener = 'Szuper, akkor már itt is vagy Kőszegen! 🏰';
    } else if (situation.approaching) {
        const eta = situation.arrivalInMinutes ? ` Kb. ${situation.arrivalInMinutes} perc és itt vagy.` : '';
        opener = `Látom, úton vagy felénk (${situation.distanceKm} km).${eta}`;
    } else if (situation.status === 'not_in_city') {
        opener = `Még ${situation.distanceKm} km a város, de addig is tervezgethetünk.`;
    } else {
        opener = 'Szia! Miben segíthetek a kőszegi látogatásodhoz?';
    }

    const tips = [];
    if (rain) tips.push('Mivel esik, javaslok pár beltéri programot: a Jurisics-vár és a múzeumok remekek ilyenkor.');
    if (family) tips.push('Gyerekekkel a várudvar és a közeli játszótér mindig befutó, és a séták legyenek rövidek.');
    if (dog) tips.push('A kutyust nyugodtan hozhatod, a belváros és a várfal körüli séta kutyabarát.');
    if (/bor|wine|wein/.test(q)) tips.push('Ha a bor érdekel, a kőszegi borospincék és a Jézus Szíve-templom környéki helyek jó kiindulás.');
    if (/étterem|enni|food|restaurant|essen/.test(q)) tips.push('Ebédre a főtér környéki éttermek kényelmesen elérhetők gyalog.');
    if (!tips.length) tips.push('Mondd el, kivel érkezel és mi érdekel (vár, bor, gasztró, túra), és összerakok egy programot!');

    const content = `${opener}\n\n${tips.join(' ')}\n\n_(⚠️ Teszt mód: beállított API kulcs nélkül előre megírt válasz. A kulcs beállítása után az igazi KőszegAI felel.)_`;

    // Profil "kiszűrése" egyszerű jelekből – az igazi modell ezt sokkal jobban csinálja.
    let companions = 'unknown';
    if (family) companions = 'family';
    else if (/pár|feleség|férj|couple|partner|barátnő|barátom/.test(q)) companions = 'couple';
    else if (/egyedül|alone|magam/.test(q)) companions = 'alone';
    else if (/barát|friends|freunde|haver/.test(q)) companions = 'friends';

    const hoursMatch = q.match(/(\d+)\s*(óra|órán|hour|std|stunde)/);
    const profile = {
        companions,
        children: family ? [{ age: -1 }] : [],
        has_dog: !!dog,
        prefers_indoor: rain ? true : null,
        time_available_hours: hoursMatch ? Number(hoursMatch[1]) : null,
        interests: []
    };
    if (/bor|wine|wein/.test(q)) profile.interests.push('bor');
    if (/vár|castle|burg/.test(q)) profile.interests.push('vár');
    if (/túra|hike|wander/.test(q)) profile.interests.push('túra');

    return { content, profile };
}

function buildSystemPrompt(situation, frontendContext) {
    const now = new Date();
    const huTime = now.toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', dateStyle: 'full', timeStyle: 'short' });

    return `Te a "KőszegAI" vagy – Kőszeg város barátságos, helyismerő túravezető asszisztense.
Segítesz a látogatóknak programot, látnivalót, éttermet és útvonalat találni a városban,
és figyelsz arra, kivel és milyen körülmények közt érkeznek.

VISELKEDÉS:
- Meleg, közvetlen, de tömör hangnem. A vendég nyelvén válaszolj (magyar, angol, német – ahogy ír).
- Ne kérdezz feleslegesen: ami a szituációból már tudható (helyzet, idő, időjárás), azt használd.
- Ha kiderül valami a társaságról (egyedül / pár / család / baráti kör, gyerekek kora, kutya,
  bel- vagy kültéri preferencia, mennyi ideje van), hívd meg az update_guest_profile eszközt.
  Csak azt rögzítsd, ami tényleg elhangzott – ne találgass.
- Gyerekkel: rövidebb séták, játszótér, családbarát helyek. Pár: romantikus helyszínek, borozó.
  Esőben: beltéri programok (vár, múzeum, cukrászda). Ezeket vedd figyelembe a javaslatoknál.
- Egyelőre konkrét foglalást/parkolást/vásárlást NE ígérj – ezek a funkciók még fejlesztés alatt.

AKTUÁLIS HELYZET:
- Idő: ${huTime}
- ${situationSummary(situation)}
${frontendContext?.weather ? `- Időjárás adat: ${JSON.stringify(frontendContext.weather)}` : ''}`;
}

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        if (!event.body) throw new Error('Nincs kérés-törzs (body).');
        const { query, conversationHistory = [], context = {} } = JSON.parse(event.body);

        if (!query || !query.trim()) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'A "query" mező kötelező.' }) };
        }

        // 1. Szituáció a meglévő analyzer-rel (GPS/sebesség/idő + a beszélgetés utolsó üzenetei)
        const situation = analyzeSituation(context, { history: conversationHistory });

        // ── MOCK ág: nincs kulcs → determinisztikus teszt-válasz (nincs API hívás/költség) ──
        if (!process.env.ANTHROPIC_API_KEY) {
            console.log('[KőszegAI] MOCK mód (nincs ANTHROPIC_API_KEY).');
            const mock = mockReply(situation, query);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    role: 'assistant',
                    content: mock.content,
                    profile: mock.profile,
                    situation,
                    mock: true
                })
            };
        }

        // 2. Beszélgetés összeállítása – a történet + az aktuális kérdés
        const messages = [
            ...conversationHistory
                .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
                .map((m) => ({ role: m.role, content: String(m.content) })),
            { role: 'user', content: String(query) }
        ];

        // 3. Claude hívás (Sonnet 5). adaptive thinking bekapcsolva; sampling paramétert
        //    NEM adunk meg (Sonnet 5 elutasítja a nem-default értékeket).
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            thinking: { type: 'adaptive' },
            system: buildSystemPrompt(situation, context),
            tools: [updateGuestProfile],
            messages
        });

        // 4. Válasz feldolgozása: szöveg + (opcionális) strukturált profil
        let reply = '';
        let profile = null;
        for (const block of response.content) {
            if (block.type === 'text') {
                reply += block.text;
            } else if (block.type === 'tool_use' && block.name === 'update_guest_profile') {
                profile = block.input;
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: reply.trim() || '…',
                profile,       // strukturált vendégprofil, ha a modell kiszűrte
                situation,     // a nyers szituáció (debug/frontend használatra)
                stop_reason: response.stop_reason
            })
        };
    } catch (error) {
        console.error('[KőszegAI] handler error:', error);
        // 200-at adunk vissza, hogy a UI szépen megjelenítse a hibát
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: `Sajnos hiba történt: ${error.message}`,
                profile: null,
                debug: error.message
            })
        };
    }
}
