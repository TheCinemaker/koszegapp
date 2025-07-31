import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { isParkingPaidNow } from '../utils/parkingUtils';
import UserLocationMarker from '../components/UserLocationMarker'; 
import { fetchParkingMachines } from '../api'; 

// Parkolóautomata ikon definiálása
const machineIcon = new L.Icon({
  iconUrl: '/images/parking_meter.png', 
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

export default function ParkingMap() {
  const [zones, setZones] = useState([]);
  const [machines, setMachines] = useState([]); 
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    fetch('/public/data/parking-zones.json').then(res => res.json()).then(setZones).catch(console.error);
    fetchParkingMachines().then(setMachines).catch(console.error); 
  }, []);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor.")
    );
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold ...">Kőszegi parkolózónák</h2>
        <div className="flex gap-2">
          {/* ÚJ: Geolokáció gomb */}
          <button onClick={handleLocateMe} className="bg-blue-600 text-white px-4 py-2 rounded-lg ...">
            Hol vagyok?
          </button>
          <Link to="/parking" className="bg-purple-600 text-white px-4 py-2 rounded-lg ...">
            ← Vissza a listához
          </Link>
        </div>
      </div>

      <MapContainer center={[47.389, 16.540]} zoom={16} className="h-[70vh] ...">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Zónák kirajzolása (a te kódod) */}
        {zones.map(zone => { /* ... */ })}

        {/* ÚJ: Automata markerek kirajzolása */}
        {machines.map(machine => (
          <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]} icon={machineIcon}>
            <Popup>
              <div className="text-sm">
                <strong>Parkolóautomata</strong><br />
                {machine.address}
                <br />
                {/* ÚJ: "Vigyél oda" gomb */}
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${machine.coords.lat},${machine.coords.lng}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center mt-2 bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded"
                >
                  Vigyél oda!
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* A felhasználó helyének jelölése */}
        {userPosition && <UserLocationMarker position={userPosition} />}
      </MapContainer>
    </div>
  );
}
