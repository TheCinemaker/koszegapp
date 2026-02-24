/**
 * rankingEngine.js – ai-core-v2
 * Geo-distance ranking for local JSON data.
 * Restores the "tudja hol vagyok" feature with deterministic math.
 */

function haversine(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180)
        * Math.cos(b.lat * Math.PI / 180)
        * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Ranks items by distance from user.
 * Works with both 'coords' (restaurants) and 'coordinates' (attractions) field names.
 */
export function rankByDistance(items, userLocation) {
    if (!userLocation?.lat || !userLocation?.lng) return items;

    return items
        .map(item => {
            const coords = item.coordinates || item.coords || null;
            const dist = coords ? haversine(userLocation, coords) : Infinity;
            return { ...item, _distanceKm: parseFloat(dist.toFixed(2)) };
        })
        .sort((a, b) => a._distanceKm - b._distanceKm);
}

/**
 * Returns top N items within radius (km).
 */
export function filterNearby(items, userLocation, radiusKm = 2, topN = 5) {
    return rankByDistance(items, userLocation)
        .filter(i => i._distanceKm <= radiusKm)
        .slice(0, topN);
}
