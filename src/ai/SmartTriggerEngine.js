/**
 * ❤️ SmartTriggerEngine - The Brain of the Proactive Layer
 * 
 * Deterministic, zero-latency logic to decide IF and WHAT the AI should suggest.
 * No LLM calls. Pure logic.
 */

export function getSmartTrigger({
    location,       // { lat, lng, distanceToMainSquare }
    hour,           // 0-23
    weather,        // { temp, condition, isRainy }
    events,         // [ { name, start_time, ... } ]
    lastShown,      // timestamp
    userBehavior    // { ignoredDinner: boolean, ... }
}) {

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // 1. Global Cooldown (Don't spam)
    if (lastShown && now - lastShown < ONE_HOUR) return null;

    // 2. Constants for logic
    const isDinnerTime = hour >= 18 && hour <= 20;
    const isLunchTime = hour >= 12 && hour <= 14;

    // location.distanceToMainSquare is in meters. 
    // Assumption: Main Square is at ~47.388, 16.542
    const isNearMainSquare = location?.distanceToMainSquare < 500; // 500m radius

    // --- SCENARIO A: DINNER NUDGE ---
    if (isDinnerTime && isNearMainSquare && !userBehavior?.ignoredDinner) {
        return {
            id: "dinner_nudge",
            type: "food",
            text: "🍷 Vacsoraidő van a Fő téren. Mutassak egy hangulatos éttermet?",
            action: "navigate_to_food",
            priority: 10
        };
    }

    // --- SCENARIO B: LUNCH NUDGE ---
    if (isLunchTime && isNearMainSquare && !userBehavior?.ignoredLunch) {
        return {
            id: "lunch_nudge",
            type: "food",
            text: "🍽️ Ebédidő! Ismersz jó helyet a közelben?",
            action: "navigate_to_food",
            priority: 8
        };
    }

    // --- SCENARIO C: UPCOMING EVENT ---
    if (events && events.length > 0) {
        const upcomingEvent = events.find(e => {
            const start = new Date(e.start_time || e.date).getTime();
            const diffMinutes = (start - now) / (1000 * 60);
            return diffMinutes > 0 && diffMinutes <= 60; // Starts in 1 hour
        });

        if (upcomingEvent) {
            return {
                id: `event_${upcomingEvent.id}`,
                type: "event",
                text: `🎵 "${upcomingEvent.name}" hamarosan kezdődik (kb. ${Math.ceil((new Date(upcomingEvent.start_time || upcomingEvent.date) - now) / 60000)} perc).`,
                action: "navigate_to_events",
                priority: 20 // High priority
            };
        }
    }

    // --- SCENARIO D: RAIN ---
    if (weather?.isRainy && !userBehavior?.ignoredRain) {
        return {
            id: "rain_program",
            type: "attraction",
            text: "🌧️ Borús idő van. Mutassak beltéri programokat?",
            action: "navigate_to_attractions",
            priority: 5
        };
    }

    return null;
}
