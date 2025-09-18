// src/components/LiveCityMap.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- Segédek: coords vs coordinates egységesítés ---
function hasCoords(item) {
  if (!item) return false;
  if (item.coords && typeof item.coords.lat === 'number' && typeof item.coords.lng === 'number') return true;
  if (item.coordinates && typeof item.coordinates.lat === 'number' && typeof item.coordinates.lng === 'number') return true;
  if (typeof item.lat === 'number' && typeof item.lng === 'number') return true;
  return false;
}

function getLatLng(item) {
  if (item?.coords) return [item.coords.lat, item.coords.lng];
  if (item?.coordinates) return [item.coordinates.lat, item.coordinates.lng];
  if (typeof item?.lat === 'number' && typeof item?.lng === 'number') return [item.lat, item.lng];
  return null;
}

// --- Dátum segéd: esemény hónapja (1..12) ---
function getEventMonth(evt) {
  // prefer date; ha nincs, megpróbáljuk idopont (HU mező a külön bejegyzésekhez)
  const iso = evt?.date || evt?.idopont || evt?._s;
  if (!iso) return null;
  const d = typeof iso === 'string' ? new Date(iso) : iso instanceof Date ? iso : null;
  if (!d || isNaN(+d)) return null;
  return d.getMonth() + 1;
}

const LAYER_COLORS = {
  events:    { color: '#ef4444', label: 'Események' },       // piros
  attractions:{ color: '#3b82f6', label: 'Látnivalók' },     // kék
  leisure:   { color: '#10b981', label: 'Szabadidő' },       // zöld
  restaurants:{ color: '#8b5cf6', label: 'Vendéglátó' },     // lila
};

export default function LiveCityMap({
  // biztonság kedvéért adunk alapértéket, így sosem lesz undefined és nem fog "map of undefined"-ra elszállni
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
  center = [47.3895, 16.5404],
  zoom = 14,
}) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [showLayer, setShowLayer] = useState({
    events: true,
    attractions: true,
    leisure: true,
    restaurants: true,
  });

  // Események hónap szűrése
  const monthEvents = useMemo(() => {
    return (events || []).filter(e => {
      if (!hasCoords(e)) return false;
      const m = getEventMonth(e);
      return m === selectedMonth; // egyszerű, gyors szűrés a kezdőnap hónapjára
    });
  }, [events, selectedMonth]);

  const listedAttractions = useMemo(() => (attractions || []).filter(hasCoords), [attractions]);
  const listedLeisure     = useMemo(() => (leisure || []).filter(hasCoords), [leisure]);
  const listedRestaurants = useMemo(() => (restaurants || []).filter(hasCoords), [restaurants]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="w-full h-full">
        {/* CARTO Voyager – szebb, tisztább, kontrasztos */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* ESEMÉNYEK */}
        {showLayer.events && monthEvents.map(evt => {
          const pos = getLatLng(evt);
          if (!pos) return null;
          return (
            <CircleMarker
              key={`e-${evt.id}`}
              center={pos}
              radius={8}
              pathOptions={{ color: LAYER_COLORS.events.color, fillColor: LAYER_COLORS.events.color, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong className="block text-sm">{evt.name || evt.nev || 'Esemény'}</strong>
                  {evt.date && <div className="text-xs opacity-80">📅 {evt.date}{evt.time ? ` • ${evt.time}` : ''}</div>}
                  {!evt.date && evt.idopont && <div className="text-xs opacity-80">📅 {new Date(evt.idopont).toLocaleString('hu-HU')}</div>}
                  {evt.location && <div className="text-xs">📍 {evt.location}</div>}
                  {evt.description && <div className="text-xs">{evt.description}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* LÁTNIVALÓK */}
        {showLayer.attractions && listedAttractions.map(a => {
          const pos = getLatLng(a);
          if (!pos) return null;
          return (
            <CircleMarker
              key={`a-${a.id}`}
              center={pos}
              radius={7}
              pathOptions={{ color: LAYER_COLORS.attractions.color, fillColor: LAYER_COLORS.attractions.color, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong className="block text-sm">{a.name}</strong>
                  {a.category && <div className="text-xs opacity-80">{a.category}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* SZABADIDŐ */}
        {showLayer.leisure && listedLeisure.map(l => {
          const pos = getLatLng(l);
          if (!pos) return null;
          return (
            <CircleMarker
              key={`l-${l.id}`}
              center={pos}
              radius={7}
              pathOptions={{ color: LAYER_COLORS.leisure.color, fillColor: LAYER_COLORS.leisure.color, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong className="block text-sm">{l.name}</strong>
                  {l.category && <div className="text-xs opacity-80">{l.category}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* VENDÉGLÁTÓ */}
        {showLayer.restaurants && listedRestaurants.map(r => {
          const pos = getLatLng(r);
          if (!pos) return null;
          return (
            <CircleMarker
              key={`r-${r.id}`}
              center={pos}
              radius={7}
              pathOptions={{ color: LAYER_COLORS.restaurants.color, fillColor: LAYER_COLORS.restaurants.color, fillOpacity: 0.85 }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong className="block text-sm">{r.name}</strong>
                  {r.type && <div className="text-xs opacity-80">{r.type}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Mobil-barát vezérlők (jobb felső sarok) */}
      <div className="absolute right-2 top-2 z-[1000] flex flex-col gap-2">
        {/* Hónapválasztó */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded-lg shadow border border-black/10">
          <label htmlFor="month" className="text-[11px] block mb-1 opacity-70">Hónap</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="text-sm bg-transparent outline-none"
          >
            {['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Rétegválasztó + legenda */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2 rounded-lg shadow border border-black/10 min-w-[160px]">
          <div className="text-[11px] mb-1 opacity-70">Rétegek</div>
          {Object.entries(LAYER_COLORS).map(([key, meta]) => (
            <label key={key} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={!!showLayer[key]}
                onChange={() => setShowLayer(s => ({ ...s, [key]: !s[key] }))}
              />
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />
              <span className="text-sm">{meta.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
