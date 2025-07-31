import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { isParkingPaidNow } from '../utils/parkingUtils';
import zonesUrl from '../../public/data/parking-zones.json?url';

export default function ParkingMap() {
  const [zones, setZones] = auseState([]);

  // === JAVÍTÁS: VISSZATÉRÉS A FETCH-HEZ, DE A HELYES URL-LEL ===
  useEffect(() => {
    fetch(zonesUrl) 
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP hiba! Státusz: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setZones(data))
      .catch(error => console.error("Hiba a zónaadatok betöltésekor:", error));
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Kőszegi parkolózónák</h2>
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
        className="h-[70vh] w-full rounded-xl shadow-lg border-2 border-white/50"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map(zone => {
          const isPaid = isParkingPaidNow(zone.hours);

          return zone.lines.map((line, idx) => (
            <Polyline
              key={`${zone.id}-${idx}`}
              positions={line}
              pathOptions={{ color: zone.color, weight: 5, opacity: 0.8 }}
            >
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
      </MapContainer>
    </div>
  );
}
