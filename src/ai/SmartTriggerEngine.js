/**
 * ❤️ SmartTriggerEngine 3.0 - Apple Intelligence Level
 * 
 * deterministic
 * dynamic scoring
 * weighted
 * threshold-based
 * contextual
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
    // Global Throttling: 2 hours between ANY proactive trigger
    const THROTTLE_TIME = 2 * 60 * 60 * 1000;

    if (lastShown && now - lastShown < THROTTLE_TIME) return null;

    const mode = getAppMode(location);
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    console.log(`🧠 SmartEngine 3.0 | Mode: ${mode} | Hour: ${hour} | Day: ${dayOfWeek}`);

    const candidates = [];

    // ==========================================
    // 1️⃣ REMOTE MODE (Planning)
    // ==========================================
    if (mode === 'remote') {
        if (!userBehavior?.ignoredPlanning) {
            // A) Evening (Hotels) - 19:00 - 23:00
            if (hour >= 19 && hour <= 23 && !userBehavior?.ignoredHotels) {
                candidates.push({
                    id: "remote_hotels",
                    type: "hotel",
                    text: "Szállást keresel Kőszegen? Segítek a legjobbat megtalálni.",
                    action: "navigate_to_hotels",
                    priority: 13 // Passes threshold
                });
            }

            // B) Start of Week (Events) - Mon/Tue
            if ((dayOfWeek === 1 || dayOfWeek === 2) && !userBehavior?.ignoredEvents) {
                candidates.push({
                    id: "remote_weekend_plan",
                    type: "event",
                    text: "Hétvégi kirándulás terve? Nézd meg a kőszegi programokat!",
                    action: "navigate_to_events",
                    priority: 14 // Stronger than basic
                });
            }

            // C) Default Planning
            // Lower priority, barely passes threshold
            candidates.push({
                id: "remote_planning",
                type: "planning",
                text: "Kőszegre készülsz? Megmutassam a következő eseményeket?",
                action: "navigate_to_events",
                priority: 12 // Minimum to trigger
            });
        }
    }

    // ==========================================
    // 2️⃣ APPROACHING MODE (Transition)
    // ==========================================
    if (mode === 'approaching') {
        if (!userBehavior?.ignoredParking) {
            candidates.push({
                id: "approaching_parking",
                type: "parking",
                text: "🚗 Úton Kőszeg felé? Segítsek parkolót találni?",
                action: "navigate_to_parking",
                priority: 15 // High relevance context
            });
        }
    }

    // ==========================================
    // 3️⃣ CITY MODE (Full Experience)
    // ==========================================
    if (mode === 'city') {

        // A) DINNER (Dynamic Scoring)
        // Peak at 19:00 (1140 minutes)
        if (hour >= 18 && hour <= 20 && !userBehavior?.ignoredDinner) {

            // Calculate proximity to 19:00 in 10-minute chunks
            const currentMinutes = hour * 60 + new Date().getMinutes();
            const peakMinutes = 19 * 60;
            const diff = Math.abs(currentMinutes - peakMinutes);
            // 0 min diff -> 10 weight
            // 60 min diff -> 4 weight
            const timeWeight = Math.max(0, 10 - Math.floor(diff / 10));

            candidates.push({
                id: "dinner_nudge",
                type: "food",
                text: "Vacsoraidő. Mutassak egy jó helyet?",
                action: "navigate_to_food",
                priority: 10 + timeWeight // Range: 10 - 20
            });
        }

        // B) LUNCH (12:00 - 14:00)
        if (hour >= 12 && hour <= 14 && !userBehavior?.ignoredLunch) {
            candidates.push({
                id: "lunch_nudge",
                type: "food",
                text: "🍽️ Ebédidő! Ismersz jó helyet a közelben?",
                action: "navigate_to_food",
                priority: 12 // Static for now, passes threshold
            });
        }

        // C) EVENTS (Dynamic Logic)
        if (events && events.length > 0) {
            const upcomingEvent = events
                .map(e => {
                    const start = new Date(e.start_time || e.date).getTime();
                    const diffMinutes = (start - now) / (1000 * 60);
                    return { ...e, diffMinutes };
                })
                // Filter: Starts in 0-120 mins
                .filter(e => e.diffMinutes > 0 && e.diffMinutes <= 120)
                .sort((a, b) => a.diffMinutes - b.diffMinutes)[0]; // Closest one

            if (upcomingEvent) {
                // Urgency Weight: Closer = Higher
                // 0 min -> 30 weight
                // 30 min -> 0 weight (Wait, user formula was max(0, 30 - diffMinutes))
                // This means events > 30 mins away get 0 weight?
                // User requested: priority = 15 + urgencyWeight.
                // If diff is 60 mins -> weight 0 -> Priority 15.
                // If diff is 5 mins -> weight 25 -> Priority 40.
                const urgencyWeight = Math.max(0, 30 - upcomingEvent.diffMinutes);

                candidates.push({
                    id: `event_${upcomingEvent.id}`,
                    type: "event",
                    text: `"${upcomingEvent.name}" hamarosan kezdődik.`,
                    action: "navigate_to_events",
                    priority: 15 + urgencyWeight // Range: 15 - 45
                });
            }
        }

        // D) RAIN
        if (weather?.isRainy && !userBehavior?.ignoredRain) {
            candidates.push({
                id: "rain_program",
                type: "attraction",
                text: "🌧️ Esik az eső? Mutatok fedett programokat.",
                action: "navigate_to_attractions",
                priority: 14 // Boosted to pass threshold
            });
        }
    }

    if (candidates.length === 0) return null;

    // Sort by priority (DESCENDING)
    const bestCandidate = candidates.sort((a, b) => b.priority - a.priority)[0];

    // 🔥 APPLE THRESHOLD LOGIC
    const MIN_SCORE = 12;
    if (bestCandidate.priority < MIN_SCORE) {
        console.log(`🤫 No trigger - Best candidate (${bestCandidate.priority}) below threshold (${MIN_SCORE})`);
        return null; // Silence is premium
    }

    console.log(`🏆 Winning Trigger: ${bestCandidate.id} (Score: ${bestCandidate.priority})`);
    return bestCandidate;
}
