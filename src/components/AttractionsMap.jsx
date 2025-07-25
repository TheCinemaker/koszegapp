// src/components/AttractionsMap.jsx

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

// A Kőszeg koordinátái a térkép közepéhez
const koszegCenter = [47.388, 16.541];

export default function AttractionsMap({ items }) {
  if (!items) {
    return <div>Térkép betöltése...</div>;
  }

  return (
    <MapContainer center={koszegCenter} zoom={15} style={{ height: '70vh', width: '100%', borderRadius: '1rem' }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {items.map(item => (
        <Marker key={item.id} position={[item.coordinates.lat, item.coordinates.lng]}>
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold text-md mb-1">{item.name}</h3>
              <p className="text-sm mb-2">{item.description}</p>
              <Link to={`/attractions/${item.id}`} className="text-indigo-600 font-semibold hover:underline">
                Részletek megtekintése →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
