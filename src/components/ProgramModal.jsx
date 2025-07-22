import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore,
  differenceInMinutes
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
  const [diff, setDiff] = useState(() => Math.max(0, target - new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(Math.max(0, target - new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor(diff / 1000 / 60 / 60);

  return (
    <span>
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </span>
  );
}

// Esemény pozícióját középre állítja
function CenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 18, { animate: true });
  }, [lat, lng, map]);
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
        const maiProgramok = programok
          .map(p => ({
            ...p,
            start: parseISO(p.idopont),
            end: p.veg_idopont ? parseISO(p.veg_idopont) : null
          }))
          .filter(p => isSameDay(p.start, now));

        const current = maiProgramok.find(p =>
          isBefore(p.start, now) && (!p.end || isAfter(p.end, now) === false)
        );

        const next = maiProgramok.find(p => isAfter(p.start, now));

        setCurrentEvent(current);
        setNextEvent(next);
      });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.warn('Helymeghatározás hiba:', err);
      }
    );
  }, []);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl p-4 max-w-4xl sm:mx-auto mx-4 my-6 z-50 relative">
        <h2 className="text-xl font-bold mb-4">📅 Mai programok</h2>

        {currentEvent && (
          <div
            className="mb-4 p-4 border border-green-400 rounded-md bg-green-50 dark:bg-green-900/20 cursor-pointer"
            onClick={() => setSelectedProgram(currentEvent)}
          >
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
              🎬 Jelenleg zajlik:
            </h3>
            <p className="text-lg font-semibold">{currentEvent.nev}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              📍 {currentEvent.helyszin?.nev || 'ismeretlen'}<br />
              ⏳ Hátralévő idő:{' '}
              {currentEvent.end
                ? `${differenceInMinutes(currentEvent.end, new Date())} perc`
                : 'nem ismert'}
            </p>
          </div>
        )}

        {nextEvent && (
          <div
            className="mb-4 p-4 border border-blue-400 rounded-md bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
            onClick={() => setSelectedProgram(nextEvent)}
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
              ⏭️ Következő esemény:
            </h3>
            <p className="text-lg font-semibold">{nextEvent.nev}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              🕘 Kezdés: {format(nextEvent.start, 'HH:mm')}<br />
              ⏱️ Visszaszámlálás: <Countdown target={nextEvent.start} />
            </p>
          </div>
        )}

        {userLocation && nextEvent?.helyszin && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 mb-4 text-sm font-semibold text-blue-600 dark:text-blue-300 underline hover:text-blue-800"
            style={{ display: 'block', textAlign: 'left' }}
          >
            🧭 Vigyél oda
          </a>
        )}

        <div className="h-[400px] rounded-md overflow-hidden mt-6 border">
          <MapContainer
            center={nextEvent?.helyszin || userLocation || [47.389, 16.540]}
            zoom={18}
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
                <CenterMap
                  lat={nextEvent.helyszin.lat}
                  lng={nextEvent.helyszin.lng}
                />
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
