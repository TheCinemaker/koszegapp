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

// Alap ikon fix Leaflet-hez
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

const MONTH_LABELS = [
  'Január','Február','Március','Április','Május','Június',
  'Július','Augusztus','Szeptember','Október','November','December'
];

export default function LiveCityMap({ events = [] }) {
  const center = [47.3893, 16.5407];
  const now = new Date();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth());
  const [futureOnly, setFutureOnly] = useState(true);

  const monthDate = useMemo(() => new Date(now.getFullYear(), selectedMonthIndex, 1), [selectedMonthIndex, now]);

  const filteredEvents = useMemo(() => {
    const base = events.filter(
      (e) => e?.coords?.lat && e?.coords?.lng && eventOverlapsMonth(e, monthDate)
    );
    if (!futureOnly) return base;
    const today = new Date();
    return base.filter(e => e._e >= today);
  }, [events, monthDate, futureOnly]);

  return (
    <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-lg">
      {/* Vezérlők */}
      <div className="absolute z-[500] top-3 left-3 right-3 flex flex-col gap-2">
        {/* Hónap chip-sor */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-2 py-1 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
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

        {/* Csak jövőbeliek toggle */}
        <label className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-3 py-1 rounded-xl cursor-pointer self-start">
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
          <Marker key={evt.id} position={[evt.coords.lat, evt.coords.lng]} icon={icon}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{evt.name}</div>
                <div className="text-xs text-gray-600">
                  {format(evt._s, 'yyyy.MM.dd')}
                  {(+evt._e !== +evt._s) ? ` – ${format(evt._e, 'yyyy.MM.dd')}` : ''}
                  {evt.time ? ` • ${evt.time}` : ''}
                </div>
                {evt.location && <div className="text-xs">📍 {evt.location}</div>}
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

      {/* Alsó infósáv */}
      <div className="absolute z-[500] bottom-3 left-3 right-3">
        <div className="px-3 py-2 rounded-xl bg-white/85 dark:bg-gray-800/85 backdrop-blur-md text-xs flex items-center justify-between">
          <span>
            Látható események: <strong>{filteredEvents.length}</strong> • {MONTH_LABELS[selectedMonthIndex]}
          </span>
          <span className="opacity-70">Nagyíts a részletekhez</span>
        </div>
      </div>
    </div>
  );
}
