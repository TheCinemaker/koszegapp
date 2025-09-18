// src/components/LiveCityMap.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  startOfMonth,
  endOfMonth,
  areIntervalsOverlapping,
  format
} from 'date-fns';

// Alap ikon fix Leaflet-hez (hogy látszódjon a marker)
const icon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -30],
  shadowSize: [41, 41]
});

// Helper: eldönti, hogy az esemény időintervalluma metszi-e az adott hónapot
function eventOverlapsMonth(evt, monthDate) {
  if (!evt?._s || !evt?._e) return false;
  const mStart = startOfMonth(monthDate);
  const mEnd = endOfMonth(monthDate);
  return areIntervalsOverlapping(
    { start: evt._s, end: evt._e },
    { start: mStart, end: mEnd },
    { inclusive: true }
  );
}

// Hónap címkék HU
const MONTH_LABELS = [
  'Január','Február','Március','Április','Május','Június',
  'Július','Augusztus','Szeptember','Október','November','December'
];

export default function LiveCityMap({ events = [], attractions = [], leisure = [], restaurants = [] }) {
  // Alap: Kőszeg közepe
  const center = [47.3893, 16.5407];

  // Szűrők
  const now = new Date();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); // 0..11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [futureOnly, setFutureOnly] = useState(true);

  const monthDate = useMemo(() => {
    const d = new Date(selectedYear, selectedMonthIndex, 1);
    return d;
  }, [selectedYear, selectedMonthIndex]);

  // Események szűrése: csak amiknek van coords, és beleesnek a kiválasztott hónapba
  const filteredEvents = useMemo(() => {
    const base = events.filter(
      (e) => e?.coords?.lat && e?.coords?.lng && eventOverlapsMonth(e, monthDate)
    );
    if (!futureOnly) return base;
    const today = new Date();
    return base.filter(e => e._e >= today);
  }, [events, monthDate, futureOnly]);

  // Opcionálisan helyek is mehetnének, de most az áttekinthetőség miatt csak események:
  // const pointsFromAttractions = attractions.filter(a => a.coords?.lat && a.coords?.lng).map(...)

  return (
    <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-lg">
      {/* Vezérlők (overlay) */}
      <div className="absolute z-[500] top-3 left-3 right-3 flex items-center gap-2">
        {/* Hónapválasztó „chip”-ek */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="inline-flex gap-2 px-2 py-1 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            {MONTH_LABELS.map((label, idx) => (
              <button
                key={label}
                onClick={() => setSelectedMonthIndex(idx)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition
                  ${idx === selectedMonthIndex
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Év (-/+), ha átlógna a következő évre is */}
        <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-2 py-1 rounded-xl">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Előző év"
          >
            ‹
          </button>
          <span className="px-2 text-sm font-semibold">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Következő év"
          >
            ›
          </button>
        </div>

        {/* Csak jövőbeliek toggle */}
        <label className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-3 py-1 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={futureOnly}
            onChange={(e) => setFutureOnly(e.target.checked)}
          />
          <span className="text-xs">Csak jövőbeliek</span>
        </label>
      </div>

      {/* Térkép */}
      <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredEvents.map((evt) => (
          <Marker
            key={evt.id}
            position={[evt.coords.lat, evt.coords.lng]}
            icon={icon}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{evt.name}</div>
                <div className="text-xs text-gray-600">
                  {format(evt._s, 'yyyy.MM.dd')}
                  {(+evt._e !== +evt._s) ? ` – ${format(evt._e, 'yyyy.MM.dd')}` : ''}
                  {evt.time ? ` • ${evt.time}` : ''}
                </div>
                {evt.location && (
                  <div className="text-xs">📍 {evt.location}</div>
                )}
                <a
                  href={`/events/${evt.id}`}
                  className="inline-block mt-1 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                >
                  Részletek
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Alsó infósáv: hány esemény látható */}
      <div className="absolute z-[500] bottom-3 left-3 right-3">
        <div className="px-3 py-2 rounded-xl bg-white/85 dark:bg-gray-800/85 backdrop-blur-md text-xs flex items-center justify-between">
          <span>
            Látható események: <strong>{filteredEvents.length}</strong> • {MONTH_LABELS[selectedMonthIndex]} {selectedYear}
          </span>
          <span className="opacity-70">Nagyítás a pontos elhelyezkedéshez</span>
        </div>
      </div>
    </div>
  );
}
