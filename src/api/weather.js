// src/api/weather.js
const API_KEY = 'ebe4857b9813fcfd39e7ce692e491045';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function fetchCurrentWeather() {
  const url = `${BASE_URL}/weather?q=Koszeg,HU&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Hiba az aktuális időjárás lekérésekor');
  }
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    icon: data.weather[0].icon,
    description: data.weather[0].description
  };
}

export async function fetchForecastWeather() {
  const url = `${BASE_URL}/forecast?q=Koszeg,HU&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Hiba az előrejelzés lekérésekor');
  }
  const data = await res.json();

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
