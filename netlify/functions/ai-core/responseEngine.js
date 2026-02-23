import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

/**
 * RESPONSE ENGINE 4.0 (Urban Brain)
 * persona-aware, deterministic override, cross-linked, humor-enhanced
 */
export async function generateResponse({ intent, query, context, history }) {

    const decision = context.decision || null;
    const persona = decision?.persona || 'hybrid';
    const topRecommendations = decision?.primaryRecommendations || [];
    const now = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });

    // ===============================
    // 1️⃣ ITINERARY LOGIC – CUSTOM GENERATION
    // ===============================
    if (intent === 'itinerary') {
        return generateItineraryResponse(query, context);
    }

    // ===============================
    // 2️⃣ EMERGENCY & PARKING OVERRIDES (Hardened Business Brain)
    // ===============================
    if (intent === 'emergency') {
        if (topRecommendations?.length > 0) {
            const item = topRecommendations[0];
            return {
                text: `SEGÍTSÉG: ${item.name} - ${item.details || item.description}. Haladéktalanul javaslom az irányt!`,
                action: decision.action || { type: "navigate_to_emergency" },
                confidence: 1.0
            };
        }
        return {
            text: "Azonnal segítek. Kérlek írd meg pontosan mi a baj, vagy keresd fel a legközelebbi orvosi ügyeletet a listában.",
            action: decision.action || { type: "navigate_to_emergency" },
            confidence: 0.9
        };
    }

    if (intent === 'parking') {
        if (topRecommendations?.length > 0) {
            const item = topRecommendations[0];
            return {
                text: `PARKOLÁS: A legjobb lehetőség a ${item.name}. ${item.description}`,
                action: decision.action || { type: "navigate_to_parking" },
                confidence: typeof decision?.confidence === 'number' ? decision.confidence : 0.8
            };
        }
        return {
            text: "Segítek parkolni! Kőszeg belvárosa fizetős övezet. Kérlek írd meg a rendszámodat, vagy nézd meg a térképen a szabad helyeket.",
            action: decision.action || { type: "navigate_to_parking" },
            confidence: 0.8
        };
    }

    // ===============================
    // 3️⃣ EXPLICIT MATCH – ALWAYS OVERRIDE
    // ===============================
    if (
        decision &&
        decision.reasoning?.explicitMatch &&
        topRecommendations?.length > 0
    ) {
        const item = topRecommendations[0];
        return {
            text: buildExplicitResponse(item, persona),
            action: null,
            confidence: 1.0
        };
    }

    // ===============================
    // 4️⃣ HIGH CONFIDENCE → DETERMINISTIC (with humor & cross-links)
    // ===============================
    if (
        decision &&
        decision.confidence >= getThreshold(intent) &&
        topRecommendations?.length > 0
    ) {
        const best = topRecommendations[0];

        return {
            text: buildDeterministicResponse(best, decision, persona),
            action: decision.action || null,
            confidence: decision.confidence
        };
    }

    // ===============================
    // 4️⃣ LLM FALLBACK (SLIM CONTEXT)
    // ===============================
    const slimContext = buildSlimContext(context);

    const model = getModel({
        enableSearch: false,
        systemInstruction: SYSTEM_PROMPT
    });

    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || "" }]
    }));

    const prompt = `
AKTUÁLIS IDŐ: ${now}
PERSONA: ${persona}
DETEKTÁLT SZÁNDÉKOK: ${JSON.stringify(slimContext.allIntents)}

TUDÁSBÁZIS (EXTERN):
${slimContext.knowledge?.koszeg || ''}
${slimContext.knowledge?.kalandia || ''}

TOP AJÁNLÁSOK:
${JSON.stringify(slimContext.recommendations, null, 2)}

FELHASZNÁLÓI JELZÉSEK:
${JSON.stringify(slimContext.signals, null, 2)}

CONFIDENCE SZINT: ${decision?.confidence || 0}

INSTRUKCIÓK:
- Stílus: ${persona === 'tourist' ? 'Inspiráló idegenvezető' : 'Hatékony helyi segítő'}.
- SOHA ne találj ki adatot. CSAK a TOP AJÁNLÁSOK listájából válassz!
- Ha a keresett hely nincs a listában, ne próbáld kitalálni, inkább tegyél fel egyetlen konkrét pontosító kérdést.
- Ha a confidence alacsony, kérdezz vissza.
- ${persona === 'tourist' ? 'Dobj be egy apró kőszegi érdekességet a történelemből.' : 'Legyél lényegretörő.'}
- JSON-ben válaszolj.
`;

    const chat = model.startChat({ history: chatHistory });

    try {
        const result = await chat.sendMessage(prompt);
        const rawText = result.response.text();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return normalizeOutput(parsed, decision);
        }

        return fallbackText(rawText, decision);

    } catch (e) {
        console.warn('Response generation failed:', e);
        return {
            text: "Most nem vagyok teljesen biztos a legjobb választásban. Pontosítanál egy kicsit?",
            action: null,
            confidence: 0.3
        };
    }
}

