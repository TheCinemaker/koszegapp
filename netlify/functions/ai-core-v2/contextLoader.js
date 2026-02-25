import { detectMobilityFromSpeed } from './mobilityEngine.js';
import { getState } from './stateRepository.js';

export async function loadContext(frontendContext) {
    const location = frontendContext?.location || null;
    const speed = frontendContext?.speed ?? null;
    const weather = frontendContext?.weather || null;
    const mode = frontendContext?.mode || 'city';

    // 🆕 Session kezelés
    const sessionId = frontendContext?.sessionId || null;
    const userId = frontendContext?.userId || null;
    const token = frontendContext?.token || null;

    const mobility = frontendContext?.mobility || detectMobilityFromSpeed(speed);

    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour >= 6 && hour < 11;
    const isLunch = hour >= 11 && hour < 14;
    const isAfternoon = hour >= 14 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;

    // 🆕 Beszélgetés állapotának betöltése
    let conversationState = await getState(userId, sessionId, token);

    return {
        location,
        speed,
        mobility,
        weather,
        mode,
        hour,
        isMorning, isLunch, isAfternoon, isEvening,

        // 🔥 ÚJ: session info
        sessionId,
        userId,
        token,

        // 🔥 ÚJ: beszélgetés állapota
        conversation: conversationState,

        // 🔥 ÚJ: meta
        isGuest: !userId || !token,
        timestamp: now.toISOString()
    };
}