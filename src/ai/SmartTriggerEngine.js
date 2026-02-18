/**
 * ❤️ SmartTriggerEngine - The Brain of the Proactive Layer
 * Updated for Multi-Mode Intelligence
 */

import { getAppMode } from "../core/ContextEngine";

export function getSmartTrigger({
    location,       // { lat, lng }
    hour,           // 0-23
    weather,        // { temp, condition, isRainy }
    events,         // [ { name, start_time, ... } ]
    lastShown,      // timestamp
    userBehavior    // { ignoredDinner: boolean, ... }
}) {

    const now = Date.now();
    // Throttling: 2 hours global cooldown for ANY proactive message
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    if (lastShown && now - lastShown < TWO_HOURS) return null;

    const mode = getAppMode(location);
    console.log("🧠 Context Mode:", mode);

    // --- MODE 1: REMOTE (Planning) ---
    if (mode === 'remote') {
        // Only suggest if we haven't ignored planning
        if (!userBehavior?.ignoredPlanning) {
            return {
                id: "remote_planning",
                type: "planning",
                text: "✨ Tervezed a látogatást Kőszegen? Megmutassam a közelgő programokat?",
                action: "navigate_to_events",
                priority: 5
            };
        }
        return null;
    }

    // --- MODE 2: APPROACHING (Transition) ---
    if (mode === 'approaching') {
        if (!userBehavior?.ignoredParking) {
            return {
                id: "approaching_parking",
                type: "parking",
                text: "🚗 Úton Kőszeg felé? Segítsek parkolót találni?",
                action: "navigate_to_parking",
                priority: 8
            };
        }
        return null;
    }

    // --- MODE 3: CITY (Full Intelligence) ---
    if (mode === 'city') {
        // Constants for logic
        const isDinnerTime = hour >= 18 && hour <= 20;
        const isLunchTime = hour >= 12 && hour <= 14;

        // --- SCENARIO A: DINNER NUDGE ---
        if (isDinnerTime && !userBehavior?.ignoredDinner) {
            return {
                id: "dinner_nudge",
                type: "food",
                text: "🍷 Vacsoraidő van a Fő téren. Mutassak egy hangulatos éttermet?",
                action: "navigate_to_food",
                priority: 10
            };
        }

        // --- SCENARIO B: LUNCH NUDGE ---
        if (isLunchTime && !userBehavior?.ignoredLunch) {
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
    }

    return null;
}
