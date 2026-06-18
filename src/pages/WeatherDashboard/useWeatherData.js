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

  const fetchHistory = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 86400; // Last 24 hours
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
    return res.json();
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
      if (history) {
        setHistoryData(history);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrent, fetchHistory]);

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 300000); // 5m auto-refresh
    return () => clearInterval(timer);
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
