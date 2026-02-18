// Global User Context Engine (Singleton)
// Tracks user state across the session

export const userContext = {
    location: null,
    speed: 0,
    direction: null,
    appMode: "remote", // Default
    lastPage: null,
    timeOnPage: 0,
    lastSearch: null,
    lastActions: [],
    behaviorProfile: {},
    timestamp: Date.now()
};

function getDistance(coords1, coords2) {
    if (!coords1 || !coords2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(coords2.latitude - coords1.latitude);
    const dLon = deg2rad(coords2.longitude - coords1.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coords1.latitude)) * Math.cos(deg2rad(coords2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export function updateLocation(coords) {
    const now = Date.now();

    if (userContext.location) {
        const distance = getDistance(userContext.location, coords); // km
        const timeDiff = (now - userContext.timestamp) / 3600000; // hours (can be very small)

        if (timeDiff > 0) {
            userContext.speed = distance / timeDiff; // km/h
        }
    }

    userContext.location = coords;
    userContext.timestamp = now;
}

export function updatePage(page) {
    userContext.lastPage = page;
}

export function updateSearch(term) {
    userContext.lastSearch = term;
}

export function updateAppMode(mode) {
    userContext.appMode = mode;
}

export function getUserContext() {
    return userContext;
}
