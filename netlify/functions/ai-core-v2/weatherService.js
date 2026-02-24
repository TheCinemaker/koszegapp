/**
 * weatherService.js – ai-core-v2
 * Fetches real-time weather from Open-Meteo (free, no API key needed).
 * Normalizes WMO weather codes to human-readable strings.
 */

// WMO weather interpretation codes
const CONDITION_MAP = {
    0: { label: 'derült', isRain: false, isCloudy: false },
    1: { label: 'főleg derült', isRain: false, isCloudy: false },
    2: { label: 'részben felhős', isRain: false, isCloudy: true },
    3: { label: 'borult', isRain: false, isCloudy: true },
    45: { label: 'köd', isRain: false, isCloudy: true },
    48: { label: 'köd', isRain: false, isCloudy: true },
    51: { label: 'szitálás', isRain: true, isCloudy: true },
    53: { label: 'szitálás', isRain: true, isCloudy: true },
    55: { label: 'erős szitálás', isRain: true, isCloudy: true },
    61: { label: 'eső', isRain: true, isCloudy: true },
    63: { label: 'eső', isRain: true, isCloudy: true },
    65: { label: 'erős eső', isRain: true, isCloudy: true },
    71: { label: 'hó', isRain: false, isCloudy: true },
    73: { label: 'hóesés', isRain: false, isCloudy: true },
    75: { label: 'erős hóesés', isRain: false, isCloudy: true },
    80: { label: 'zápor', isRain: true, isCloudy: true },
    81: { label: 'zápor', isRain: true, isCloudy: true },
    82: { label: 'heves zápor', isRain: true, isCloudy: true },
    95: { label: 'zivatar', isRain: true, isCloudy: true },
    96: { label: 'jégeső', isRain: true, isCloudy: true },
    99: { label: 'jégeső', isRain: true, isCloudy: true }
};

/**
 * Fetches current weather for given coordinates.
 * Falls back to null if fetch fails (never crash the pipeline).
 */
export async function getWeather(lat, lng) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=Europe/Budapest`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const cw = data.current_weather;
        const code = cw.weathercode;
        const condition = CONDITION_MAP[code] || { label: 'ismeretlen', isRain: false, isCloudy: false };

        return {
            temperature: cw.temperature,
            windspeed: cw.windspeed,
            conditionCode: code,
            condition: condition.label,
            isRain: condition.isRain,
            isCloudy: condition.isCloudy
        };
    } catch (e) {
        console.warn('Weather fetch failed:', e.message);
        return null;
    }
}
