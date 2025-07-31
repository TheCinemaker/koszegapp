import React, 'react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchParking, fetchParkingMachines, fetchParkingZones } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';
// --- ÚJ IMPORT-OK ---
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import UserLocationMarker from '../components/UserLocationMarker';
import { machineIcon } from '../utils/icons';

export default function ParkingDetail() {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [machines, setMachines] = useState([]);
  const [zone, setZone] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(null); // <<< ÚJ STATE

  useEffect(() => {
    // ... az adatbetöltő useEffect változatlan, mindent letölt ...
  }, [id]);

  const handleLocateMe = () => { // <<< ÚJ FÜGGVÉNY
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor.")
    );
  };

  // ... if (error), if (loading), if (!park) változatlan ...

  return (
    <div className="max-w-4xl ...">
      {/* ... a felső rész (cím, státusz, stb.) változatlan ... */}

      <div className="mt-8 pt-6 border-t ...">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold ...">Térkép</h2>
          <button onClick={handleLocateMe} className="bg-blue-600 ...">Hol vagyok?</button>
        </div>
        {park.coords && zone ? (
          <MapContainer center={[park.coords.lat, park.coords.lng]} zoom={16} className="h-96 w-full ...">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {zone.lines.map((line, idx) => (
              <Polyline key={idx} positions={line} pathOptions={{ color: zone.color, weight: 7, opacity: 0.9 }} />
            ))}
            {machines.map(machine => (
              <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]} icon={machineIcon}>
                <Popup><strong>Parkolóautomata</strong><br/>{machine.address}</Popup>
              </Marker>
            ))}
            {userPosition && <UserLocationMarker position={userPosition} />}
          </MapContainer>
        ) : <p>Térkép adatok betöltése...</p>}
      </div>
    </div>
  );
}
