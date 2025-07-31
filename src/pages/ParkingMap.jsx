import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { isParkingPaidNow } from '../utils/parkingUtils';
import UserLocationMarker from '../components/UserLocationMarker';
import { fetchParkingMachines, fetchParkingZones } from '../api';

// Fontos: Az alapértelmezett Leaflet ikon visszaállítása
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});


export default function ParkingMap() {
  const [zones, setZones] = useState([]);
  const [machines, setMachines] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    fetchParkingZones().then(setZones).catch(console.error);
    fetchParkingMachines().then(setMachines).catch(console.error);
  }, []);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor. Engedélyezd a böngészőben!")
    );
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Kőszegi parkolózónák</h2>
        <div className="flex gap-2">
          <button onClick={handleLocateMe} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg text-sm">Hol vagyok?</button>
          <Link to="/parking" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            ← Vissza a listához
          </Link>
        </div>
      </div>

      <div className="relative">
        <MapContainer
          center={[47.389, 16.540]}
          zoom={16}
          scrollWheelZoom={true}
          className="h-[70vh] w-full rounded-xl shadow-lg border-2 border-white/50"
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* === ITT A JAVÍTOTT, TELJES KÓD A ZÓNÁKHOZ === */}
          {zones.map(zone => {
            const isPaid = isParkingPaidNow(zone.hours);
            return zone.lines.map((line, idx) => (
              <Polyline key={`${zone.id}-${idx}`} positions={line} pathOptions={{ color: zone.color, weight: 5, opacity: 0.8 }}>
                <Popup>
                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-base text-purple-800">{zone.name}</strong>
                      {isPaid !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ml-2 ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                          {isPaid ? 'FIZETŐS' : 'INGYENES'}
                        </span>
                      )}
                    </div>
                    <strong>Ár:</strong> {zone.price}<br />
                    <strong>Időszak:</strong> {zone.hours}<br />
                    <strong>Fizetés:</strong> {zone.payment.join(', ')}
                  </div>
                </Popup>
              </Polyline>
            ));
          })}
          
          {/* === ITT A JAVÍTOTT, TELJES KÓD AZ AUTOMATÁKHOZ === */}
          {machines.map(machine => (
            <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>Parkolóautomata</strong><br />
                  {machine.address}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${machine.coords.lat},${machine.coords.lng}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center mt-2 bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-blue-600"
                  >
                    Vigyél oda!
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {userPosition && <UserLocationMarker position={userPosition} />}
        </MapContainer>

        {/* A jelmagyarázat változatlan */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
          <h4 className="font-bold text-sm mb-2 text-purple-900 dark:text-purple-300">Jelmagyarázat</h4>
          <ul className="space-y-1 text-xs text-gray-800 dark:text-gray-300">
            {zones.map(zone => (
              <li key={zone.id} className="flex items-center">
                <span className="w-4 h-1 rounded-full mr-2" style={{ backgroundColor: zone.color }}></span>
                {zone.name}
              </li>
            ))}
            <li className="flex items-center">
              <img src={markerIcon} alt="marker" className="w-3 h-5 mr-2" />
              Parkolóautomata
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
