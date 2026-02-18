/**
 * ❤️ SmartTriggerEngine 2.0 - Refined
 * 
 * Advanced deterministic logic for the Proactive AI Layer.
 * Supports: Remote, Approaching, City modes.
 * Features: Candidate collection, Priority sorting, Throttling, Randomness.
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
    console.log(`🧠 SmartEngine 2.0 | Mode: ${mode} | Hour: ${hour} | Day: ${dayOfWeek}`);

    const candidates = [];

    // ==========================================
    // 1️⃣ REMOTE MODE (Planning)
    // ==========================================
    if (mode === 'remote') {
        // Apple-style: Don't always trigger (40% chance of returning null)
        // Less intrusive.
        if (Math.random() > 0.6) {
            console.log("🎲 Randomly skipping remote trigger (Apple-style silence)");
            return null;
        }

        if (!userBehavior?.ignoredPlanning) {
            // A) Evening (Hotels) - 19:00 - 23:00
            if (hour >= 19 && hour <= 23 && !userBehavior?.ignoredHotels) {
                candidates.push({
                    id: "remote_hotels",
                    type: "hotel",
                    text: "Szállást keresel Kőszegen? Segítek a legjobbat megtalálni.",
                    action: "navigate_to_hotels",
                    priority: 6
                });
            }

            // B) Start of Week (Events) - Mon/Tue
            if ((dayOfWeek === 1 || dayOfWeek === 2) && !userBehavior?.ignoredEvents) {
                candidates.push({
                    id: "remote_weekend_plan",
                    type: "event",
                    text: "Hétvégi kirándulás terve? Nézd meg a kőszegi programokat!",
                    action: "navigate_to_events",
                    priority: 7
                });
            }

            // C) Default Planning
            candidates.push({
                id: "remote_planning",
                type: "planning",
                text: "Kőszegre készülsz? Megmutassam a következő eseményeket?",
                action: "navigate_to_events",
                priority: 5
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
                priority: 8
            });
        }
    }

    // ==========================================
    // 3️⃣ CITY MODE (Full Experience)
    // ==========================================
    if (mode === 'city') {

        // A) DINNER (18:00 - 20:30)
        if (hour >= 18 && hour <= 20 && !userBehavior?.ignoredDinner) {
            candidates.push({
                id: "dinner_nudge",
                type: "food",
                text: "🍷 Vacsoraidő! Mutassak egy hangulatos éttermet?",
                action: "navigate_to_food",
                priority: 10
            });
        }

        // B) LUNCH (12:00 - 14:00)
        if (hour >= 12 && hour <= 14 && !userBehavior?.ignoredLunch) {
            candidates.push({
                id: "lunch_nudge",
                type: "food",
                text: "🍽️ Ebédidő! Ismersz jó helyet a közelben?",
                action: "navigate_to_food",
                priority: 8
            });
        }

        // C) EVENTS (Starting in < 60 min) - HIGHEST PRIORITY
        if (events && events.length > 0) {
            const upcomingEvent = events.find(e => {
                const start = new Date(e.start_time || e.date).getTime();
                const diffMinutes = (start - now) / (1000 * 60);
                return diffMinutes > 0 && diffMinutes <= 60;
            });

            if (upcomingEvent) {
                candidates.push({
                    id: `event_${upcomingEvent.id}`,
                    type: "event",
                    text: `🎵 "${upcomingEvent.name}" hamarosan kezdődik. Érdekel?`,
                    action: "navigate_to_events",
                    priority: 20 // Higher than dinner/lunch
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
                priority: 5
            });
        }
    }

    // Return the best candidate
    if (candidates.length === 0) return null;

    // Sort by priority (DESCENDING)
    const bestCandidate = candidates.sort((a, b) => b.priority - a.priority)[0];
    console.log("🏆 Winning Trigger:", bestCandidate);
    return bestCandidate;
}
