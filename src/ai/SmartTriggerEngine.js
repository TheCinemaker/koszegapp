import { getAppMode } from "../core/ContextEngine";

const MIN_SCORE = 15;
const GLOBAL_THROTTLE = 2 * 60 * 60 * 1000;

export function getSmartTrigger({
    location,
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

    // Interest Boost Calculation (Max +5 boost)
    const getBoost = (interest) => Math.min(5, (interest || 0) / 5);

    // ===============================
    // CITY MODE (REAL EXPERIENCE)
    // ===============================
    if (mode === 'city') {

        // 🔥 DINNER
        if (hour >= 17 && hour <= 21) {

            const minutesFromPeak = Math.abs((hour * 60) - (19 * 60));
            const timeWeight = Math.max(0, 12 - Math.floor(minutesFromPeak / 8));
            const behaviorPenalty = userBehavior?.ignoredDinner ? -8 : 0;
            const interestBoost = getBoost(userProfile?.foodInterest);

            const score = 20 + timeWeight + interestBoost + behaviorPenalty;

            candidates.push({
                id: "dinner",
                type: "food",
                text: "Vacsoraidő van. Mutassak egy igazán jó helyet a közelben?",
                action: "navigate_to_food",
                priority: score
            });
        }

        // 🔥 UPCOMING EVENTS
        if (events?.length > 0) {

            const enriched = events
                .map(e => {
                    const start = new Date(e.start_time || e.date).getTime();
                    const diff = (start - now) / (1000 * 60);
                    return { ...e, diff };
                })
                .filter(e => e.diff > 0 && e.diff <= 180)
                .sort((a, b) => a.diff - b.diff);

            if (enriched.length > 0) {

                const e = enriched[0];
                const urgency = Math.max(0, 40 - e.diff);
                const behaviorPenalty = userBehavior?.ignoredEvents ? -10 : 0;
                const interestBoost = getBoost(userProfile?.eventInterest);

                const score = 25 + urgency + interestBoost + behaviorPenalty;

                candidates.push({
                    id: `event_${e.id}`,
                    type: "event",
                    text: `"${e.name}" hamarosan kezdődik.`,
                    action: "navigate_to_events",
                    priority: score
                });
            }
        }

        // 🔥 RAIN INTELLIGENCE
        if (weather?.isRainy) {

            const behaviorPenalty = userBehavior?.ignoredRain ? -6 : 0;
            const interestBoost = getBoost(userProfile?.attractionInterest);

            candidates.push({
                id: "rain",
                type: "attraction",
                text: "Esik az eső. Mutassak fedett programokat?",
                action: "navigate_to_attractions",
                priority: 18 + interestBoost + behaviorPenalty
            });
        }
    }

    // ===============================
    // REMOTE MODE (PLANNING)
    // ===============================
    if (mode === 'remote') {

        // Only trigger remote planning if user explicitly shows travel intent
        // (learned from conversation history via Behavior Engine)
        if (!userBehavior?.travelIntent) {
            return null;
        }

        const scoreBase = 18; // Increased priority for explicitly interested users
        // Boost if user is interested in events
        const interestBoost = getBoost(userProfile?.eventInterest);

        candidates.push({
            id: "planning",
            type: "planning",
            text: "Megmutassam a közelgő programokat Kőszegen?",
            action: "navigate_to_events",
            priority: scoreBase + interestBoost
        });
    }

    // ===============================
    // PRIORITY SORT
    // ===============================
    if (candidates.length === 0) return null;

    const best = candidates.sort((a, b) => b.priority - a.priority)[0];

    console.log(`🏆 Winning Trigger: ${best?.id} (Score: ${best?.priority}) vs Min: ${MIN_SCORE}`);

    if (best.priority < MIN_SCORE) {
        console.log("🤫 Silenced by Apple Threshold");
        return null;
    }

    return best;
}
