import React, { useEffect, useState } from 'react';
import { fetchHotels } from '../api';
import { Link } from 'react-router-dom';

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHotels()
      .then(data => setHotels(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!hotels.length) return <p className="p-4">Betöltés...</p>;

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map(hotel => (
          <Link
            key={hotel.id}
            to={`/hotels/${hotel.id}`}
            className="bg-white/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
          >
          {hotel.image && (
          <img
            src={`/images/hotels/${hotel.image}`}
            alt={hotel.name}
            className="w-full h-40 object-contain"
          />
          )}
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-1">{hotel.name}</h3>
            <p className="text-gray-700 text-sm mb-2">
              {hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1)} • {hotel.rating} ★
            </p>
            <p className="text-gray-800 text-sm">
              {hotel.address}
            </p>
          </div>
        </Link>
      ))}  
    </div>
  );
}
