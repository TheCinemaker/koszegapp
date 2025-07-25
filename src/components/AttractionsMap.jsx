import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import UserLocationMarker from './UserLocationMarker';
import { FaCrosshairs } from 'react-icons/fa';

const koszegCenter = [47.388, 16.541];

export default function AttractionsMap({ items, onMarkerClick }) {
  if (!items) {
    return <div>Térkép betöltése...</div>;
  }

  function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16); 
    }
  }, [position, map]);
  return null;
}

  return (
    <div className="relative">
      <MapContainer center={koszegCenter} zoom={15} style={{ height: '70vh', width: '100%', zIndex: 10 }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {items.map(item => (
          <Marker 
            key={item.id} 
            position={[item.coordinates.lat, item.coordinates.lng]}
            eventHandlers={{ click: () => onMarkerClick(item.id) }}
          />
        ))}

        {/* ÚJ: Itt jelenítjük meg a felhasználó pozícióját */}
        <UserLocationMarker position={userPosition} />
        
        {/* ÚJ: Ez a komponens vezérli a térkép mozgását */}
        <MapController position={userPosition} />
      </MapContainer>

      {/* ÚJ: A "Saját Helyzetem" gomb */}
      <button
        onClick={onLocateMe}
        disabled={isLocating}
        className="absolute bottom-4 right-4 z-20 bg-white p-3 rounded-full shadow-lg text-indigo-600 hover:bg-indigo-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        title="Saját pozícióm"
      >
        {isLocating ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <FaCrosshairs className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
