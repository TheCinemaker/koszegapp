import fetch from 'node-fetch';

export async function handler(event, context) {
  // Safe fallback to the original key if the env variable is not configured in Netlify yet
  const apiKey = process.env.OPENWEATHER_API_KEY || 'ebe4857b9813fcfd39e7ce692e491045';
  
  const params = event.queryStringParameters || {};
  const type = params.type || 'weather';
  const q = params.q || 'Koszeg,HU';
  const units = params.units || 'metric';
  const lang = params.lang || 'hu';

  if (!['weather', 'forecast'].includes(type)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing or invalid 'type' parameter. Must be 'weather' or 'forecast'." })
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/${type}?q=${encodeURIComponent(q)}&units=${units}&appid=${apiKey}&lang=${lang}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `OpenWeatherMap returned status ${res.status}` })
      };
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch weather data", details: err.message })
    };
  }
}
