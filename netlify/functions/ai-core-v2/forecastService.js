/**
 * forecastService.js – ai-core-v2
 * Gets hourly weather forecast for a specific future time.
 * Uses Open-Meteo hourly endpoint (free, no API key).
 * Used for arrival planning: "mikor jössz? arra nézek előrejelzést"
 */

/**
 * Returns weather forecast closest to the given Unix timestamp.
 */
export async function getForecastForTime(lat, lng, timestamp) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode&timezone=Europe/Budapest&forecast_days=7`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const hours = data.hourly.time.map((t, i) => ({
            time: new Date(t).getTime(),
            temperature: data.hourly.temperature_2m[i],
            conditionCode: data.hourly.weathercode[i]
        }));

        const closest = hours.reduce((prev, curr) =>
            Math.abs(curr.time - timestamp) < Math.abs(prev.time - timestamp) ? curr : prev
        );

        const isRain = closest.conditionCode >= 51;
        const isCloudy = closest.conditionCode >= 2;
        return {
            temperature: closest.temperature,
            conditionCode: closest.conditionCode,
            isRain,
            isCloudy,
            forecastTime: new Date(closest.time).toISOString()
        };
    } catch (e) {
        console.warn('Forecast fetch failed:', e.message);
        return null;
    }
}

/**
 * Parses basic Hungarian date/time expressions.
 * "Holnap 15:00" → Unix timestamp
 * "Ma 18 óra" → Unix timestamp
 * "Pénteken" → closest upcoming Friday
 */
export function parseArrivalTime(query) {
    const q = query.toLowerCase();
    const now = new Date();

    // Time extraction: "15:00", "15h", "15 óra"
    const timeMatch = q.match(/(\d{1,2})[:h\s]?(\d{2})?\s*(?:óra|h)?/);
    const hour = timeMatch ? parseInt(timeMatch[1], 10) : 14; // default 14:00
    const minute = timeMatch?.[2] ? parseInt(timeMatch[2], 10) : 0;

    const target = new Date(now);
    target.setSeconds(0);
    target.setMilliseconds(0);
    target.setHours(hour, minute);

    if (q.includes('holnap') || q.includes('tomorrow')) {
        target.setDate(target.getDate() + 1);
        return target.getTime();
    }

    if (q.includes('ma') || q.includes('today')) {
        if (target <= now) target.setDate(target.getDate() + 1); // if past, next day
        return target.getTime();
    }

    // Day of week
    const days = ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'];
    for (let i = 0; i < days.length; i++) {
        if (q.includes(days[i])) {
            const diff = (i - now.getDay() + 7) % 7 || 7;
            target.setDate(target.getDate() + diff);
            return target.getTime();
        }
    }

    // Numeric "X nap múlva"
    const daysMatch = q.match(/(\d+)\s*nap\s*múlva/);
    if (daysMatch) {
        target.setDate(target.getDate() + parseInt(daysMatch[1], 10));
        return target.getTime();
    }

    return null; // could not parse
}