/**
 * 4.0 - Explicit Response with Persona
 */
function buildExplicitResponse(item, persona) {
    const base = `${item.name} – ${item.details || item.description}`;
    if (persona === 'tourist') {
        return `Mesélek egy kicsit erről: ${base} Biztosan imádni fogod!`;
    }
    return `Itt vannak a részletek: ${base}`;
}

/**
 * 4.0 - Deterministic Response with Humor & Cross-links
 */
function buildDeterministicResponse(best, decision, persona) {
    const reasons = decision.reasoning || {};
    let text = "";

    // 1. Contextual Intro
    if (reasons.rainBoost) text = "Mivel most esik az eső, ezt javaslom: ";
    else if (reasons.rainPreferenceBoost) text = "Látom fedett helyet keresel, ezt javaslom: ";
    else if (reasons.heatBoost) text = "Ebben a nagy hőségben érdemes bemenekülni ide: ";
    else if (reasons.timeMatch) text = "Mivel kevés időd van, ezt ajánlom: ";
    else if (reasons.romanticBoost) text = "Ha romantikus hangulatban vagy, ezt nézd meg: ";
    else if (reasons.familyBoost) text = "Gyerekkkel ez egy biztos választás: ";
    else text = "Ezt ajánlom neked: ";

    text += `${best.name}. ${best.description} `;

    // 2. Cross-category Enrichment
    if (best.nearbyFood) {
        text += `Utána pedig beugorhatsz a közeli ${best.nearbyFood.name}-ba egy kávéra. `;
    }
    if (best.nearbyParking && persona === 'local') {
        text += `Parkolni a legkényelmesebben a ${best.nearbyParking.name}-nál tudsz. `;
    }

    // 3. Humor / Persona Flavor (Apple Style)
    if (persona === 'tourist' && Math.random() > 0.6) {
        const flavors = [
            "És ne feledd: ha 11-kor megszólal a harang, az Kőszegen a győzelem jele! 😉",
            "Szerintem le fog nyűgözni a város hangulata.",
            "Kőszeg tele van titkos történetekkel, ez csak az egyik közülük.",
            "Jó szívvel ajánlom, igazi kőszegi élmény lesz!"
        ];
        text += flavors[Math.floor(Math.random() * flavors.length)];
    }

    return text.trim();
}

/**
 * 4.0 - Basic Multi-day Itinerary skeleton
 */
function generateItineraryResponse(query, context) {
    // Simplified logic for now
    return {
        text: "Örömmel tervezek neked egy többnapos programot! Kezdj a Jurisics-várral, ebédelj a várnál, délután pedig egy séta a Csónakázó-tónál tökéletes lenne. Holnapra pedig...",
        action: null,
        confidence: 0.8
    };
}

function getThreshold(intent) {
    if (intent === 'parking') return 0.4;
    if (intent === 'emergency') return 0.4;
    if (intent === 'attractions') return 0.6;
    if (intent.includes('food')) return 0.6;
    if (intent === 'events') return 0.65;
    return 0.8;
}

function buildSlimContext(context) {
    const decision = context.decision;
    const topRecommendations = decision?.primaryRecommendations || [];

    return {
        recommendations: topRecommendations.slice(0, 5).map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            score: r.aiScore,
            tags: r.tags,
            location: r.location,
            mystery_box: !!(r.mystery_box && r.mystery_box.length > 0)
        })) || [],
        signals: decision?.signals || {},
        allIntents: context.allIntents || [],
        knowledge: context.knowledge || {}
    };
}

function normalizeOutput(parsed, decision) {
    if (!parsed.text) parsed.text = "Rendben!";
    if (!parsed.action) {
        // Only use deterministic action if LLM didn't provide one
        parsed.action = decision?.action || null;
    }
    if (typeof parsed.confidence !== 'number') parsed.confidence = decision?.confidence || 0.5;
    return parsed;
}

function fallbackText(rawText, decision) {
    return {
        text: rawText.replace(/```json|```/g, '').trim(),
        action: decision?.action || null,
        confidence: decision?.confidence || 0.5
    };
}
