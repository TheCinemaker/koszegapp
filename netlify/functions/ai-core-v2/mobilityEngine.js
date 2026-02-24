/**
 * mobilityEngine.js – ai-core-v2
 * Auto-detects mobility mode from GPS speed.
 * No LLM. Pure deterministic function.
 */
export function detectMobilityFromSpeed(speed) {
    if (speed == null) return null;
    if (speed < 6) return 'walking';
    if (speed < 20) return 'bike';
    return 'car';
}
