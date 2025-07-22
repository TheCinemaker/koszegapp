import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore,
  addMinutes
} from 'date-fns';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProgramDetailsSheet from './ProgramDetailsSheet';

// Leaflet ikon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:   'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:         'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Visszaszámláló
function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState(target - Date.now());
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [target]);
  const h = String(Math.floor(timeLeft / 3600000)).padStart(2,'0');
  const m = String(Math.floor((timeLeft%3600000)/60000)).padStart(2,'0');
  const s = String(Math.floor((timeLeft%60000)/1000)).padStart(2,'0');
  return <span className="text-lg font-mono">{h}:{m}:{s}</span>;
}

// Autocenter Leaflet
function CenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 17); }, [center, map]);
  return null;
}

export default function ProgramModal({ onClose, openDrawer }) {
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    const now = new Date();
    fetch('/data/programok.json')
      .then(res => {
        if (!res.ok) throw new Error('Fetch hiba: ' + res.status);
        return res.json();
      })
      .then(arr => {
        // Parse és szűrés mai napra
        const today = arr
          .map(p => ({
            ...p,
            start: parseISO(p.idopont),
            end: p.veg_idopont ? parseISO(p.veg_idopont) : null,
            kiemelt: !!p.kiemelt
          }))
          .filter(p => isSameDay(p.start, now));

        const curr = today.find(p =>
          isBefore(p.start, now) && (!p.end || isAfter(p.end, now) === false)
        );
        const nxt = today.find(p => isAfter(p.start, now));

        setCurrentEvent(curr);
        setNextEvent(nxt);
      })
      .catch(err => console.error('Programok betöltési hiba:', err));

    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('Helymeghatározás hiba:', err)
    );
  }, []);

  const noEvents = !currentEvent && !nextEvent;

  return (
    <>
      <div className="fixed inset-y-[30px] inset-x-0 overflow-y-auto z-[999] px-4">
        <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100
                        shadow-xl rounded-2xl p-4 mx-auto max-w-3xl border
                        border-amber-300 dark:border-amber-700 relative
                        max-h-[85vh] overflow-y-auto pb-20">

          {/* Bezáró gomb */}
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-2xl text-amber-800 dark:text-amber-200 hover:text-red-600"
            aria-label="Bezárás"
          >×</button>

          {/* Fejléc */}
          <h2 className="text-xl font-extrabold mb-1 text-center tracking-tight">
            🛡️ Ostromnapok 2025 – Mai programok
          </h2>

          {/* Drawer infó szöveg */}
          <p className="text-sm text-center font-semibold text-amber-700 dark:text-amber-300 mb-4">
            📜 A teljes program a bal oldali menüből (drawer) érhető el!
          </p>

          {/* Nincs esemény üzenet */}
          {noEvents && (
            <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">
              🎉 Nincs több esemény mára! Nézz vissza később, vagy lapozz a holnapi napra.
            </p>
          )}

          {/* Aktuális esemény */}
          {currentEvent && (
            <div
              className="mb-4 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer hover:shadow transition"
              onClick={() => setSelectedProgram(currentEvent)}
            >
              <h3 className="flex items-center text-lg font-semibold mb-1">
                🎬 Épp most zajlik:
                {currentEvent.kiemelt && (
                  <span className="ml-2 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    ⭐ Kiemelt
                  </span>
                )}
              </h3>
              <p className="text-base font-bold">{currentEvent.nev}</p>
              <p className="text-sm mt-1">
                📍 {currentEvent.helyszin.nev}<br/>
                🕘 {format(currentEvent.start,'HH:mm')} – {format(currentEvent.end,'HH:mm')}
              </p>
            </div>
          )}

          {/* Következő esemény */}
          {nextEvent && (
            <div
              className="mb-4 p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-600 cursor-pointer hover:shadow transition"
              onClick={() => setSelectedProgram(nextEvent)}
            >
              <h3 className="flex items-center text-lg font-semibold mb-1">
                ⏭️ Következő esemény:
                {nextEvent.kiemelt && (
                  <span className="ml-2 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    ⭐ Kiemelt
                  </span>
                )}
              </h3>
              <p className="text-base font-bold">{nextEvent.nev}</p>
              <p className="text-sm mt-1">
                🕘 {format(nextEvent.start,'HH:mm')} kezdésig ennyi idő van hátra:<br/>
                ⏱️ <Countdown target={nextEvent.start}/>
              </p>
              {userLocation && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-sm font-semibold text-yellow-700 underline hover:text-yellow-900 dark:text-yellow-300"
                >
                  🧭 Vigyél oda
                </a>
              )}
            </div>
          )}

          {/* Térkép */}
          {userLocation && currentEvent?.helyszin && (
            <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
              <MapContainer
                center={[currentEvent.helyszin.lat, currentEvent.helyszin.lng]}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height:'100%', width:'100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={userLocation}>
                  <Popup>📍 Itt vagy</Popup>
                </Marker>
                <Marker position={[currentEvent.helyszin.lat, currentEvent.helyszin.lng]}>
                  <Popup>{currentEvent.nev}</Popup>
                </Marker>
                <CenterMap center={[currentEvent.helyszin.lat, currentEvent.helyszin.lng]} />
              </MapContainer>
            </div>
          )}

        </div>
      </div>

      {/* Részletek nézet */}
      <ProgramDetailsSheet
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </>
  );
}
