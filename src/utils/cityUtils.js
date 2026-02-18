export function isUserInCity(userLocation, cityCenter, maxDistanceKm = 20) {
    if (!userLocation) return false;

    const R = 6371;
    const dLat = toRad(cityCenter.lat - userLocation.lat); // Note: userLocation might have lat/lng or latitude/longitude. 
    // User provided code uses userLocation.latitude. 
    // My LocationContext sets { lat, lng }.
    // I must ensure consistency.
    // LocationContext: setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    // So userLocation has .lat and .lng
    // But USER PROVIDED CODE uses .latitude .longitude.
    // I SHOULD ADJUST TO MATCH MY CONTEXT OR USER CODE.
    // I will adjust to match MY CONTEXT ({lat, lng}) functionality, but user code structure.

    // Wait, user code snippet:
    // dLat = toRad(cityCenter.lat - userLocation.latitude);
    // My context provides: { lat, lng }.
    // So I should use userLocation.lat

    const lat = userLocation.lat || userLocation.latitude;
    const lng = userLocation.lng || userLocation.longitude;

    const dLatFixed = toRad(cityCenter.lat - lat);
    const dLonFixed = toRad(cityCenter.lng - lng);

    const a =
        Math.sin(dLatFixed / 2) * Math.sin(dLatFixed / 2) +
        Math.cos(toRad(lat)) *
        Math.cos(toRad(cityCenter.lat)) *
        Math.sin(dLonFixed / 2) *
        Math.sin(dLonFixed / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= maxDistanceKm;
}

function toRad(value) {
    return (value * Math.PI) / 180;
}
