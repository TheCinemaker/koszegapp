// src/components/LiveCityMap.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// FONTOS: legyen a leaflet CSS importálva valahol globálisan (pl. main.jsx / index.css-ben):
// import 'leaflet/dist/leaflet.css';

const MONTHS_HU = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Szep','Okt','Nov','Dec'];

// Egyszerű színes pötty ikon (divIcon)
function dotIcon(color = '#2563eb') {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:inline-block;
      width:14px;height:14px;border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 0 1px rgba(0,0,0,.25);
      "></span>`,
    iconSize: [16,16],
    iconAnchor: [8,8],
  });
}

// --- Biztonságos segédek ---
const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const hasCoords = (x) => !!(x && x.coords && typeof x.coords.lat === 'number' && typeof x.coords.lng === 'number');

// Esemény dátum hónap kivonása (date vagy _s alapján)
function eventMonth(evt) {
  try {
    if (evt?._s instanceof Date && !isNaN(evt._s)) return evt._s.getMonth(); // 0-11
    if (evt?.date) {
      const d = new Date(evt.date);
      if (!isNaN(d)) return d.getMonth();
    }
  } catch {}
  return null;
}

export default function LiveCityMap({
  // alapértelmezett üres tömbök — így nem lesz undefined.map hiba
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
  // város közép
  center = [47.3896, 16.5402],
  zoom = 14
}) {
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth()); // 0..11, aktuális hónap
  const [layers, setLayers] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });

  // Színkódok
  const COLORS = {
    events: '#e11d48',       // rózsaszín/piros
    attractions: '#2563eb',  // kék
    leisure: '#16a34a',      // zöld
    restaurants: '#f59e0b',  // sárga/narancs
  };

  // Marker ikonok cache-elve
  const ICONS = useMemo(() => ({
    events: dotIcon(COLORS.events),
    attractions: dotIcon(COLORS.attractions),
    leisure: dotIcon(COLORS.leisure),
    restaurants: dotIcon(COLORS.restaurants),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // Hónap chip-sor (mobilbarát, vízszintesen görgethető)
  const MonthChips = (
    <div className="fixed left-0 right-0 top-[64px] z-[401] px-3">
      <div className="w-full max-w-screen mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow border border-black/5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2">
          {MONTHS_HU.map((m, idx) => (
            <button
              key={m}
              onClick={() => setMonthIdx(idx)}
              className={
                'px-3 py-1 rounded-full text-sm shrink-0 ' +
                (monthIdx === idx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100')
              }
              aria-pressed={monthIdx === idx}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Rétegkapcsolók (jobb felső sarok)
  const LayerToggles = (
    <div className="fixed right-3 top-[116px] z-[402]">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow border border-black/5 p-2 space-y-1">
        {[
          ['events', 'Események'],
          ['attractions', 'Látnivalók'],
          ['leisure', 'Szabadidő'],
          ['restaurants', 'Vendéglátó'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!layers[key]}
              onChange={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
            />
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: COLORS[key] }}
              />
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  // Legenda (alsó közép, mindig látszik)
  const LegendBar = (
    <div className="fixed bottom-3 left-3 right-3 z-[402]">
      <div className="mx-auto max-w-screen-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow border border-black/5 px-3 py-2 flex items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.events }} /> Esemény
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.attractions }} /> Látnivaló
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.leisure }} /> Szabadidő
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.restaurants }} /> Vendéglátó
        </span>
      </div>
    </div>
  );

  // ESEMÉNYEK — hónap szerinti szűrés + coords guard
  const monthEvents = useMemo(() => {
    const list = toArray(events).filter(Boolean);
    return list.filter(evt => {
      if (!hasCoords(evt)) return false;
      const m = eventMonth(evt);
      return m === monthIdx;
    });
  }, [events, monthIdx]);

  // A TÖBBI RÉTEG — csak coords guard, nincs hónap szűrés
  const poiAttractions = useMemo(() => toArray(attractions).filter(hasCoords), [attractions]);
  const poiLeisure = useMemo(() => toArray(leisure).filter(hasCoords), [leisure]);
  const poiRestaurants = useMemo(() => toArray(restaurants).filter(hasCoords), [restaurants]);

  return (
    <div className="relative w-full h-[calc(100vh-112px)] md:h-[calc(100vh-96px)] rounded-xl overflow-hidden">
      {/* UI elemek */}
      {MonthChips}
      {LayerToggles}
      {LegendBar}

      {/* Térkép */}
      <MapContainer center={center} zoom={zoom} className="w-full h-full z-[400]">
        <TileLayer
          // Szép alapcsempék, ingyenes
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap'
        />

        {/* Események */}
        {layers.events && monthEvents.map(evt => (
          <Marker
            key={`evt-${evt.id}`}
            position={[evt.coords.lat, evt.coords.lng]}
            icon={ICONS.events}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold">{evt.name}</div>
                {evt.date && (
                  <div className="text-xs opacity-80 mt-1">
                    {evt.end_date && evt.end_date !== evt.date
                      ? `${evt.date} – ${evt.end_date}`
                      : evt.date}
                    {evt.time ? ` • ${evt.time}` : ''}
                  </div>
                )}
                {evt.location && (
                  <div className="text-xs mt-1">📍 {evt.location}</div>
                )}
                <a
                  className="inline-block mt-2 text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                  href={`/events/${evt.id}`}
                >
                  Részletek
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Látnivalók */}
        {layers.attractions && poiAttractions.map(a => (
          <Marker
            key={`att-${a.id}`}
            position={[a.coords.lat, a.coords.lng]}
            icon={ICONS.attractions}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold">{a.name}</div>
                {a.location && <div className="text-xs mt-1">📍 {a.location}</div>}
                <a
                  className="inline-block mt-2 text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  href={`/attractions/${a.id}`}
                >
                  Részletek
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Szabadidő */}
        {layers.leisure && poiLeisure.map(l => (
          <Marker
            key={`lei-${l.id}`}
            position={[l.coords.lat, l.coords.lng]}
            icon={ICONS.leisure}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold">{l.name}</div>
                {l.location && <div className="text-xs mt-1">📍 {l.location}</div>}
                <a
                  className="inline-block mt-2 text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                  href={`/leisure/${l.id}`}
                >
                  Részletek
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vendéglátó */}
        {layers.restaurants && poiRestaurants.map(r => (
          <Marker
            key={`res-${r.id}`}
            position={[r.coords.lat, r.coords.lng]}
            icon={ICONS.restaurants}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold">{r.name}</div>
                {r.location && <div className="text-xs mt-1">📍 {r.location}</div>}
                <a
                  className="inline-block mt-2 text-xs px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                  href={`/gastronomy/${r.id}`}
                >
                  Részletek
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
