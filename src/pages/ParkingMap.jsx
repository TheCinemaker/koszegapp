import React, 'react';
import { useEffect, useState } from 'react';
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

      <div className="relative"> {/* <<< ÚJ: Konténer a jelmagyarázathoz */}
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
          {zones.map(zone => { /* ... a zónák renderelése ... */ })}
          {machines.map(machine => ( <Marker ... /> ))}
          {userPosition && <UserLocationMarker position={userPosition} />}
        </MapContainer>

        {/* === ÚJ RÉSZ: A JELMAGYARÁZAT === */}
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
}
