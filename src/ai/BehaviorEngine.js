/**
 * 🧠 Behavior Engine - Learns from User Actions
 * 
 * Tracks how many times a user ignores a specific type of suggestion.
 * If ignored > 2 times, it flags the category as "ignored".
 */

export function registerUserIgnore(type) {
    if (!type) return;
    const key = `ignore_${type}`;
    const current = parseInt(localStorage.getItem(key) || 0);
    localStorage.setItem(key, current + 1);
    console.log(`🧠 Behavior Tracked: Ignored ${type} (${current + 1} times)`);
}

export function getBehaviorProfile() {
    return {
        ignoredDinner: parseInt(localStorage.getItem("ignore_food") || 0) > 2,
        ignoredEvents: parseInt(localStorage.getItem("ignore_event") || 0) > 2,
        ignoredRain: parseInt(localStorage.getItem("ignore_attraction") || 0) > 2,
        ignoredPlanning: parseInt(localStorage.getItem("ignore_planning") || 0) > 2,
        // Add others if needed
        ignoredParking: parseInt(localStorage.getItem("ignore_parking") || 0) > 2
    };
}

export function resetBehaviorProfile() {
    localStorage.removeItem("ignore_food");
    localStorage.removeItem("ignore_event");
    localStorage.removeItem("ignore_attraction");
    localStorage.removeItem("ignore_planning");
    localStorage.removeItem("ignore_parking");
}

export function setTravelIntent(value) {
    const profile = getUserProfile();
    profile.travelIntent = value;
    localStorage.setItem("user_profile", JSON.stringify(profile));
    console.log(`🧠 Behavior Update: Travel Intent set to ${value}`);
}

// 🧠 Deep Learning: User Interests
export function getUserProfile() {
    try {
        return JSON.parse(localStorage.getItem("user_profile") || "{}");
    } catch {
        return {};
    }
}

export function updateInterest(type, delta) {
    const profile = getUserProfile();
    profile[type] = (profile[type] || 0) + delta;
    localStorage.setItem("user_profile", JSON.stringify(profile));
    console.log(`🧠 Interest Updated: ${type} +${delta} (Total: ${profile[type]})`);
}
