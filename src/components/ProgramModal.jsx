import React, { useEffect, useState } from 'react';
import { format, parseISO, isSameDay, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import programok from '../data/programok.json'; // ide kerül majd a json

// alap marker ikon fix Leaflethez
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ProgramModal() {
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    const now = new Date();

    const maiProgramok = programok
      .map(p => ({
        ...p,
        start: parseISO(p.idopont),
        end: p.veg_idopont ? parseISO(p.veg_idopont) : null
      }))
      .filter(p => isSameDay(p.start, now));

    const current = maiProgramok.find(p => isBefore(p.start, now) && (!p.end || isAfter(p.end, now) === false));
    const next = maiProgramok.find(p => isAfter(p.start, now));

    setCurrentEvent(current);
    setNextEvent(next);

    // pozíció lekérése
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.warn('Helymeghatározás elutasítva vagy hiba', err);
      }
    );
  }, []);

  return (
    <div className="bg-white shadow-xl rounded-xl p-4 max-w-4xl mx-auto my-6">
      <h2 className="text-xl font-bold mb-4">Mai programok</h2>

      {currentEvent && (
        <div className="mb-4 p-3 border border-green-400 rounded-md bg-green-50">
          <h3 className="font-semibold text-green-800">🎬 Jelenleg zajlik:</h3>
          <p>{currentEvent.nev}</p>
          <p className="text-sm text-gray-600">
            Helyszín: {currentEvent.helyszin.nev || 'ismeretlen'}<br />
            Hátralévő idő: {currentEvent.end ? differenceInMinutes(currentEvent.end, new Date()) : 'n/a'} perc
          </p>
        </div>
      )}

      {nextEvent && (
        <div className="mb-4 p-3 border border-blue-400 rounded-md bg-blue-50">
          <h3 className="font-semibold text-blue-800">⏭️ Következő esemény:</h3>
          <p>{nextEvent.nev}</p>
          <p className="text-sm text-gray-600">
            Kezdés: {format(nextEvent.start, 'HH:mm')}<br />
            Visszaszámlálás: {differenceInMinutes(nextEvent.start, new Date())} perc
          </p>
        </div>
      )}

      <div className="h-[400px] rounded-md overflow-hidden mt-6">
        <MapContainer
          center={userLocation || [47.389, 16.540]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>Te vagy itt</Popup>
            </Marker>
          )}
          {nextEvent && nextEvent.helyszin && (
            <Marker position={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]}>
              <Popup>{nextEvent.nev}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
