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
import { parseISO } from 'date-fns';

// FONTOS: a Leaflet CSS-nek *globálisan* be kell lennie húzva (pl. main.jsx vagy index.css):
// import 'leaflet/dist/leaflet.css';

// ===== Ikonok (nagyobb kattintható felület, árnyék, színes pötty) =====
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

const ICONS = {
  events: makeDot('#ef4444'),       // piros
  attractions: makeDot('#3b82f6'),  // kék
  leisure: makeDot('#22c55e'),      // zöld
  restaurants: makeDot('#f97316'),  // narancs
};

// Saját pozíció ikon (kék)
const userIcon = L.divIcon({
  className: 'leaflet-user-icon',
  html: `<span style="
    display:inline-block;width:14px;height:14px;border-radius:50%;
    background:#2563eb; box-shadow:0 0 0 2px #fff, 0 0 6px rgba(0,0,0,.4);
  "></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// ===== Helper: többféle sémából helyszínek kinyerése =====
// Visszatér: [{lat, lng, label?}, ...] (lehet 0, 1 vagy több elem)
function pickLocations(item) {
  if (!item) return [];

  // ÚJ többhelyszínű séma: locations: [{lat,lng,label?}, ...]
  if (Array.isArray(item.locations)) {
    return item.locations
      .map((p) => normalizeLatLng(p))
      .filter(Boolean);
  }

  // Régi egyhelyszínű sémák: coords / coordinates / location.coords / stb.
  const c =
    item.coords ||
    item.coordinates ||
    item.coordinate ||
    item.location?.coords ||
    item.location?.coordinates ||
    null;

  if (c) {
    const single = normalizeLatLng(c);
    return single ? [single] : [];
  }

  // Esetleg közvetlen lat/lng mezők
  const fallback = normalizeLatLng(item);
  return fallback ? [fallback] : [];
}

function normalizeLatLng(obj) {
  if (!obj) return null;
  // lat/lng számszerűen
  if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    const out = { lat: obj.lat, lng: obj.lng };
    if (obj.label) out.label = String(obj.label);
    return out;
  }
  return null;
}

// ===== Hónapnevek (selecthez) =====
const MONTHS_HU = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

// ===== Térkép csempestílusok (OSM / OpenMapTiles variánsok) =====
const TILE_STYLES = {
  OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
  },
  CartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const navigate = useNavigate();

  // Középpont: Kőszeg belváros
  const center = [47.3896, 16.5402];

  // UI állapotok
  const [tileKey, setTileKey] = useState('OSM');
  const [month, setMonth] = useState(new Date().getMonth()); // 0..11
  const [show, setShow] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });

  // Saját pozíció
  const [userPos, setUserPos] = useState(null);

  // Geolokáció bekapcsolása (egyszer)
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
      },
      (err) => {
        // csendben lenyeljük, ha tiltva van
        console.warn('Geolocation hiba:', err?.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 10_000,
      }
    );
    return () => {
      try { navigator.geolocation.clearWatch(watchId); } catch {}
    };
  }, []);

  // Események havi szűrése
  const monthlyEvents = useMemo(() => {
    const safe = Array.isArray(events) ? events : [];
    return safe.filter((e) => {
      // _s (normalizált) vagy date -> parseISO
      const start = e?._s
        ? new Date(e._s)
        : (e?.date ? parseISO(e.date) : null);

      if (!start || isNaN(start)) return false;
      return start.getMonth() === month;
    });
  }, [events, month]);

  // Marker listák (csak valós koordináták esetén)
  const markers = useMemo(() => {
    return {
      events: monthlyEvents
        .flatMap((e) => {
          const locs = pickLocations(e);
          if (!locs.length) return [];
          return locs.map((pos, idx) => ({ item: e, pos, idx }));
        }),
      attractions: (Array.isArray(attractions) ? attractions : [])
        .flatMap((a) => {
          const locs = pickLocations(a);
          if (!locs.length) return [];
          return locs.map((pos, idx) => ({ item: a, pos, idx }));
        }),
      leisure: (Array.isArray(leisure) ? leisure : [])
        .flatMap((l) => {
          const locs = pickLocations(l);
          if (!locs.length) return [];
          return locs.map((pos, idx) => ({ item: l, pos, idx }));
        }),
      restaurants: (Array.isArray(restaurants) ? restaurants : [])
        .flatMap((r) => {
          const locs = pickLocations(r);
          if (!locs.length) return [];
          return locs.map((pos, idx) => ({ item: r, pos, idx }));
        }),
    };
  }, [monthlyEvents, attractions, leisure, restaurants]);

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.OSM;

  // Okos bezárás: ha van visszaút, lépjünk vissza, különben Home
  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="relative w-full h-[calc(100dvh-64px)]">
      {/* Bezáró X (fehér kör, fekete vastag X) */}
      <button
        onClick={close}
        className="absolute top-3 right-3 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100"
        aria-label="Bezárás"
        title="Bezárás"
      >
        ✕
      </button>

      {/* Vezérlőpanel (mobilon is jól látható) */}
      <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2">
        {/* Hónap választó */}
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">Hónap:</label>
          <select
            className="text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS_HU.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>

        {/* Rétegek kapcsolók */}
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
                {/* kis színminta */}
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    background:
                      key === 'events' ? '#ef4444' :
                      key === 'attractions' ? '#3b82f6' :
                      key === 'leisure' ? '#22c55e' :
                      '#f97316'
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

        {/* Térkép-stílus választó */}
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">Térkép:</label>
          <select
            className="text-sm bg-white dark:bg-gray-700 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
            value={tileKey}
            onChange={(e) => setTileKey(e.target.value)}
          >
            {Object.keys(TILE_STYLES).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jelmagyarázat */}
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
      </div>

      {/* A tényleges térkép */}
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={tile.url} attribution={tile.attr} />
        <ZoomControl position="bottomleft" />

        {/* Saját pozíció */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>📍 Itt vagy most</Popup>
          </Marker>
        )}

        {/* Események */}
        {show.events && markers.events.map(({ item, pos, idx }) => (
          <Marker key={`ev-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.events}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {pos.label && <div className="text-xs opacity-80 mb-1">📍 {pos.label}</div>}
                {!pos.label && item.location && <div className="text-xs opacity-80 mb-1">📍 {item.location}</div>}
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

        {/* Látnivalók */}
        {show.attractions && markers.attractions.map(({ item, pos, idx }) => (
          <Marker key={`at-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.attractions}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.category && <div className="text-xs opacity-80 mb-1">🏷 {item.category}</div>}
                <button
                  className="text-indigo-600 underline text-xs"
                  onClick={() => navigate(`/attractions/${item.id}`)}
                >
                  Részletek →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Szabadidő */}
        {show.leisure && markers.leisure.map(({ item, pos, idx }) => (
          <Marker key={`le-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.leisure}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.category && <div className="text-xs opacity-80 mb-1">🏷 {item.category}</div>}
                <button
                  className="text-indigo-600 underline text-xs"
                  onClick={() => navigate(`/leisure/${item.id}`)}
                >
                  Részletek →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vendéglátó */}
        {show.restaurants && markers.restaurants.map(({ item, pos, idx }) => (
          <Marker key={`re-${item.id}-${idx}`} position={[pos.lat, pos.lng]} icon={ICONS.restaurants}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
                {item.type && <div className="text-xs opacity-80 mb-1">🍽 {item.type}</div>}
                <button
                  className="text-indigo-600 underline text-xs"
                  onClick={() => navigate(`/gastronomy/${item.id}`)}
                >
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
