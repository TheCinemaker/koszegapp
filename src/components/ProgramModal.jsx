import React, { useEffect, useState } from 'react';
import {
  format,
  parse,
  isSameDay,
  isAfter,
  isBefore,
  addMinutes
} from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProgramDetailsSheet from './ProgramDetailsSheet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState(target - new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, target - new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const h = Math.floor(timeLeft / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span className="text-lg font-mono">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function CenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 17);
  }, [center, map]);
  return null;
}

export default function ProgramModal({ onClose, openDrawer }) {
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    const now = new Date();

    fetch('/data/ostromProgram.json')
      .then(res => res.json())
      .then(days => {
        const allEvents = days.flatMap(day => {
          return day.events
            .filter(e => e.time)
            .map(evt => {
              const dateTime = parse(`${day.date} ${evt.time}`, 'yyyy-MM-dd HH:mm', new Date());
              return { ...evt, dateTime, day: day.day, kiemelt: evt.kiemelt || false };
            });
        });

        const today = allEvents.filter(evt => isSameDay(evt.dateTime, now));

        const current = today.find(evt =>
          isBefore(evt.dateTime, now) &&
          isAfter(addMinutes(evt.dateTime, 60), now)
        );

        const next = today.find(evt => isAfter(evt.dateTime, now));

        setCurrentEvent(current);
        setNextEvent(next);
      });

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => console.warn('Helymeghatározás hiba:', err)
    );
  }, []);

  return (
    <>
      <div className="fixed inset-y-[30px] inset-x-0 overflow-y-auto z-[999] px-4">
        <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 shadow-xl rounded-2xl p-4 mx-auto max-w-3xl border border-amber-300 dark:border-amber-700 relative max-h-[85vh] overflow-y-auto pb-20">

          {/* Bezáró gomb */}
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-2xl text-amber-800 dark:text-amber-200 hover:text-red-600"
            aria-label="Bezárás"
          >
            ×
          </button>

          {/* Fejléc */}
          <h2 className="text-xl font-extrabold mb-2 text-center tracking-tight">
            Ostromnapok 2025 – Mai programok
          </h2>

          {/* Teljes program drawer link */}
          <p className="text-xs text-center text-amber-700 dark:text-amber-300 mb-4">
            A teljes programért{' '}
            <button onClick={openDrawer} className="underline hover:text-amber-900 dark:hover:text-white">
              kattints ide
            </button>
          </p>

          {/* Események */}
          {currentEvent && (
            <div
              className="mb-4 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer relative"
              onClick={() => setSelectedProgram(currentEvent)}
            >
              <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-1">🎬 Épp most zajlik:</h3>
              <p className="text-lg font-bold">{currentEvent.title}</p>
              <p className="text-sm">
                📍 {currentEvent.location || 'ismeretlen'}<br />
                ⏳ Vége: {format(addMinutes(currentEvent.dateTime, 60), 'HH:mm')}
              </p>
              {currentEvent.kiemelt && (
                <span className="absolute top-2 right-3 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⭐ Kiemelt
                </span>
              )}
            </div>
          )}

          {nextEvent && (
            <div
              className="mb-4 p-4 rounded-xl bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-400 cursor-pointer relative"
              onClick={() => setSelectedProgram(nextEvent)}
            >
              <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-1">⏭️ Következő esemény:</h3>
              <p className="text-lg font-bold">{nextEvent.title}</p>
              <p className="text-sm">
                🕘 {format(nextEvent.dateTime, 'HH:mm')} kezdés<br />
                ⏱️ Visszaszámlálás: <Countdown target={nextEvent.dateTime} />
              </p>
              {nextEvent.kiemelt && (
                <span className="absolute top-2 right-3 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⭐ Kiemelt
                </span>
              )}
              {userLocation && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.coords?.lat},${nextEvent.coords?.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-sm font-semibold underline text-amber-700 hover:text-amber-900 dark:text-amber-300"
                >
                  🧭 Vigyél oda
                </a>
              )}
            </div>
          )}

          {!currentEvent && !nextEvent && (
            <p className="text-center text-lg text-amber-700 dark:text-amber-200 mt-4">
              🎉 Nincs több esemény mára! Nézz vissza később, vagy lapozz a holnapi napra.
            </p>
          )}

          {/* Térkép */}
          {userLocation && nextEvent?.coords && (
            <div className="h-[300px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
              <MapContainer
                center={[nextEvent.coords.lat, nextEvent.coords.lng]}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={userLocation}>
                  <Popup>📍 Te vagy itt</Popup>
                </Marker>
                <Marker position={[nextEvent.coords.lat, nextEvent.coords.lng]}>
                  <Popup>{nextEvent.title}</Popup>
                </Marker>
                <CenterMap center={[nextEvent.coords.lat, nextEvent.coords.lng]} />
              </MapContainer>
            </div>
          )}
        </div>
      </div>

      <ProgramDetailsSheet
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </>
  );
}
