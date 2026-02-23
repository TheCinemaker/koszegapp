/**
 * UNIVERSAL DECISION ENGINE for KőszegAI
 * Scores items based on weather, time, user profile, and linguistic signals.
 */

export function extractSignals(query) {
    const q = query.toLowerCase();
    return {
        romanticMode: /romantikus|pár|randi|szerelmes|kettesben/.test(q),
        hasChildren: /gyerek|család|kicsi|baba|ovis|iskolás/.test(q),
        isRainyQuery: /esik|eső|vizes|fedett|bent|benti/.test(q),
        timeConstraint: extractTimeConstraint(q)
    };
}

function extractTimeConstraint(q) {
    if (/1 óra|egy óra|kevés idő|gyorsan|sietünk/.test(q)) return 'short';
    if (/pár óra|3 óra|fél nap|délelőtt|délután/.test(q)) return 'medium';
    if (/egész nap|hosszú|túra|kirándulás/.test(q)) return 'long';
    return null;
}

export function detectExplicitMatch(query, list) {
    if (!list) return null;
    const q = query.toLowerCase();
    return list.find(item =>
        q.includes(item.name.toLowerCase()) ||
        (item.tags && item.tags.some(tag => q.includes(tag.toLowerCase())))
    );
}

export function calculateConfidence(list) {
    if (!list || list.length === 0) return 0;
    const best = list[0].aiScore;
    if (list.length === 1) return Math.min(1, best / 10);

    // Improved: Combine relative difference and absolute quality
    const absoluteQuality = best;
    const relativeDiff = best - list[1].aiScore;

    // (relativeDiff / 10) * (absoluteQuality / 10) - scaled
    return Math.min(1, Math.max(0.1, (relativeDiff / 10) * (absoluteQuality / 10)));
}

export function scoreItem(item, context) {
    let score = item.priority || 5;
    const reasons = {
        rainBoost: false,
        rainPreferenceBoost: false,
        rainPenalty: false,
        familyBoost: false,
        romanticBoost: false,
        timeMatch: false,
        lateNightPenalty: false,
        memoryRomanticBoost: false,
        memoryFamilyBoost: false,
        memoryIndoorBoost: false,
        heatBoost: false,
        stormPenalty: false,
        personaTouristBoost: false,
        personaLocalBoost: false
    };

    const { weather, hour, userProfile, signals, aiProfile, persona } = context;

    // 1. Weather Logic (Nuanced: Actual vs User Preference + Extreme conditions)
    const rainStatus = weather?.raining ? "actual" : signals?.isRainyQuery ? "preference" : null;

    if (weather?.condition === "storm") {
        if (!item.indoor && !item.rainSafe) {
            score -= 15;
            reasons.stormPenalty = true;
        }
    }

    if (weather?.temp > 30 && item.indoor) {
        score += 4;
        reasons.heatBoost = true;
    }

    if (rainStatus === "actual") {
        if (item.rainSafe || item.indoor) {
            score += 6;
            reasons.rainBoost = true;
        } else {
            score -= 8;
            reasons.rainPenalty = true;
        }
    } else if (rainStatus === "preference") {
        if (item.rainSafe || item.indoor) {
            score += 4;
            reasons.rainPreferenceBoost = true;
        }
    }

    // 2. Family Friendly (+ Profile/Memory Boost)
    const isFamilyQuery = (userProfile?.card_type === 'family' || signals?.hasChildren);
    if (isFamilyQuery && item.childFriendly) {
        score += 5;
        reasons.familyBoost = true;
    } else if (aiProfile?.family_score > 5 && item.childFriendly) {
        score += 3;
        reasons.memoryFamilyBoost = true;
    }

    // 3. Romantic Mode (+ Memory Boost)
    if (signals?.romanticMode && item.romantic >= 7) {
        score += 5;
        reasons.romanticBoost = true;
    } else if (aiProfile?.romantic_score > 5 && item.romantic >= 7) {
        score += 3;
        reasons.memoryRomanticBoost = true;
    }

    // 4. Time Constraint / Duration
    if (signals?.timeConstraint) {
        if (item.duration === signals.timeConstraint) {
            score += 8;
            reasons.timeMatch = true;
        } else if (signals.timeConstraint === 'short' && item.duration === 'long') {
            score -= 10;
        }
    }

    // 5. Time-of-day awareness
    if (hour >= 20 && !item.indoor && !item.rainSafe) {
        score -= 5;
        reasons.lateNightPenalty = true;
    }

    // 6. Walking Distance (if center)
    if (typeof item.walkingDistanceFromCenter === 'number' && item.walkingDistanceFromCenter <= 5) {
        score += 2;
    }

    // 6. Persona-driven scoring (Brutal Intelligence)
    if (persona === 'tourist' && item.priority >= 8) {
        score += 3;
        reasons.personaTouristBoost = true;
    }
    if (persona === 'local' && (item.walkingDistanceFromCenter <= 3 || item.type === 'service')) {
        score += 3;
        reasons.personaLocalBoost = true;
    }

    // 7. Memory: Indoor preference
    if (aiProfile?.indoor_preference > 7 && item.indoor) {
        score += 4;
        reasons.memoryIndoorBoost = true;
    }

    // 💰 PARTNER TIER BOOST (Sales Strategy)
    if (item.tier === 'gold') {
        score += 10;
        reasons.tierGoldBoost = true;
    } else if (item.tier === 'silver') {
        score += 5;
        reasons.tierSilverBoost = true;
    }

    // 🎁 MYSTERY BOX BOOST
    if (item.mystery_box && item.mystery_box.length > 0) {
        score += 7;
        reasons.mysteryBoxBoost = true;
    }

    return { score, reasons };
}

