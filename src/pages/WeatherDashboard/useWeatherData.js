import { useState, useEffect, useCallback } from 'react';

const STATION_ID = 72461;
const API_BASE = 'https://api2.smartmixin.io';
const CURRENT_URL = `${API_BASE}/api/stations/${STATION_ID}/?refresh=1`;
const HISTORY_URL = `${API_BASE}/api/measures/`;

const CURRENT_HEADERS = {
  'Accept': 'application/json',
  'X-SmartMixin-Context': 'UI'
};
const HISTORY_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-SmartMixin-Context': 'UI'
};

// A smartmixin API 24 órás ablakra gyakran ÜRES tömböt ad (API-bug), de a 48 órás
// kérés megbízhatóan visszaadja az adatot. Ezért szélesebb ablakot kérünk le,
// majd a kliensen levágjuk a megjelenítendő utolsó 24 órára.
const FETCH_HOURS = 48;
const DISPLAY_HOURS = 24;

// Van-e tényleges mérési pont a history válaszban?
const hasPoints = (json) =>
  Array.isArray(json) && json[0] && Array.isArray(json[0].timestamps) && json[0].timestamps.length > 0;

// Az utolsó `hours` órára szűkíti a sorozatot (timestamps + minden results-tömb együtt).
const trimToLast = (json, hours) => {
  if (!hasPoints(json)) return json;
  const s = json[0];
  const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
  const ts = s.timestamps;
  let i = 0;
  while (i < ts.length && ts[i] < cutoff) i++;
  if (i === 0) return json; // minden adat a tartományon belül van
  const results = {};
  for (const k in s.results) {
    results[k] = Array.isArray(s.results[k]) ? s.results[k].slice(i) : s.results[k];
  }
  return [{ ...s, timestamps: ts.slice(i), results }];
};

export default function useWeatherData() {
  const [currentData, setCurrentData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchCurrent = useCallback(async () => {
    const res = await fetch(CURRENT_URL, { headers: CURRENT_HEADERS });
    if (!res.ok) throw new Error(`Aktuális API hiba: ${res.status}`);
    return res.json();
  }, []);

  const fetchHistory = useCallback(async (attempt = 0) => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - FETCH_HOURS * 3600; // szélesebb ablak az API 24h-bugja miatt
    const body = {
      series: [{
        station: STATION_ID,
        metrics: ['T', 'U', 'FF', 'FXY', 'SLP', 'RR_1H', 'HEAT_INDEX', 'HUMIDEX'],
        scale: 'max',
        start,
        end: now,
        sharp: true
      }]
    };
    const res = await fetch(HISTORY_URL, {
      method: 'POST',
      headers: HISTORY_HEADERS,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Előzmény API hiba: ${res.status}`);
    const json = await res.json();

    // A smartmixin API időnként üres tömböt ad ugyanarra a kérésre.
    // Ilyenkor pár újrapróbálkozás növekvő várakozással.
    if (!hasPoints(json) && attempt < 3) {
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      return fetchHistory(attempt + 1);
    }
    // 48h-t kértünk a megbízhatóságért → levágjuk a megjelenítendő utolsó 24 órára.
    return trimToLast(json, DISPLAY_HOURS);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both. If history fails, we still want to show current weather.
      const current = await fetchCurrent().catch(e => {
        setError(prev => prev ? `${prev} | ${e.message}` : e.message);
        return null;
      });

      const history = await fetchHistory().catch(e => {
        console.error("Előzmény lekérési hiba:", e);
        return null;
      });

      if (current) {
        setCurrentData(current);
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest' }));
      }
      // Csak akkor frissítünk, ha tényleg jött adat — különben megtartjuk
      // az utolsó jó előzményt (nem ürül ki a grafikon egy üres válasz miatt).
      if (hasPoints(history)) {
        setHistoryData(history);
      }
      return hasPoints(history);
    } catch (e) {
      console.error(e);
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrent, fetchHistory]);

  useEffect(() => {
    let cancelled = false;
    let quickTimer;
    // Induláskor: ha épp API-kimaradásba esünk és nincs még előzmény,
    // gyorsan (15 mp) újrapróbálunk pár alkalommal, mielőtt a normál ciklusra váltunk.
    const kickoff = async (tries = 0) => {
      const ok = await loadAll();
      if (!cancelled && !ok && tries < 5) {
        quickTimer = setTimeout(() => kickoff(tries + 1), 15000);
      }
    };
    kickoff();
    const timer = setInterval(loadAll, 300000); // 5m auto-refresh
    return () => {
      cancelled = true;
      clearTimeout(quickTimer);
      clearInterval(timer);
    };
  }, [loadAll]);

  return {
    currentData,
    historyData,
    loading,
    error,
    lastUpdate,
    refresh: loadAll
  };
}
