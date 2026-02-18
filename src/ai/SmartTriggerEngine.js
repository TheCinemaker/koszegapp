import { getAppMode } from "../core/ContextEngine";

const MIN_SCORE = 60; // Increased threshold for "Silence Optimization"
const GLOBAL_THROTTLE = 2 * 60 * 60 * 1000;

export function getSmartTrigger({
    location,
    velocity, // { speed: 0, movement: 'stationary' }
    hour,
    weather,
    events,
    lastShown,
    userBehavior,
    userProfile // { foodInterest: 10, eventInterest: 5 ... }
}) {

    const now = Date.now();

    if (lastShown && now - lastShown < GLOBAL_THROTTLE) return null;

    const mode = getAppMode(location);
    const candidates = [];

    // Helper: Normalize inputs to 0-1 scale
    const normalize = (val, max) => Math.min(1, Math.max(0, val / max));

    // ===============================
    // SCORING ENGINE 2.0 (WEIGHTED)
    // ===============================
    // Formula: score = time * 0.3 + movement * 0.2 + density * 0.2 + interest * 0.3

    const calculateScore = ({ timeScore, interestScore, specialBoost = 0 }) => {
        // Weights
        const W_TIME = 0.35;
        const W_MOVE = 0.20;
        const W_INT = 0.30;
        const W_CTX = 0.15; // Weather, Location Density, etc.

        // Movement Score (1.0 = best state for interaction, e.g. walking/stationary. 0.0 = driving)
        let moveScore = 1.0;
        if (velocity?.movement === 'car') moveScore = 0.1;
        if (velocity?.movement === 'bike') moveScore = 0.4;
        if (velocity?.movement === 'fast') moveScore = 0.0; // Don't bother if running/driving fast

        // Context Score base
        let ctxScore = 0.5;
        if (weather?.isRainy) ctxScore += 0.4; // Rain makes app more useful? Or less? Depends on trigger.

        // Final weighted sum (Result is 0-1)
        let rawScore = (timeScore * W_TIME) + (moveScore * W_MOVE) + (interestScore * W_INT) + (ctxScore * W_CTX);

        // Scale to 0-100 and add boosts
        let finalScore = (rawScore * 100) + specialBoost;

        return Math.round(finalScore);
    };

    // ===============================
    // CITY MODE
    // ===============================
    if (mode === 'city') {

        // 🍽️ DINNER RECOMMENDATION
        if (hour >= 17 && hour <= 21) {
            // Time Score: Bell curve peaking at 19:00
            const minutesFromPeak = Math.abs((hour * 60) - (19 * 60));
            // 0 mins = 1.0, 120 mins = 0.0
            const timeScore = Math.max(0, 1 - (minutesFromPeak / 120));

            const interestScore = normalize(userProfile?.foodInterest || 5, 20); // Assume max interest is ~20
            const behaviorPenalty = userBehavior?.ignoredDinner ? -20 : 0;

            const score = calculateScore({
                timeScore,
                interestScore,
                specialBoost: behaviorPenalty
            });

            candidates.push({
                id: "dinner",
                type: "food",
                text: "Vacsoraidő van. Mutassak egy igazán jó helyet a közelben?",
                action: "navigate_to_food",
                priority: score
            });
        }

        // � UPCOMING EVENTS
        if (events?.length > 0) {
            // Sort by closeness
            const closest = events
                .map(e => ({ ...e, diff: (new Date(e.start_time || e.date).getTime() - now) / 60000 }))
                .filter(e => e.diff > 0 && e.diff < 180) // Next 3 hours
                .sort((a, b) => a.diff - b.diff)[0];

            if (closest) {
                // Time Score: Closer = Higher. 0 mins = 1.0, 180 mins = 0.0
                const timeScore = Math.max(0, 1 - (closest.diff / 180));
                const interestScore = normalize(userProfile?.eventInterest || 5, 20);
                const behaviorPenalty = userBehavior?.ignoredEvents ? -20 : 0;

                const score = calculateScore({
                    timeScore,
                    interestScore,
                    specialBoost: behaviorPenalty + 10 // Events get a +10 base boost for urgency
                });

                candidates.push({
                    id: `event_${closest.id}`,
                    type: "event",
                    text: `"${closest.name}" hamarosan kezdődik.`,
                    action: "navigate_to_events",
                    priority: score
                });
            }
        }

        // ☔ RAIN MODE
        if (weather?.isRainy) {
            const interestScore = normalize(userProfile?.attractionInterest || 5, 20);
            const behaviorPenalty = userBehavior?.ignoredRain ? -20 : 0;
            // Rain has no specific "time", so we give it a flat high time score if it IS raining
            const score = calculateScore({
                timeScore: 0.9,
                interestScore,
                specialBoost: behaviorPenalty
            });

            candidates.push({
                id: "rain",
                type: "attraction",
                text: "Esik az eső. Mutassak fedett programokat?",
                action: "navigate_to_attractions",
                priority: score
            });
        }
    }

    // ===============================
    // REMOTE MODE
    // ===============================
    if (mode === 'remote') {
        const hasTravelIntent = userBehavior?.travelIntent;

        if (hasTravelIntent) {
            const interestScore = normalize(userProfile?.eventInterest || 5, 20);
            // Planning score depends less on specific time of day, more on "evening planning" maybe?
            // Let's assume generic validity
            const score = calculateScore({
                timeScore: 0.6,
                interestScore,
                specialBoost: 5 // Base boost for intent
            });

            candidates.push({
                id: "planning",
                type: "planning",
                text: "Megmutassam a közelgő programokat Kőszegen?",
                action: "navigate_to_events",
                priority: score
            });
        }
    }

    // ===============================
    // SELECTION
    // ===============================
    if (candidates.length === 0) return null;

    const best = candidates.sort((a, b) => b.priority - a.priority)[0];

    console.log(`🧠 SmartTrigger 2.0: Winning Candidate: ${best.id} (Score: ${best.priority}) Threshold: ${MIN_SCORE}`);

    if (best.priority < MIN_SCORE) {
        console.log("🤫 Silenced by Silence Optimization Threshold");
        return null;
    }

    return best;
}
