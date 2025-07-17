import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function ParkingMap() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetch('/data/parking-zones.json')
      .then(res => res.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold">Kőszegi parkolózónák</h2>
        <Link
          to="/parking"
          className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          ← Vissza a listához
        </Link>
      </div>

      <MapContainer
        center={[47.389, 16.540]}
        zoom={16}
        scrollWheelZoom={true}
        className="h-[60vh] w-full rounded-xl shadow-lg"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map(zone =>
          zone.lines.map((line, idx) => (
            <Polyline
              key={`${zone.id}-${idx}`}
              positions={line}
              pathOptions={{ color: zone.color, weight: 5, opacity: 0.8 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{zone.name}</strong><br />
                  Ár: {zone.price}<br />
                  Nyitvatartás: {zone.hours}<br />
                  Fizetés: {zone.payment.join(', ')}
                </div>
              </Popup>
            </Polyline>
          ))
        )}
      </MapContainer>
    </div>
  );
}
