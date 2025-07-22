import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore
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

// Leaflet ikon beállítás
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:   'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:         'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState(target - Date.now());

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(iv);
  }, [target]);

  const h = String(Math.floor(timeLeft / 1000 / 60 / 60)).padStart(2,'0');
  const m = String(Math.floor((timeLeft/1000/60)%60)).padStart(2,'0');
  const s = String(Math.floor((timeLeft/1000)%60)).padStart(2,'0');

  return (
    <span className="text-2xl font-mono text-amber-800 dark:text-amber-200">
      {h}:{m}:{s}
    </span>
  );
}

function CenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 17, { animate: true });
  }, [center, map]);
  return null;
}

/**
 * @param {Object} props
 * @param {() => void} props.onClose        bezárja a modalt (App.jsx-ben kezelve)
 * @param {() => void} props.onOpenDrawer   megnyitja az OstromDrawer-t
 */
export default function ProgramModal({ onClose, onOpenDrawer }) {
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Események lekérése
  useEffect(() => {
    const now = new Date();
    fetch('/data/programok.json')
      .then(r => r.json())
      .then(arr => {
        const today = arr
          .map(p => ({
            ...p,
            start: parseISO(p.idopont),
            end: p.veg_idopont ? parseISO(p.veg_idopont) : null
          }))
          .filter(p => isSameDay(p.start, now));
        setCurrentEvent(
          today.find(p => isBefore(p.start, now) && (!p.end || isAfter(p.end, now)===false))
        );
        setNextEvent(
          today.find(p => isAfter(p.start, now))
        );
      });
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} /* hiba elnyelése */
    );
  }, []);

  // Ha nincs több esemény
  const noEvents = !currentEvent && !nextEvent;

  return (
    <>
      <div className="fixed inset-y-[30px] inset-x-0 overflow-y-auto z-[999] px-4">
        <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 
                        shadow-xl rounded-2xl p-4 mx-auto max-w-3xl border 
                        border-amber-300 dark:border-amber-700 relative">

          {/* Fejléc + bezárógomb */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-extrabold tracking-tight">
              🛡️ Ostromnapok 2025 – Mai programok
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-amber-900 dark:text-amber-200 hover:text-red-600 transition"
              aria-label="Bezárás"
            >
              ✖
            </button>
          </div>

          {/* Belső scrollozható tartalom */}
          <div className="max-h-[85vh] overflow-y-auto pb-4">

            {/* Nincs esemény üzenet */}
            {noEvents && (
              <div className="text-center text-amber-800 dark:text-amber-200 italic py-6">
                🎉 Nincs több esemény mára! Nézz vissza később, vagy lapozz a holnapi napra.
              </div>
            )}

            {/* Aktuális esemény */}
            {currentEvent && (
              <div
                className="mb-4 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 
                           border-l-4 border-amber-500 cursor-pointer hover:shadow transition"
                onClick={() => setSelectedProgram(currentEvent)}
              >
                <h3 className="flex items-center text-lg font-semibold mb-1">
                  🎬 Épp most zajlik:
                  {currentEvent.kiemelt && (
                    <span className="ml-2 bg-yellow-300 text-yellow-800 font-bold text-sm 
                                     px-2 py-0.5 rounded-full">⭐ Kiemelt</span>
                  )}
                </h3>
                <p className="text-base font-bold">{currentEvent.nev}</p>
                <p className="text-sm mt-1">
                  📍 {currentEvent.helyszin?.nev || 'Helyszín nem ismert'}<br/>
                  🕘 {format(currentEvent.start, 'HH:mm')} – {format(currentEvent.end, 'HH:mm')}
                </p>
              </div>
            )}

            {/* Következő esemény */}
            {nextEvent && (
              <div
                className="mb-4 p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 
                           border-l-4 border-yellow-600 cursor-pointer hover:shadow transition"
                onClick={() => setSelectedProgram(nextEvent)}
              >
                <h3 className="flex items-center text-lg font-semibold mb-1">
                  ⏭️ Következő esemény:
                  {nextEvent.kiemelt && (
                    <span className="ml-2 bg-yellow-300 text-yellow-800 font-bold text-sm 
                                     px-2 py-0.5 rounded-full">⭐ Kiemelt</span>
                  )}
                </h3>
                <p className="text-base font-bold">{nextEvent.nev}</p>
                <p className="text-sm mt-1">
                  🕘 {format(nextEvent.start,'HH:mm')} kezdés<br/>
                  ⏱️ <Countdown target={nextEvent.start}/>
                </p>
                {/* Vigyél oda gomb */}
                {userLocation && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-yellow-700 underline hover:text-yellow-900"
                  >
                    🧭 Vigyél oda
                  </a>
                )}
              </div>
            )}

            {/* Térkép */}
            <div className="h-[300px] rounded-xl overflow-hidden border border-amber-300 dark:border-amber-700">
              <MapContainer
                center={
                  currentEvent?.helyszin
                    ? [currentEvent.helyszin.lat, currentEvent.helyszin.lng]
                    : userLocation || [47.389,16.540]
                }
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userLocation && (
                  <Marker position={userLocation}>
                    <Popup>📍 Itt vagy</Popup>
                  </Marker>
                )}
                {currentEvent?.helyszin && (
                  <>
                    <Marker position={[currentEvent.helyszin.lat, currentEvent.helyszin.lng]}>
                      <Popup>{currentEvent.nev}</Popup>
                    </Marker>
                    <CenterMap center={[currentEvent.helyszin.lat, currentEvent.helyszin.lng]} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Drawer megnyitó gomb */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { onClose(); onOpenDrawer(); }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-full font-semibold transition"
              >
                📜 Teljes program megtekintése
              </button>
            </div>

          </div>{/* belső scroll container vége */}

        </div>
      </div>

      {/* Részletek sheet */}
      <ProgramDetailsSheet
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </>
  );
}
