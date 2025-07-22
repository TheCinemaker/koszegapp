import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore
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

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="text-lg font-mono">
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
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

export default function ProgramModal() {
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    const now = new Date();

    fetch('/data/programok.json')
      .then(res => res.json())
      .then(programok => {
        const today = programok
          .map(p => ({
            ...p,
            start: parseISO(p.idopont),
            end: p.veg_idopont ? parseISO(p.veg_idopont) : null
          }))
          .filter(p => isSameDay(p.start, now));

        const current = today.find(p =>
          isBefore(p.start, now) && (!p.end || isAfter(p.end, now) === false)
        );

        const next = today.find(p => isAfter(p.start, now));

        setCurrentEvent(current);
        setNextEvent(next);
      });

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      err => console.warn('Helymeghatározás hiba:', err)
    );
  }, []);

  return (
    <>
      <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 shadow-xl rounded-2xl p-4 mx-4 md:mx-auto my-6 max-w-3xl border border-amber-300 dark:border-amber-700 relative">
        <h2 className="text-xl font-extrabold mb-4">📅 Mai ostromprogramok</h2>

        {currentEvent && (
          <div
            className="mb-4 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer"
            onClick={() => setSelectedProgram(currentEvent)}
          >
            <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-1">🎬 Épp most zajlik:</h3>
            <p className="text-lg font-bold">{currentEvent.nev}</p>
            <p className="text-sm">
              📍 {currentEvent.helyszin?.nev || 'ismeretlen'}<br />
              ⏳ Vége: {currentEvent.end ? format(currentEvent.end, 'HH:mm') : 'ismeretlen'}
            </p>
          </div>
        )}

        {nextEvent && (
          <div
            className="mb-4 p-4 rounded-xl bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-400 cursor-pointer"
            onClick={() => setSelectedProgram(nextEvent)}
          >
            <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-1">⏭️ Következő esemény:</h3>
            <p className="text-lg font-bold">{nextEvent.nev}</p>
            <p className="text-sm">
              🕘 {format(nextEvent.start, 'HH:mm')} kezdés<br />
              ⏱️ Visszaszámlálás: <Countdown target={nextEvent.start} />
            </p>
          </div>
        )}

        {userLocation && nextEvent?.helyszin && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm font-semibold text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
          >
            🧭 Vigyél oda
          </a>
        )}

        <div className="h-[300px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
          <MapContainer
            center={userLocation || [47.389, 16.540]}
            zoom={17}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>📍 Te vagy itt</Popup>
              </Marker>
            )}
            {nextEvent?.helyszin && (
              <>
                <Marker position={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]}>
                  <Popup>{nextEvent.nev}</Popup>
                </Marker>
                <CenterMap center={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]} />
              </>
            )}
          </MapContainer>
        </div>
      </div>

      <ProgramDetailsSheet
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </>
  );
}
