// src/components/UserLocationMarker.jsx

import React from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

// Egyedi kék ikon létrehozása (ez felülírja a main.jsx-ben beállított alapértelmezettet)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function UserLocationMarker({ position }) {
  if (!position) {
    return null;
  }

  return (
    <>
      <Marker position={position} icon={userIcon} />
      {/* A pulzáló kör a pontosság jelzésére és a vizuális effekthez */}
      <Circle 
        center={position}
        radius={150} // Kb. 150 méteres pontosság
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
        weight={1}
      />
      <Circle 
        center={position}
        radius={10}
        pathOptions={{ color: 'blue', fillColor: 'blue' }}
        className="leaflet-pulse-marker" // Egyedi CSS osztály az animációhoz
      />
    </>
  );
}
