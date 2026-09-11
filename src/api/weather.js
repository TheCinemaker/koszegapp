// src/api/weather.js

export async function fetchCurrentWeather() {
  const CURRENT_URL = 'https://api2.smartmixin.io/api/stations/72461/?refresh=1';
  try {
    const res = await fetch(CURRENT_URL, {
      headers: {
        'Accept': 'application/json',
        'X-SmartMixin-Context': 'UI'
      }
    });
    if (!res.ok) throw new Error(`Kőszeg API returned status ${res.status}`);
    const data = await res.json();
    const last = data.last_measure || {};

    const temp = typeof last.T === 'number' ? Math.round(last.T) : '--';
    const u = last.U ?? 50;
    const rr = last.RR_1H ?? 0;
    let icon = '01d';
    let description = 'Tiszta idő';

    if (rr > 1.0) {
      icon = '09d';
      description = 'Esős időjárás';
    } else if (rr > 0.1) {
      icon = '10d';
      description = 'Szemerkél az eső';
    } else if (u > 90) {
      icon = '50d';
      description = 'Párás, ködös levegő';
    } else if (u > 80) {
      icon = '04d';
      description = 'Borús, szürke idő';
    } else if (u > 60) {
      icon = '03d';
      description = 'Változóan felhős';
    } else if (u > 40) {
      icon = '02d';
      description = 'Kevés felhő, kellemes idő';
    }

    return {
      temp,
      icon,
      description
    };
  } catch (e) {
    try {
      const omRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.3888&longitude=16.5414&current_weather=true');
      if (omRes.ok) {
        const omData = await omRes.json();
        const cw = omData.current_weather;
        const temp = typeof cw?.temperature === 'number' ? Math.round(cw.temperature) : '--';
        let icon = '01d';
        let description = 'Kellemes idő';
        const code = cw?.weathercode || 0;
        if (code >= 61) { icon = '09d'; description = 'Eső'; }
        else if (code >= 51) { icon = '10d'; description = 'Szemerkélő eső'; }
        else if (code >= 1 && code <= 3) { icon = '03d'; description = 'Gomolyfelhős'; }
        return { temp, icon, description };
      }
    } catch (fallbackErr) {
      // quiet fallback
    }
    return {
      temp: '--',
      icon: '01d',
      description: 'Nincs adat'
    };
  }
}

export async function fetchForecastWeather() {
  return [];
}

export async function fetchUpcomingWeather() {
  return [];
}
