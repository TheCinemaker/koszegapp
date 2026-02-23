import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

/**
 * RESPONSE ENGINE 4.0 (Urban Brain)
 * persona-aware, deterministic override, cross-linked, humor-enhanced
 */
export async function generateResponse({ intent, query, context, history }) {

    const decision = context.decision || null;
    const persona = decision?.persona || 'hybrid';
    const now = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });

    // ===============================
    // 1️⃣ ITINERARY LOGIC – CUSTOM GENERATION
    // ===============================
    if (intent === 'itinerary') {
        return generateItineraryResponse(query, context);
    }

    // ===============================
    // 2️⃣ EXPLICIT MATCH – ALWAYS OVERRIDE
    // ===============================
    if (
        decision &&
        decision.reasoning?.explicitMatch &&
        decision.topRecommendations?.length > 0
    ) {
        const item = decision.topRecommendations[0];
        return {
            text: buildExplicitResponse(item, persona),
            action: null,
            confidence: 1.0
        };
    }

    // ===============================
    // 3️⃣ HIGH CONFIDENCE → DETERMINISTIC (with humor & cross-links)
    // ===============================
    if (
        decision &&
        decision.confidence >= getThreshold(intent) &&
        decision.topRecommendations?.length > 0
    ) {
        const best = decision.topRecommendations[0];

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
- Csak a TOP ajánlásokat használd.
- Ha a confidence alacsony, kérdezz vissza.
- ${persona === 'tourist' ? 'Dobj be egy apró kőszegi érdekességet (harangozás, Jurisics legenda stb.).' : 'Legyél lényegretörő.'}
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
    else if (reasons.romanticBoost) text = "Ha romantikus hangulatban vagytok, ezt nézzétek meg: ";
    else if (reasons.familyBoost) text = "Gyerekkkel ez egy biztos választás: ";
    else text = "Ezt ajánlom neked: ";

    text += `${best.name}. ${best.description} `;

    // 2. Cross-category Enrichment
    if (best.nearbyFood) {
        text += `Utána pedig beugorhattok a közeli ${best.nearbyFood.name}-ba egy kávéra. `;
    }
    if (best.nearbyParking && persona === 'local') {
        text += `Parkolni a legkényelmesebben a ${best.nearbyParking.name}-nál tudsz. `;
    }

    // 3. Humor / Persona Flavor
    if (persona === 'tourist' && decision.confidence > 0.85) {
        text += " És ha 11-kor megszólal a harang, az nem véletlen, az is nektek szól 😉";
    }

    return text.trim();
}

/**
 * 4.0 - Basic Multi-day Itinerary skeleton
 */
function generateItineraryResponse(query, context) {
    // Simplified logic for now
    return {
        text: "Örömmel tervezek neked egy többnapos programot! Kezdjétek a Jurisics-várral, ebédeljetek a várnál, délután pedig egy séta a Csónakázó-tónál tökéletes lenne. Holnapra pedig...",
        action: null,
        confidence: 0.8
    };
}

function getThreshold(intent) {
    return 0.9; // Higher threshold to favor LLM's natural tone
}

function buildSlimContext(context) {
    const decision = context.decision;
    return {
        recommendations: decision?.topRecommendations?.slice(0, 10).map(r => ({
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
    if (!parsed.confidence) parsed.confidence = decision?.confidence || 0.5;
    return parsed;
}

function fallbackText(rawText, decision) {
    return {
        text: rawText.replace(/```json|```/g, '').trim(),
        action: decision?.action || null,
        confidence: decision?.confidence || 0.5
    };
}
