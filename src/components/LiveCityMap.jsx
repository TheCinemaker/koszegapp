// src/components/LiveCityMap.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer, TileLayer, Marker, Popup, ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import { parseISO, isSameDay, isWithinInterval } from 'date-fns';

// --- ikonok ---
const makeDot = (hex) => L.divIcon({
  className: 'leaflet-dot-icon',
  html: `<span style="
    display:inline-block;width:12px;height:12px;border-radius:50%;
    background:${hex}; box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);
  "></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
const makePulsingDot = (hex) => L.divIcon({
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

// --- többhelyszín ---
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
  const c = item.coords || item.coordinates || item.coordinate || item.location?.coords || item.location?.coordinates || null;
  if (c) { const one = normalizeLatLng(c); return one ? [one] : []; }
  const fb = normalizeLatLng(item);
  return fb ? [fb] : [];
}

// --- idő formázó & “ma” detektálás ---
function formatEventWhen(e) {
  const s = e?._s ? new Date(e._s) : (e?.date ? parseISO(e.date) : null);
  const ee = e?._e ? new Date(e._e) : (e?.end_date ? parseISO(e.end_date) : s);
  if (!s) return e.time?.trim() || 'Időpont később';
  const pad = (n) => String(n).padStart(2, '0');
  const d = (dt) => `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`;
  if (e.time?.trim()) return ee && d(s) !== d(ee) ? `${d(s)} – ${d(ee)} • ${e.time}` : `${d(s)} • ${e.time}`;
  return ee && d(s) !== d(ee) ? `${d(s)} – ${d(ee)}` : d(s);
}
function isEventToday(e) {
  const today = new Date();
  const s = e?._s ? new Date(e._s) : (e?.date ? parseISO(e.date) : null);
  const ee = e?._e ? new Date(e._e) : (e?.end_date ? parseISO(e.end_date) : s);
  if (!s) return false;
  if (!ee) return isSameDay(today, s);
  return isSameDay(today, s) || isSameDay(today, ee) || isWithinInterval(today, { start: s, end: ee });
}

const MONTHS_HU = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
const TILE_STYLES = {
  OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors',
  },
  CartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; OSM & CARTO',
  },
  CartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; OSM & CARTO',
  },
  StadiaAlidade: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attr: '&copy; Stadia Maps & OpenMapTiles & OSM',
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

  const [tileKey, setTileKey] = useState('OSM');
  const [month, setMonth] = useState(new Date().getMonth());
  const [show, setShow] = useState({ events: true, attractions: true, leisure: true, restaurants: true });
  const [userPos, setUserPos] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true); // ÖSSZECSUKHATÓ panel

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => { try { navigator.geolocation.clearWatch(id); } catch {} };
  }, []);

  const monthlyEvents = useMemo(() => {
    const safe = Array.isArray(events) ? events : [];
    return safe.filter((e) => {
      const s = e?._s ? new Date(e._s) : (e?.date ? parseISO(e.date) : null);
      if (!s || isNaN(s)) return false;
      return s.getMonth() === month;
    });
  }, [events, month]);

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

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.OSM;

  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    // FIXED & INSET: 15px margó minden oldalon (safe-area-val)
    <div
      className="fixed z-40"
      style={{
        top: 'max(15px, env(safe-area-inset-top))',
        left: 'max(15px, env(safe-area-inset-left))',
        right: 'max(15px, env(safe-area-inset-right))',
        bottom: 'max(15px, env(safe-area-inset-bottom))',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,.2)',
        background: 'var(--map-bg, #fff)',
      }}
    >
      {/* Bezárás (kicsi, fehér kör) */}
      <button
        onClick={close}
        className="absolute top-2 right-2 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100"
        aria-label="Bezárás"
        title="Bezárás"
      >
        ✕
      </button>

      {/* Panel toggler – kis kör gomb, bal felső sarok */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="absolute top-2 left-2 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100"
        aria-label="Vezérlők"
        title="Vezérlők"
      >
        ⚙️
      </button>

      {/* Összecsukható panel */}
      {panelOpen && (
        <div className="absolute top-12 left-2 z-[999] flex flex-col gap-2 w-[min(86vw,280px)]">
          {/* Hónap */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">Hónap:</label>
            <select
              className="flex-1 text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS_HU.map((m, i) => (<option key={m} value={i}>{m}</option>))}
            </select>
          </div>

          {/* Rétegek */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex flex-col gap-1">
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

          {/* Tile-választó */}
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">Térkép:</label>
            <select
              className="flex-1 text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
              value={tileKey}
              onChange={(e) => setTileKey(e.target.value)}
            >
              {Object.keys(TILE_STYLES).map((k) => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
        </div>
      )}

      {/* Legend – jobb alsó sarok, kompakt kártya */}
      <div className="absolute bottom-2 right-2 z-[998] bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 text-[11px]">
        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Jelmagyarázat</div>
        {[
          ['events',  '#ef4444',  'Esemény (ma: pulzál)'],
          ['attractions','#3b82f6','Látnivaló'],
          ['leisure','#22c55e',   'Szabadidő'],
          ['restaurants','#f97316','Vendéglátó'],
          ['user',   '#2563eb',   'Itt vagyok'],
        ].map(([key, color, label]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-[11px]">{label}</span>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div className="w-[calc(100vw-30px- env(safe-area-inset-left) - env(safe-area-inset-right))] h-[calc(100vh-30px- env(safe-area-inset-top) - env(safe-area-inset-bottom))]">
        <MapContainer
          center={center}
          zoom={14}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer url={tile.url} attribution={tile.attr} />
          <ZoomControl position="bottomleft" />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>📍 Itt vagy most</Popup>
            </Marker>
          )}

          {/* események */}
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
                  {pos.label && <div className="text-xs opacity-80 mb-1">📍 {pos.label}</div>}
                  {!pos.label && item.location && <div className="text-xs opacity-80 mb-1">📍 {item.location}</div>}
                  <button className="text-indigo-600 underline text-xs" onClick={() => navigate(`/events/${item.id}`)}>
                    Részletek →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* látnivalók */}
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

          {/* szabadidő */}
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

          {/* vendéglátó */}
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
    </div>
  );
}