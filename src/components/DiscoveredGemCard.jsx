import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { FaMapMarkerAlt } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Leaflet térképhez szükséges, hogy ne omoljon össze a CSS transzformáció miatt
  if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
  }

  return (
    // A külső konténer kapja a 'flip-card' és a feltételes 'flipped' osztályt
    <div 
      className={`flip-card w-full aspect-square ${isFlipped ? 'flipped' : ''}`}
      onClick={() => setIsFlipped(!isFlipped)} // Bárhova kattintva megfordul
    >
      <div className="flip-card-inner">
        {/* === ELŐLAP: A KINCS ADATAI === */}
        <div 
          className="flip-card-front bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 cursor-pointer"
          style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
        >
          <div className="flex flex-col h-full bg-black/10 backdrop-blur-sm p-3 rounded-2xl">
            <div className="flex-grow text-center font-zeyada text-amber-900">
              <h3 className="text-2xl font-bold line-clamp-2">{gem.name}</h3>
              <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-24 object-cover rounded-md my-2 shadow-inner" />
            </div>
            <div className="flex items-center justify-center text-xs font-semibold text-amber-800/70">
              <FaMapMarkerAlt className="mr-1" />
              <span>Fordítsd meg a térképért!</span>
            </div>
          </div>
        </div>

        {/* === HÁTLAP: A TÉRKÉP === */}
        <div className="flip-card-back bg-gray-700 rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden">
          <MapContainer 
            center={[gem.coords.lat, gem.coords.lng]} 
            zoom={16} 
            scrollWheelZoom={false} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[gem.coords.lat, gem.coords.lng]} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
