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
import {
  parseISO,
  isWithinInterval,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

// --- pötty ikonok ---
const makeDot = (hex) =>
  L.divIcon({
    className: 'leaflet-dot-icon',
    html: `<span style="
      display:inline-block;width:12px;height:12px;border-radius:50%;
      background:${hex}; box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

// pulzáló változat (körgyűrű + középpont)
const makePulsingDot = (hex) =>
  L.divIcon({
    className: 'leaflet-pulse-dot',
    html: `
      <span class="pulse-ring"></span>
      <span style="
        display:inline-block;width:12px;height:12px;border-radius:50%;
        background:${hex}; box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);
        position:relative;
      "></span>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const ICONS = {
  events: makeDot('#ef4444'),
  eventsToday: makePulsingDot('#ef4444'),
  attractions: makeDot('#3b82f6'),
  leisure: makeDot('#22c55e'),
  restaurants: makeDot('#f97316'),
};

const userIcon = L.divIcon({
  className: 'leaflet-user-icon',
  html: `<span style="
    display:inline-block;width:14px;height:14px;border-radius:50%;
    background:#2563eb; box-shadow:0 0 0 2px #fff, 0 0 6px rgba(0,0,0,.4);
  "></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// ---- többhelyszín támogatás ----
function normalizeLatLng(obj) {
  if (!obj) return null;
  if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    const out = { lat: obj.lat, lng: obj.lng };
    if (obj.label) out.label = String(obj.label);
    return out;
  }
  return null;
}
function pickLocations(item) {
  if (!item) return [];
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

// ---- Időpont formázás a popup-ba ----
function formatEventWhen(e) {
  const s = e.date ? parseISO(e.date) : null;
  const ee = e.end_date ? parseISO(e.end_date) : null;

  if (!s || isNaN(s)) return e.time ? e.time : 'Időpont később';

  const pad = (n) => String(n).padStart(2, '0');
  const d = (dt) => `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`;

  if (e.time && e.time.trim()) {
    if (ee && !isNaN(ee) && d(s) !== d(ee)) return `${d(s)} – ${d(ee)} • ${e.time}`;
    return `${d(s)} • ${e.time}`;
  }
  if (ee && !isNaN(ee) && d(s) !== d(ee)) return `${d(s)} – ${d(ee)}`;
  return d(s);
}

// ---- Ma zajlik-e? (A legmegbízhatóbb verzió) ----
function isEventToday(e) {
  const today = new Date();
  const startDate = e.date ? parseISO(e.date) : null;

  if (!startDate || isNaN(startDate)) {
    return false;
  }

  const endDateString = e.end_date || e.date;
  const parsedEndDate = parseISO(endDateString);
  const effectiveEndDate = (!parsedEndDate || isNaN(parsedEndDate)) ? startDate : parsedEndDate;

  const interval = {
    start: startDate,
    end: endOfDay(effectiveEndDate),
  };

  return isWithinInterval(today, interval);
}

const MONTHS_HU = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Szep','Okt','Nov','Dec'];

const TILE_STYLES = {
  CartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; OpenStreetMap &copy; CARTO',
  },
  OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors',
  },
};

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const navigate = useNavigate();
  const center = [47.3896, 16.5402];

  const [tileKey, setTileKey] = useState('CartoLight');
  const [month, setMonth] = useState(new Date().getMonth());
  const [show, setShow] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => { try { navigator.geolocation.clearWatch(id); } catch {} };
  }, []);

  // HÓNAP SZERINTI SZŰRÉS: Csak az adott hónap eseményeit mutatjuk
  const monthlyEvents = useMemo(() => {
    const safe = Array.isArray(events) ? events : [];
    
    const refDateForMonth = new Date();
    refDateForMonth.setMonth(month);
    
    const monthStart = startOfMonth(refDateForMonth);
    const monthEnd = endOfMonth(refDateForMonth);

    return safe.filter((e) => {
      const startDate = e.date ? parseISO(e.date) : null;
      if (!startDate || isNaN(startDate)) return false;

      const endDateString = e.end_date || e.date;
      const parsedEndDate = parseISO(endDateString);
      const effectiveEndDate = (!parsedEndDate || isNaN(parsedEndDate)) ? startDate : parsedEndDate;
      
      return startDate <= monthEnd && effectiveEndDate >= monthStart;
    });
  }, [events, month]);

  // MARKEREK LÉTREHOZÁSA a szűrt eseményekből
  const markers = useMemo(() => ({
    events: monthlyEvents.flatMap((e) => {
      const locs = pickLocations(e);
      if (!locs.length) return [];
      const today = isEventToday(e);
      return locs.map((pos, idx) => ({ item: e, pos, idx, today }));
    }),
    attractions: (Array.isArray(attractions) ? attractions : []).flatMap((a) => {
      const locs = pickLocations(a);
      return locs.map((pos, idx) => ({ item: a, pos, idx }));
    }),
    leisure: (Array.isArray(leisure) ? leisure : []).flatMap((l) => {
      const locs = pickLocations(l);
      return locs.map((pos, idx) => ({ item: l, pos, idx }));
    }),
    restaurants: (Array.isArray(restaurants) ? restaurants : []).flatMap((r) => {
      const locs = pickLocations(r);
      return locs.map((pos, idx) => ({ item: r, pos, idx }));
    }),
  }), [monthlyEvents, attractions, leisure, restaurants]);

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.CartoLight;

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative w-full h-[calc(100dvh-64px)]">
      <button
        onClick={close}
        className="absolute top-3 right-3 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100"
        aria-label="Bezárás"
        title="Bezárás"
      >
        ✕
      </button>

      <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">Hónap:</label>
          <select
            className="text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS_HU.map((m, i) => (<option key={m} value={i}>{m}</option>))}
          </select>
        </div>

        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex flex-col gap-1 min-w-[160px]">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Rétegek</span>
          {(['events','attractions','leisure','restaurants']).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!show[key]}
                onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))}
              />
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    background:
                      key === 'events' ? '#ef4444' :
                      key === 'attractions' ? '#3b82f6' :
                      key === 'leisure' ? '#22c55e' : '#f97316'
                  }}
                />
                {key === 'events' && 'Események'}
                {key === 'attractions' && 'Látnivalók'}
                {key === 'leisure' && 'Szabadidő'}
                {key === 'restaurants' && 'Vendéglátó'}
              </span>
            </label>
          ))}
        </div>

        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">Térkép:</label>
          <select
            className="text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
            value={tileKey}
            onChange={(e) => setTileKey(e.target.value)}
          >
            {Object.keys(TILE_STYLES).map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-[998] bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 text-xs">
        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Jelmagyarázat</div>
        {[
          ['events',  '#ef4444',  'Esemény'],
          ['attractions','#3b82f6','Látnivaló'],
          ['leisure','#22c55e',   'Szabadidő'],
          ['restaurants','#f97316','Vendéglátó'],
          ['user',   '#2563eb',   'Itt vagyok'],
        ].map(([key, color, label]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="mt-1 text-[11px] opacity-75">A pulzáló piros pont: ma zajló esemény.</div>
      </div>

      <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tile.url} attribution={tile.attr} />
        <ZoomControl position="bottomleft" />

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>📍 Itt vagy most</Popup>
          </Marker>
        )}

        {show.events && markers.events.map(({ item, pos, idx, today }) => (
          <Marker
            key={`ev-${item.id}-${idx}`}
            position={[pos.lat, pos.lng]}
            icon={today ? ICONS.eventsToday : ICONS.events}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                <div className="text-xs mb-1">🗓 {formatEventWhen(item)}</div>
                {item.location && <div className="text-xs opacity-80 mb-1">📍 {item.location}</div>}
                <button
                  className="text-indigo-600 underline text-xs"
                  onClick={() => navigate(`/events/${item.id}`)}
                >
                  Részletek →
                </button>
              </div>
            </Popup>
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
