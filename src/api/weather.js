// src/api/weather.js

async function fetchWithFallback(type, params = {}) {
  try {
    const queryParams = new URLSearchParams({ type, ...params }).toString();
    const res = await fetch(`/.netlify/functions/weather-proxy?${queryParams}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Weather proxy failed, using direct OpenWeatherMap fallback...", e);
  }

  // Direct fallback call (used for local development if Netlify CLI isn't running)
  const API_KEY = 'ebe4857b9813fcfd39e7ce692e491045';
  const queryParams = new URLSearchParams({
    q: 'Koszeg,HU',
    units: 'metric',
    appid: API_KEY,
    ...params
  }).toString();
  const url = `https://api.openweathermap.org/data/2.5/${type}?${queryParams}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Hiba az időjárás lekérésekor (${type})`);
  }
  return await res.json();
}

export async function fetchCurrentWeather() {
  const data = await fetchWithFallback('weather', { lang: 'hu' });
  return {
    temp: Math.round(data.main.temp),
    icon: data.weather[0].icon,
    description: data.weather[0].description
  };
}

export async function fetchForecastWeather() {
  const data = await fetchWithFallback('forecast', { lang: 'hu' });

  // Csoportosítás napokra
  const dailyMap = {};
  data.list.forEach(entry => {
    const date = entry.dt_txt.slice(0, 10);
    const tempMin = entry.main.temp_min;
    const tempMax = entry.main.temp_max;
    if (!dailyMap[date]) {
      dailyMap[date] = { temp_min: tempMin, temp_max: tempMax, icon: entry.weather[0].icon };
    } else {
      dailyMap[date].temp_min = Math.min(dailyMap[date].temp_min, tempMin);
      dailyMap[date].temp_max = Math.max(dailyMap[date].temp_max, tempMax);
    }
  });

  // Mai nap kihagyása, visszaadunk 4 napot
  const today = new Date().toISOString().slice(0, 10);
  const days = Object.keys(dailyMap)
    .filter(date => date !== today)
    .slice(0, 4)
    .map(date => ({ date, ...dailyMap[date] }));

  return days;
}

export async function fetchUpcomingWeather() {
  const data = await fetchWithFallback('forecast', { lang: 'hu' });

  // Return the first 4 items (next 12 hours) to check for imminent changes
  return data.list.slice(0, 4).map(item => ({
    dt: item.dt,
    icon: item.weather[0].icon,
    temp: Math.round(item.main.temp),
    pop: item.pop // Probability of precipitation
  }));
}

