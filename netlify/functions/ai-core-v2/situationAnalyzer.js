/**
 * situationAnalyzer.js – ai-core-v2
 * Determines if user is in Kőszeg or approaching.
 * Uses inline Haversine – no external npm package needed.
 */

const KOSZEG = { lat: 47.3895, lng: 16.541 };
const CITY_RADIUS_KM = 5;

function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180)
        * Math.cos(b.lat * Math.PI / 180)
        * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function analyzeSituation(frontendContext) {
    const loc = frontendContext?.location;
    const speed = loc?.speed ?? frontendContext?.speed ?? 0;

    if (!loc?.lat || !loc?.lng) {
        return { status: 'unknown', speed };
    }

    const distanceKm = haversineKm({ lat: loc.lat, lng: loc.lng }, KOSZEG);

    if (distanceKm > CITY_RADIUS_KM) {
        return {
            status: 'not_in_city',
            distanceKm: Math.round(distanceKm),
            speed,
            approaching: speed > 10 && distanceKm < 30 // driving toward city
        };
    }

    return {
        status: 'in_city',
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        speed
    };
}

/**
 * Deterministic, controlled humor-layer messages.
 * Not LLM generated – predictable, brand-consistent.
 */
export function buildArrivalMessage(distanceKm, approaching) {
    if (approaching) {
        return `Úton vagy Kőszeg felé (kb. ${distanceKm} km)! 🚗 Mikor érkezel? Arra az időpontra tervezek neked programot az időjárás alapján.`;
    }
    return `Látom még nem vagy Kőszegen (${distanceKm} km). 😄 Mikor érkezel? Megnézem az időjárást és úgy tervezek neked programot.`;
}
