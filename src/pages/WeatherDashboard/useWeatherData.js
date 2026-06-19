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

// A smartmixin API kiszámíthatatlan: ugyanarra a kérésre időnként üres tömböt ad,
// és ABLAKONKÉNT/METRIKÁNKÉNT is inkonzisztens — pl. egyszer a 24h adja a hőmérsékletet
// és a 48h nem, máskor fordítva. Ezért több ablakot kérünk le párhuzamosan, és
// metrikánként azt választjuk, amelyikben tényleg van adat. Plusz metrikánkénti
// utolsó-jó cache: egy hiányos válasz nem üríti ki a már működő grafikont.
const METRICS = ['T', 'U', 'FF', 'FXY', 'SLP', 'RR_1H', 'HEAT_INDEX', 'HUMIDEX'];
const WINDOW_HOURS = [24, 48]; // párhuzamosan lekért ablakok
const DISPLAY_HOURS = 24;      // ennyit jelenítünk meg

const hasPoints = (s) =>
  s && Array.isArray(s.timestamps) && s.timestamps.length > 0;

const countNonNull = (arr) => arr.reduce((n, v) => n + (v != null ? 1 : 0), 0);

// Egy metrika-sorozat levágása az utolsó `hours` órára
const trimSeries = (ts, data, hours) => {
  const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
  let i = 0;
  while (i < ts.length && ts[i] < cutoff) i++;
  return { ts: ts.slice(i), data: data.slice(i) };
};

export default function useWeatherData() {
  const [currentData, setCurrentData] = useState(null);
  const [historySeries, setHistorySeries] = useState({}); // { [metrika]: { ts:[], data:[] } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchCurrent = useCallback(async () => {
    const res = await fetch(CURRENT_URL, { headers: CURRENT_HEADERS });
    if (!res.ok) throw new Error(`Aktuális API hiba: ${res.status}`);
    return res.json();
  }, []);

  // Egyetlen ablak lekérése → { timestamps, results } vagy null
  const fetchWindow = useCallback(async (hours) => {
    const now = Math.floor(Date.now() / 1000);
    const body = {
      series: [{
        station: STATION_ID,
        metrics: METRICS,
        scale: 'max',
        start: now - hours * 3600,
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
    return Array.isArray(json) && hasPoints(json[0]) ? json[0] : null;
  }, []);

  // Több ablakot lekér, és metrikánként a legtöbb (utolsó 24h-s) adattal rendelkezőt választja.
  const fetchHistory = useCallback(async () => {
    const windows = (await Promise.all(
      WINDOW_HOURS.map(h => fetchWindow(h).catch(() => null))
    )).filter(Boolean);
    if (!windows.length) return null;

    const out = {};
    for (const k of METRICS) {
      let best = null;
      let bestCount = 0;
      for (const w of windows) {
        const arr = w.results?.[k];
        if (!Array.isArray(arr)) continue;
        const trimmed = trimSeries(w.timestamps, arr, DISPLAY_HOURS);
        const count = countNonNull(trimmed.data);
        if (count > bestCount) { bestCount = count; best = trimmed; }
      }
      if (best && bestCount > 0) out[k] = best;
    }
    return Object.keys(out).length ? out : null;
  }, [fetchWindow]);

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
      // Metrikánként frissítünk: a most megkapott metrikák új adatot kapnak,
      // a hiányzók megtartják az utolsó jó sorozatukat (nem ürül ki a grafikon).
      if (history) {
        setHistorySeries(prev => ({ ...prev, ...history }));
      }
      return !!history;
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
    historySeries,
    loading,
    error,
    lastUpdate,
    refresh: loadAll
  };
}
