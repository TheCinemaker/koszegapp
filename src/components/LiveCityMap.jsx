// src/components/LiveCityMap.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import { parseISO } from 'date-fns';

// FONTOS: legyen a leaflet CSS importálva valahol globálisan (pl. main.jsx / index.css-ben):
// import 'leaflet/dist/leaflet.css';

// --- KÖNNYEBBEN KATTINTHATÓ Ikonok ---
const makeDot = (hex) =>
  L.divIcon({
    className: 'leaflet-dot-icon',
    html: `<span style="
      display:inline-block;width:12px;height:12px;border-radius:50%;
      background:${hex}; box-shadow:0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.35);
      "></span>`,
    iconSize: [30, 30], // megnövelt kattintási felület
    iconAnchor: [15, 15], // középre igazítás
  });

const ICONS = {
  events: makeDot('#ef4444'),       // piros
  attractions: makeDot('#3b82f6'),  // kék
  leisure: makeDot('#22c55e'),      // zöld
  restaurants: makeDot('#f97316'),  // narancs
};

// --- Helper: biztonságos koordináta kinyerés több sémából ---
function pickLatLng(item) {
  if (!item) return null;
  const c =
    item.coords ||
    item.coordinates ||
    item.coordinate ||
    item.location?.coords ||
    item.location?.coordinates ||
    null;

  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
    return { lat: c.lat, lng: c.lng };
  }
  if (typeof item.lat === 'number' && typeof item.lng === 'number') {
    return { lat: item.lat, lng: item.lng };
  }
  return null;
}

// --- hónapnév tömb a selecthez ---
const MONTHS_HU = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

// --- csempestílusok (szebb mint az alap) ---
const TILE_STYLES = {
  CartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  CartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  StadiaAlidade: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
};

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const navigate = useNavigate();

  // térkép közép: Kőszeg belváros
  const center = [47.3896, 16.5402];

  // ui state
  const [tileKey, setTileKey] = useState('CartoLight');
  const [month, setMonth] = useState(new Date().getMonth()); // 0..11
  const [show, setShow] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });

  // --- ESEMÉNYEK: hónapra szűrés ---
  const monthlyEvents = useMemo(() => {
    const safe = Array.isArray(events) ? events : [];
    return safe.filter((e) => {
      const start = e._s ? new Date(e._s) : (e.date ? parseISO(e.date) : null);
      if (!start || isNaN(start)) return false;
      return start.getMonth() === month;
    });
  }, [events, month]);

  // --- Marker listák (csak valós coords-szal) ---
  const markers = useMemo(() => {
    return {
      events: monthlyEvents
        .map((e) => ({ item: e, pos: pickLatLng(e) }))
        .filter((x) => !!x.pos),
      attractions: (Array.isArray(attractions) ? attractions : [])
        .map((a) => ({ item: a, pos: pickLatLng(a) }))
        .filter((x) => !!x.pos),
      leisure: (Array.isArray(leisure) ? leisure : [])
        .map((l) => ({ item: l, pos: pickLatLng(l) }))
        .filter((x) => !!x.pos),
      restaurants: (Array.isArray(restaurants) ? restaurants : [])
        .map((r) => ({ item: r, pos: pickLatLng(r) }))
        .filter((x) => !!x.pos),
    };
  }, [monthlyEvents, attractions, leisure, restaurants]);

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.CartoLight;

  return (
    <div className="relative w-full h-[calc(100dvh-64px)]">
      {/* Bezáró „X” gomb (fehér kör, fekete vastag X) */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-3 right-3 z-[1000] w-8 h-8 rounded-full bg-white text-black font-bold shadow-md flex items-center justify-center hover:bg-gray-100"
        aria-label="Bezárás"
        title="Bezárás"
      >
        ✕
      </button>

      {/* Vezérlő panel – mobilon is látható */}
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
          {Object.entries(show).map(([key, isVisible]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))}
              />
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: ICONS[key].options.html.match(/background:(.*?);/)?.[1] }} />
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

      {/* Legend – jobb alsó sarok */}
      <div className="absolute bottom-3 right-3 z-[998] bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-md p-2 text-xs">
        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Jelmagyarázat</div>
        {Object.entries(ICONS).map(([key, icon]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: icon.options.html.match(/background:(.*?);/)?.[1] }}
            />
            {key === 'events' && 'Esemény'}
            {key === 'attractions' && 'Látnivaló'}
            {key === 'leisure' && 'Szabadidő'}
            {key === 'restaurants' && 'Vendéglátó'}
          </div>
        ))}
      </div>

      {/* A tényleges Leaflet térkép */}
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={tile.url} attribution={tile.attr} />
        <ZoomControl position="bottomleft" />

        {/* Események */}
        {show.events && markers.events.map(({ item, pos }) => (
          <Marker key={`ev-${item.id}`} position={[pos.lat, pos.lng]} icon={ICONS.events}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{item.name}</div>
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

        {/* LÁTNIVALÓK */}
        {show.attractions && markers.attractions.map(({ item, pos }) => (
          <Marker key={`at-${item.id}`} position={[pos.lat, pos.lng]} icon={ICONS.attractions}>
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

        {/* SZABADIDŐ */}
        {show.leisure && markers.leisure.map(({ item, pos }) => (
          <Marker key={`le-${item.id}`} position={[pos.lat, pos.lng]} icon={ICONS.leisure}>
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

        {/* VENDÉGLÁTÓ */}
        {show.restaurants && markers.restaurants.map(({ item, pos }) => (
          <Marker key={`re-${item.id}`} position={[pos.lat, pos.lng]} icon={ICONS.restaurants}>
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
