// src/components/LiveCityMap.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import { parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// --- Ikonok (Változatlan) ---
const makeDot = (hex) =>
  L.divIcon({
    className: 'leaflet-dot-icon',
    html: `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex}; box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
const makePulsingDot = (hex) =>
  L.divIcon({
    className: 'leaflet-pulse-dot', // Ez a 30x30-as konténer
    html: `
      <span class="pulse-ring"></span>
      <span style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display:inline-block;
        width:12px;
        height:12px;
        border-radius:50%;
        background:${hex};
        box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);
      "></span>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
const ICONS = { events: makeDot('#ef4444'), eventsToday: makePulsingDot('#ef4444'), attractions: makeDot('#3b82f6'), leisure: makeDot('#22c55e'), restaurants: makeDot('#f97316') };
const userIcon = L.divIcon({
  className: 'leaflet-user-icon',
  html: `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#2563eb; box-shadow:0 0 0 2px #fff, 0 0 6px rgba(0,0,0,.4);"></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// ---- Segédfüggvények (Változatlan) ----
function normalizeLatLng(obj) {
  if (!obj || typeof obj.lat !== 'number' || typeof obj.lng !== 'number') {
    return null;
  }
  const out = { lat: obj.lat, lng: obj.lng };
  if (obj.label) {
    out.label = String(obj.label);
  }
  return out;
}
function pickLocations(item) {
  if (!item) {
    return [];
  }
  if (Array.isArray(item.locations)) {
    return item.locations.map(normalizeLatLng).filter(Boolean);
  }
  const c =
    item.coords ||
    item.coordinates ||
    item.coordinate ||
    item.location?.coords ||
    item.location?.coordinates ||
    null;
  if (c) {
    const one = normalizeLatLng(c);
    return one ? [one] : [];
  }
  const fb = normalizeLatLng(item);
  return fb ? [fb] : [];
}
function formatEventWhen(e) {
  const s = e.date ? parseISO(e.date) : null;
  const ee = e.end_date ? parseISO(e.end_date) : null;
  if (!s || isNaN(s)) {
    return e.time ? e.time : 'Időpont később';
  }
  const pad = (n) => String(n).padStart(2, '0');
  const d = (dt) => `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`;
  if (e.time && e.time.trim()) {
    if (ee && !isNaN(ee) && d(s) !== d(ee)) {
      return `${d(s)} – ${d(ee)} • ${e.time}`;
    }
    return `${d(s)} • ${e.time}`;
  }
  if (ee && !isNaN(ee) && d(s) !== d(ee)) {
    return `${d(s)} – ${d(ee)}`;
  }
  return d(s);
}

function isEventToday(e) {
  const today = new Date(); // Ennek a te rendszereden 2025-09-22-nek kell lennie
  const startDate = e.date ? parseISO(e.date) : null;
  if (!startDate || isNaN(startDate)) {
    return false;
  }
  const endDateString = e.end_date || e.date;
  const parsedEndDate = parseISO(endDateString);
  const effectiveEndDate = !parsedEndDate || isNaN(parsedEndDate) ? startDate : parsedEndDate;
  const interval = {
    start: startOfDay(startDate),
    end: endOfDay(effectiveEndDate),
  };
  return isWithinInterval(today, interval);
}

const TILE_STYLES = { CartoLight: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; OSM & CARTO' }, OSM: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OSM contributors' } };

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const navigate = useNavigate();
  const center = [47.3896, 16.5402];

  const [tileKey, setTileKey] = useState('CartoLight');
  const [show, setShow] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });

  console.log("--- [DIAGNOSZTIKA] LiveCityMap render fut ---");

  useEffect(() => {
    console.log("[DIAGNOSZTIKA] A komponens megkapta az 'events' prop-ot. Értéke:", events);
    if (!Array.isArray(events)) {
      console.error("[HIBA!] Az 'events' prop nem tömb! Ez a hiba fő oka lehet. Típusa:", typeof events, "Értéke:", events);
    } else {
      console.log(`[DIAGNOSZTIKA] Az 'events' prop egy tömb, ${events.length} elemmel.`);
    }
  }, [events]);

  const markers = useMemo(() => {
    const todayForCheck = new Date();
    console.log(`[DIAGNOSZTIKA] Marker kalkuláció indul. A 'mai nap' a kódban (a te géped ideje alapján): ${todayForCheck.toISOString()}`);

    const safeEvents = Array.isArray(events) ? events : [];

    return {
      events: safeEvents.flatMap((e) => {
        if (!e || !e.id) {
          console.warn("[FIGYELMEZTETÉS] Egy eseménynek nincs ID-ja:", e);
          return [];
        }
        
        const locs = pickLocations(e);
        if (!locs.length) {
            console.warn(`[FIGYELMEZTETÉS] Az '${e.name}' (ID: ${e.id}) eseménynek nincs érvényes koordinátája.`);
            return [];
        };

        const today = isEventToday(e);
        
        if (e.id === "event-199") {
          console.log(`%c[DIAGNOSZTIKA] A 'tesztesemény' (id: event-199) feldolgozása. Dátuma: ${e.date}. Az 'isEventToday' eredménye: ${today}`, 'color: lime; font-weight: bold;');
        }
        
        return locs.map((pos, idx) => ({ item: e, pos, idx, today }));
      }),
      attractions: (Array.isArray(attractions) ? attractions : []).flatMap(a => pickLocations(a).map((pos, idx) => ({ item: a, pos, idx }))),
      leisure: (Array.isArray(leisure) ? leisure : []).flatMap(l => pickLocations(l).map((pos, idx) => ({ item: l, pos, idx }))),
      restaurants: (Array.isArray(restaurants) ? restaurants : []).flatMap(r => pickLocations(r).map((pos, idx) => ({ item: r, pos, idx }))),
    };
  }, [events, attractions, leisure, restaurants]);

  console.log("[DIAGNOSZTIKA] Kiszámolt markerek (események):", markers.events);
  if (markers.events.length === 0 && Array.isArray(events) && events.length > 0) {
      console.error("[HIBA!] Vannak bejövő események, de a marker lista üres. Valószínűleg a 'pickLocations' függvény nem talál koordinátákat.");
  }

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.CartoLight;
  const close = () => { window.history.length > 1 ? navigate(-1) : navigate('/'); };

  return (
    <div className="relative w-full h-[calc(100dvh-64px)]">
      <button onClick={close} className="absolute top-3 right-3 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100">✕</button>
      
      <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex flex-col gap-1 min-w-[160px]">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Rétegek</span>
          {(['events', 'attractions', 'leisure', 'restaurants']).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!show[key]} onChange={(e) => setShow(s => ({ ...s, [key]: e.target.checked }))} />
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: key === 'events' ? '#ef4444' : key === 'attractions' ? '#3b82f6' : key === 'leisure' ? '#22c55e' : '#f97316' }} />
                {{events: 'Események', attractions: 'Látnivalók', leisure: 'Szabadidő', restaurants: 'Vendéglátó'}[key]}
              </span>
            </label>
          ))}
        </div>
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">Térkép:</label>
          <select value={tileKey} onChange={(e) => setTileKey(e.target.value)} className="text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600">
            {Object.keys(TILE_STYLES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
      
      <div className="absolute bottom-3 right-3 z-[998] bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 text-xs">
        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Jelmagyarázat</div>
        {[ ['events',  '#ef4444',  'Esemény'], ['attractions','#3b82f6','Látnivaló'], ['leisure','#22c55e',   'Szabadidő'], ['restaurants','#f97316','Vendéglátó'], ['user',   '#2563eb',   'Itt vagyok'], ].map(([key, color, label]) => ( <div key={key} className="flex items-center gap-2 mb-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />{label}</div> ))}
        <div className="mt-1 text-[11px] opacity-75">A pulzáló piros pont: ma zajló esemény.</div>
      </div>

      <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tile.url} attribution={tile.attr} />
        <ZoomControl position="bottomleft" />
        
        {show.events && markers.events.map(({ item, pos, idx, today }) => (
          <Marker key={`ev-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={today ? ICONS.eventsToday : ICONS.events}>
            <Popup><div className="text-sm"><div className="font-semibold mb-1">{item.name}</div><div className="text-xs mb-1">🗓 {formatEventWhen(item)}</div>{item.location && <div className="text-xs opacity-80 mb-1">📍 {item.location}</div>}<button className="text-indigo-600 underline text-xs" onClick={() => navigate(`/events/${item.id}`)}>Részletek →</button></div></Popup>
          </Marker>
        ))}
        
        {show.attractions && markers.attractions.map(({ item, pos, idx }) => (
          <Marker key={`at-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.attractions}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.category && <div className="text-xs opacity-80 mb-1">🏷 {item.category}</div>}
                <button className="text-indigo-600 underline text-xs" onClick={() => navigate(`/attractions/${item.id}`)}>
                  Részletek →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {show.leisure && markers.leisure.map(({ item, pos, idx }) => (
          <Marker key={`le-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.leisure}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.category && <div className="text-xs opacity-80 mb-1">🏷 {item.category}</div>}
                <button className="text-indigo-600 underline text-xs" onClick={() => navigate(`/leisure/${item.id}`)}>
                  Részletek →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {show.restaurants && markers.restaurants.map(({ item, pos, idx }) => (
          <Marker key={`re-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.restaurants}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.type && <div className="text-xs opacity-80 mb-1">🍽 {item.type}</div>}
                <button className="text-indigo-600 underline text-xs" onClick={() => navigate(`/gastronomy/${item.id}`)}>
                  Részletek →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
