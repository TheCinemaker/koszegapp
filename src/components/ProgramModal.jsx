import React, { useEffect, useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isAfter,
  isBefore
} from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  const [timeLeft, setTimeLeft] = useState(() => target - new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, target - new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const hours = Math.floor(timeLeft / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="text-2xl font-bold text-amber-800 dark:text-amber-200">
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </span>
  );
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
        const mai = programok
          .map(p => ({
            ...p,
            start: parseISO(p.idopont),
            end: p.veg_idopont ? parseISO(p.veg_idopont) : null
          }))
          .filter(p => isSameDay(p.start, now));

        const current = mai.find(p =>
          isBefore(p.start, now) && (!p.end || isAfter(p.end, now) === false)
        );
        const next = mai.find(p => isAfter(p.start, now));

        setCurrentEvent(current);
        setNextEvent(next);
      });

    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('Helymeghatározás hiba:', err)
    );
  }, []);

  return (
    <>
      <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 shadow-xl rounded-2xl p-4 mx-4 my-4 max-w-4xl mx-auto z-50 relative border border-amber-300 dark:border-amber-700">
        <h2 className="text-xl font-extrabold mb-4 text-center">📅 Mai programok</h2>

        {currentEvent && (
          <div
            className="mb-4 p-4 border border-amber-400 rounded-xl bg-amber-200/40 dark:bg-amber-900/20 hover:shadow cursor-pointer transition"
            onClick={() => setSelectedProgram(currentEvent)}
          >
            <h3 className="text-lg font-bold mb-1">🎬 Jelenleg zajlik:</h3>
            <p className="text-base font-semibold">{currentEvent.nev}</p>
            <p className="text-sm mt-1">
              📍 {currentEvent.helyszin?.nev || 'Helyszín nem ismert'}
              <br />
              ⏳ Vége: {currentEvent.end ? format(currentEvent.end, 'HH:mm') : '–'}
            </p>
          </div>
        )}

        {nextEvent && (
          <div
            className="mb-4 p-4 border border-amber-600 rounded-xl bg-amber-300/40 dark:bg-amber-900/30 hover:shadow cursor-pointer transition"
            onClick={() => setSelectedProgram(nextEvent)}
          >
            <h3 className="text-lg font-bold mb-1">⏭️ Következő esemény:</h3>
            <p className="text-base font-semibold">{nextEvent.nev}</p>
            <p className="text-sm mt-1">
              🕘 Kezdés: {format(nextEvent.start, 'HH:mm')}
              <br />
              ⏱️ <Countdown target={nextEvent.start} />
            </p>
          </div>
        )}

        {userLocation && nextEvent?.helyszin && (
          <div className="mt-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nextEvent.helyszin.lat},${nextEvent.helyszin.lng}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-amber-800 dark:text-amber-200 underline hover:text-amber-900"
            >
              🧭 Vigyél oda
            </a>
          </div>
        )}

        <div className="h-[300px] md:h-[400px] rounded-md overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
          <MapContainer
            center={
              nextEvent?.helyszin
                ? [nextEvent.helyszin.lat, nextEvent.helyszin.lng]
                : userLocation || [47.389, 16.540]
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
            {nextEvent?.helyszin && (
              <Marker position={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]}>
                <Popup>{nextEvent.nev}</Popup>
              </Marker>
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
