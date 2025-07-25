import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const koszegCenter = [47.388, 16.541];

export default function AttractionsMap({ items, onMarkerClick }) {
  if (!items) {
    return <div>Térkép betöltése...</div>;
  }

  return (
    <MapContainer center={koszegCenter} zoom={15} style={{ height: '70vh', width: '100%', borderRadius: '1rem', zIndex: 10 }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {items.map(item => (
        <Marker 
          key={item.id} 
          position={[item.coordinates.lat, item.coordinates.lng]}

          eventHandlers={{
            click: () => {
              onMarkerClick(item.id);
            },
          }}
        /> 
      ))}
    </MapContainer>
  );
}