export function decideAction({ intents, query, context }) {
    if (!Array.isArray(intents)) intents = [intents];

    const { appData, weather, appMode, userProfile, aiProfile, persona, sessionMemory } = context;
    const signals = extractSignals(query);
    const hour = new Date().getHours();

    const scoringContext = { weather, hour, userProfile, signals, aiProfile, persona };

    // 🧠 SESSION REFERRAL RESOLUTION
    const sessionReferral = resolveSessionReferral(query, sessionMemory);
    if (sessionReferral) {
        const { score, reasons } = scoreItem(sessionReferral, scoringContext);
        return {
            action: null,
            intent: sessionReferral.type === 'attraction' ? 'attraction_detail' : 'restaurant_detail',
            topRecommendations: [{ ...sessionReferral, aiScore: score, aiReasons: reasons }],
            confidence: 1.0,
            signals,
            reasoning: { ...reasons, explicitMatch: true, sessionReferral: true },
            persona
        };
    }

    const processList = (list) => {
        if (!list) return [];
        return list.map(item => {
            const { score, reasons } = scoreItem(item, scoringContext);
            return { ...item, aiScore: score, aiReasons: reasons };
        }).sort((a, b) => b.aiScore - a.aiScore);
    };

    const findClosest = (source, targetList) => {
        if (!source.coordinates || !targetList) return null;
        return targetList
            .map(t => ({ ...t, dist: calculateDistance(source.coordinates, t.coordinates) }))
            .sort((a, b) => a.dist - b.dist)[0];
    };

    const results = [];

    // Process each intent
    for (const intent of intents) {
        // 0. EXPLICIT MATCH (Special case per intent)
        if (intent === 'attractions' || intent === 'food_general') {
            const list = intent === 'attractions' ? appData.attractions : appData.restaurants;
            const explicit = detectExplicitMatch(query, list);
            if (explicit) {
                const { score, reasons } = scoreItem(explicit, scoringContext);
                results.push({
                    type: 'explicit',
                    intent: intent === 'attractions' ? 'attraction_detail' : 'restaurant_detail',
                    item: { ...explicit, aiScore: score, aiReasons: reasons }
                });
                continue;
            }
        }

        // 1. FOOD LOGIC
        if (intent.includes('food')) {
            const scored = processList(appData.restaurants);
            const confidence = calculateConfidence(scored);
            results.push({
                type: 'recommendation',
                intent: appMode === 'remote' ? 'food_planning' : 'food_place',
                scored,
                confidence,
                action: (appMode !== 'remote' && confidence > 0.6)
                    ? { type: "navigate_to_restaurants", params: { filter: "food", bestMatch: scored[0]?.id } }
                    : null
            });
        }

        // 2. ATTRACTIONS LOGIC
        if (intent === 'attractions') {
            const scored = processList(appData.attractions);
            const confidence = calculateConfidence(scored);
            results.push({
                type: 'recommendation',
                intent: appMode === 'remote' ? 'attractions_planning' : 'attractions',
                scored,
                confidence,
                action: (appMode !== 'remote' && confidence > 0.7)
                    ? { type: "navigate_to_attractions", params: { bestMatch: scored[0]?.id } }
                    : null
            });
        }

        // 3. EVENTS LOGIC
        if (intent === 'events') {
            const scored = processList(appData.events);
            const confidence = calculateConfidence(scored);
            results.push({
                type: 'recommendation',
                intent: appMode === 'remote' ? 'events_planning' : 'events',
                scored,
                confidence,
                action: (appMode !== 'remote' && confidence > 0.75)
                    ? { type: "navigate_to_events", params: { bestMatch: scored[0]?.id } }
                    : null
            });
        }

        // 4. PARKING LOGIC
        if (intent === 'parking') {
            const scored = processList(appData.parking);
            const confidence = calculateConfidence(scored);
            results.push({
                type: 'recommendation',
                intent: 'parking',
                scored,
                confidence,
                action: (appMode !== 'remote' && confidence > 0.5)
                    ? { type: "navigate_to_parking", params: { bestMatch: scored[0]?.id } }
                    : null
            });
        }
    }

    // Merge results into one composite decision
    if (results.length === 0) return { action: null, intent: intents[0], intents, signals, persona };

    // Simple priority: explicit > first intent
    const primary = results.find(r => r.type === 'explicit') || results[0];

    const compositeRecommendations = results.flatMap(r => r.scored || [r.item]).slice(0, 5);

    // Cross-enrich the best recommendation
    const best = compositeRecommendations[0];
    if (best) {
        best.nearbyFood = best.nearbyFood || findClosest(best, appData.restaurants);
        best.nearbyParking = best.nearbyParking || findClosest(best, appData.parking);
    }

    return {
        action: primary.action || null,
        intent: primary.intent,
        intents: results.map(r => r.intent), // List of all resolved intents
        topRecommendations: compositeRecommendations,
        confidence: primary.confidence || 1.0,
        signals,
        reasoning: best?.aiReasons,
        persona
    };
}

function resolveSessionReferral(query, sessionMemory) {
    if (!sessionMemory || sessionMemory.length === 0) return null;
    const q = query.toLowerCase();

    // 1. Ordinals
    if (/első|1\.|legelső/.test(q)) return sessionMemory[0];
    if (/második|2\./.test(q)) return sessionMemory[1];
    if (/harmadik|3\./.test(q)) return sessionMemory[2];
    if (/utolsó/.test(q)) return sessionMemory[sessionMemory.length - 1];

    // 2. Trait-based referral (e.g., "az a romantikus")
    if (/romantikus/.test(q)) {
        return sessionMemory.find(item => item.aiReasons?.romanticBoost || item.romantic >= 7);
    }
    if (/gyerek|család/.test(q)) {
        return sessionMemory.find(item => item.aiReasons?.familyBoost || item.childFriendly);
    }
    if (/fedett|benti|eső/.test(q)) {
        return sessionMemory.find(item => item.aiReasons?.rainBoost || item.indoor);
    }

    return null;
}

/**
 * Haversine Formula for precise distance
 */
function calculateDistance(c1, c2) {
    if (!c1 || !c2 || !c1.lat || !c2.lat) return 99999;
    const R = 6371; // Earth radius in km
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLon = (c2.lng - c1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
