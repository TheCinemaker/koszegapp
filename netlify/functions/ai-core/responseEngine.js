import { getModel } from './modelRouter.js';
import { SYSTEM_PROMPT } from './prompts.js';

/**
 * RESPONSE ENGINE 5.0 (KőszegAI Brain)
 * - Smalltalk fast path (no web search, no data context needed)
 * - Multi-intent LLM orchestration with full data context
 * - Anti-hallucination: LLM only has real data to reference
 */
export async function generateResponse({ intent, query, context, history }) {

    const decision = context.decision || null;
    const now = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });
    const allIntents = context.allIntents || [intent];

    // ===============================
    // FAST PATH: Smalltalk & simple conversation
    // Web search + startChat combo breaks Gemini API - handle separately
    // ===============================
    if (intent === 'smalltalk' || (intent === 'unknown' && allIntents.length <= 1)) {
        return generateSmallTalk({ query, history, now });
    }

    // ===============================
    // MAIN PATH: LLM with full context (multi-intent orchestration)
    // ===============================
    const slimContext = buildSlimContext(context);

    // Only enable web search for truly external unknown queries (not for known intents)
    const hasRecommendations = decision?.primaryRecommendations?.length > 0;
    const needsWebSearch = intent === 'unknown' && !hasRecommendations;

    const model = getModel({
        enableSearch: needsWebSearch,
        systemInstruction: SYSTEM_PROMPT
    });

    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || "" }]
    }));

    const prompt = buildPrompt({ now, allIntents, slimContext, decision, query });

    const chat = model.startChat({ history: chatHistory });

    try {
        const result = await chat.sendMessage(prompt);
        const rawText = result.response.text();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return normalizeOutput(parsed, decision);
            } catch (_) {
                return fallbackText(rawText, decision);
            }
        }

        return fallbackText(rawText, decision);

    } catch (e) {
        console.warn('Response generation failed:', e.message);
        return {
            text: "Hmm, most nem tudok választ adni. Kérdezz rá másképp, segítek!",
            action: null,
            confidence: 0.3
        };
    }
}

/**
 * Fast path for greetings and basic conversation
 * Uses minimal prompt, no data context, no web search
 */
async function generateSmallTalk({ query, history, now }) {
    const model = getModel({ enableSearch: false, systemInstruction: SYSTEM_PROMPT });

    const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }]
    }));

    const simplePrompt = `AKTUÁLIS IDŐ: ${now}

A felhasználó üzenete: "${query}"

Ez egy egyszerű köszönés vagy általános kérdés. Válaszolj természetesen, barátságosan, magyarul – ahogy egy kőszegi barát tenné. Ha köszön, köszönj vissza és kérdezd meg mivel segíthetsz Kőszegen. MAX 2 mondat.

Válaszolj KIZÁRÓLAG ebben a JSON formátumban:
{"text": "...", "action": null, "confidence": 1.0}`;

    try {
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(simplePrompt);
        const rawText = result.response.text();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch (_) { }
        }
        // If LLM returns plain text, use it directly
        return { text: rawText.replace(/```json|```/g, '').trim(), action: null, confidence: 0.9 };
    } catch (e) {
        console.warn('Smalltalk generation failed:', e.message);
        return { text: 'Szia! Miben segíthetek Kőszegen? 😊', action: null, confidence: 0.8 };
    }
}

/**
 * Builds the main LLM prompt with full data context
 */
