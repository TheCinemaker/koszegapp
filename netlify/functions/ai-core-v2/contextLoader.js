/**
 * contextLoader.js – ai-core-v2
 * Loads GPS, speed, mobility, time and weather from frontend context.
 * All data comes from frontend — no external API calls here.
 */
import { detectMobilityFromSpeed } from './mobilityEngine.js';

export async function loadContext(frontendContext) {
    const location = frontendContext?.location || null;
    const speed = frontendContext?.speed ?? null;
    const weather = frontendContext?.weather || null;
    const mode = frontendContext?.mode || 'city';

    const mobility = frontendContext?.mobility || detectMobilityFromSpeed(speed);

    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour >= 6 && hour < 11;
    const isLunch = hour >= 11 && hour < 14;
    const isAfternoon = hour >= 14 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;

    return {
        location,     // { lat, lng }
        speed,        // km/h or null
        mobility,     // 'walking' | 'bike' | 'car' | null
        weather,      // from frontend
        mode,
        hour,
        isMorning, isLunch, isAfternoon, isEvening
    };
}
