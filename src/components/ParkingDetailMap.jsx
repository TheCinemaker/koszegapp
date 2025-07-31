import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import UserLocationMarker from './UserLocationMarker';

// Parkolóautomata ikon
const machineIcon = new L.Icon({
  iconUrl: '/images/parking_meter_icon.png', // Győződj meg róla, hogy ez a kép létezik!
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

export default function ParkingDetailMap({ center, zone, machines }) {
  const [userPosition, setUserPosition] = useState(null);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor.")
    );
  };

  return (
    <div className="relative">
      <button 
        onClick={handleLocateMe}
        className="absolute top-2 right-2 z-[1000] bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg text-sm"
      >
        Hol vagyok?
      </button>
      <MapContainer center={center} zoom={16} scrollWheelZoom={true} className="h-96 w-full rounded-xl shadow-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* A KIEMELT ZÓNA KIRAJZOLÁSA */}
        {zone && zone.lines.map((line, idx) => (
          <Polyline key={idx} positions={line} pathOptions={{ color: zone.color, weight: 7, opacity: 0.9 }} />
        ))}

        {/* AUTOMATÁK KIRAJZOLÁSA */}
        {machines.map(machine => (
          <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]} icon={machineIcon}>
            <Popup>
              <strong>Parkolóautomata</strong><br/>{machine.address}
            </Popup>
          </Marker>
        ))}
        
        {userPosition && <UserLocationMarker position={userPosition} />}
      </MapContainer>
    </div>
  );
}
