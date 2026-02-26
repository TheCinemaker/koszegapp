/**
 * Haversine distance calculation
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Logic to show booking bubble
 */
export function shouldShowBookingBubble(userLat, userLng, event) {
    if (!userLat || !userLng || !event || !event.date) return false;

    const koszegLat = 47.389;
    const koszegLng = 16.540;

    const distance = getDistanceKm(userLat, userLng, koszegLat, koszegLng);

    const eventDate = new Date(event.date);
    const now = new Date();

    const isFutureEvent = eventDate > now;
    const isFar = distance > 30; // 30km threshold

    // Dismissed flag
    const isDismissed = localStorage.getItem(`booking_bubble_dismissed_${event.id}`);

    // Only big events or far away users
    const isBigEvent = event.kiemelt === true || event.kiemelt === "1";
    const isVeryFar = distance > 60;

    return isFutureEvent && isFar && !isDismissed && (isBigEvent || isVeryFar);
}

/**
 * Generate dates from event ISO
 */
export function getBookingDatesFromEvent(eventISO) {
    const eventDate = new Date(eventISO);

    const checkin = new Date(eventDate);
    const checkout = new Date(eventDate);

    if (eventDate.getHours() >= 17) {
        checkout.setDate(checkout.getDate() + 2);
    } else {
        checkout.setDate(checkout.getDate() + 1);
    }

    const format = d => d.toISOString().split("T")[0];

    return {
        checkin: format(checkin),
        checkout: format(checkout)
    };
}
/**
 * GPS-aware destination name
 */
export function getDynamicDestination(lat, lng) {
    if (!lat || !lng) return "Kőszeg";

    const koszegLat = 47.389;
    const koszegLng = 16.540;
    const distance = getDistanceKm(lat, lng, koszegLat, koszegLng);

    if (distance < 10) {
        return "Kőszeg és környéke";
    }
    return "Kőszeg";
}