function buildPrompt({ now, allIntents, slimContext, decision, query }) {
    const vehicleList = slimContext.userVehicles?.length > 0
        ? slimContext.userVehicles.map(v =>
            `  - ${v.license_plate}${v.nickname ? ` (${v.nickname})` : ''}${v.is_default ? ' ✓ alapértelmezett' : ''}${v.carrier ? `, előhívó: ${v.carrier}` : ''}`
        ).join('\n')
        : '  (nincs mentett autó)';

    const dataSection = buildDataSection(slimContext);

    return `
AKTUÁLIS IDŐ: ${now}
PERSONA: ${slimContext.persona || 'hybrid'}
DETEKTÁLT SZÁNDÉKOK (prioritás szerint): ${allIntents.join(' → ')}

━━━ FELHASZNÁLÓ AUTÓI ━━━
${vehicleList}

━━━ TOP AJÁNLÁSOK (előre szűrt és pontozva) ━━━
${JSON.stringify(slimContext.recommendations?.slice(0, 5), null, 2)}

━━━ TELJES ADAT-KONTEXTUS ━━━
${dataSection}

━━━ TUDÁSBÁZIS ━━━
${slimContext.knowledge?.koszeg ? slimContext.knowledge.koszeg.substring(0, 1500) : ''}

━━━ JELZÉSEK ━━━
${JSON.stringify(slimContext.signals, null, 2)}

INSTRUKCIÓK:
- PRIORITÁS SORREND: ${allIntents.join(' > ')}
- Ha parkolás van a szándékok között ÉS fizetős az idő: ELŐSZÖR intézd el a parkolást (kérd a rendszámot ha kell), AZTÁN ajánlj látnivalót/éttermet
- SOHA ne találj ki helyet! Csak a fenti ADAT-KONTEXTUSBÓL ajánlj
- Ha nincs meg az adat a listában, mondd: "Erről pontos infóm nincs, de ajánlom helyette: [létező hely]"
- Válaszolj KIZÁRÓLAG JSON-ban: {"text": "...", "action": {...} | null, "confidence": 0.0-1.0}
`;
}

/**
 * Builds a concise data section from all available context categories
 */
function buildDataSection(slimContext) {
    const sections = [];

    if (slimContext.restaurants?.length > 0) {
        sections.push(`ÉTTERMEK/KÁVÉZÓK (${slimContext.restaurants.length} db):\n` +
            slimContext.restaurants.slice(0, 20).map(r =>
                `  - ${r.name} | ${r.type || ''} | ${(r.tags || []).join(', ')} | ${r.address || ''}`
            ).join('\n')
        );
    }

    if (slimContext.attractions?.length > 0) {
        sections.push(`LÁTNIVALÓK (${slimContext.attractions.length} db):\n` +
            slimContext.attractions.slice(0, 10).map(a =>
                `  - ${a.name} | ${(a.description || '').substring(0, 80)}`
            ).join('\n')
        );
    }

    if (slimContext.events?.length > 0) {
        sections.push(`KÖZELGŐ PROGRAMOK:\n` +
            slimContext.events.slice(0, 5).map(e =>
                `  - ${e.name} | ${e.date} ${e.time || ''} | ${e.location || ''}`
            ).join('\n')
        );
    }

    if (slimContext.parking?.length > 0) {
        sections.push(`PARKOLÓK:\n` +
            slimContext.parking.slice(0, 5).map(p =>
                `  - ${p.name} | Zóna: ${p.zone || '?'} | ${p.description || ''}`
            ).join('\n')
        );
    }

    if (slimContext.leisure?.length > 0) {
        sections.push(`SZABADIDŐ/SÉTA:\n` +
            slimContext.leisure.slice(0, 5).map(l =>
                `  - ${l.name} | ${(l.description || '').substring(0, 60)}`
            ).join('\n')
        );
    }

    return sections.length > 0 ? sections.join('\n\n') : '(nincs betöltött adat)';
}

/**
 * Builds slim context with ALL available data categories
 */
function buildSlimContext(context) {
    const decision = context.decision;
    const topRecommendations = decision?.primaryRecommendations || [];
    const appData = context.appData || {};

    return {
        recommendations: topRecommendations.slice(0, 5).map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            description: r.description,
            score: r.aiScore,
            tags: r.tags,
            address: r.address,
            phone: r.phone,
        })),
        restaurants: appData.restaurants || [],
        attractions: appData.attractions || [],
        events: appData.events || [],
        parking: appData.parking || [],
        hotels: appData.hotels || [],
        leisure: appData.leisure || [],
        info: appData.info || [],
        userVehicles: context.userVehicles || [],
        userProfile: context.userProfile || null,
        signals: decision?.signals || {},
        allIntents: context.allIntents || [],
        knowledge: context.knowledge || {},
        persona: decision?.persona || context.persona || 'hybrid'
    };
}

function normalizeOutput(parsed, decision) {
    if (!parsed.text) parsed.text = "Rendben!";
    if (parsed.action === undefined) {
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
