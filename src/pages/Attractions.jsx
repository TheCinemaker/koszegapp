import React, { useEffect, useState } from 'react';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';

export default function Attractions() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttractions()
      .then(data => setItems(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">{item.name}</h3>
            <p className="text-rose-50 dark:text-amber-100 mb-2">{item.description}</p>
            <div className="flex justify-between items-center">
              <a
                href={`https://www.google.com/maps?q=${item.coordinates.lat},${item.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 dark:text-indigo-700 underline"
              >
                Térképen
              </a>
              <Link
                to={`/attractions/${item.id}`}
                className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
              >
                Részletek
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
