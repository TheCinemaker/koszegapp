import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchParking } from '../api';

export default function Parking() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchParking()
      .then(data => setList(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!list.length) return <p className="p-4">Betöltés…</p>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Link
        to="/parking-map"
          className="inline-block bg-purple-100 text-indigo-500 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg transition"
       >
    Nézd meg térképen 🗺
      </Link>
      {list.map(p => (
        <div
          key={p.id}
          className="bg-white/20 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl transition duration-300 overflow-hidden"
        >
          {p.image && (
            <img
              src={`/images/parking/${p.image}`}
              alt={p.name}
              className="w-full h-52 object-contain"
            />
          )}
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-1 text-indigo-500 dark:text-indigo-700">{p.name}</h3>
            <p className="text-rose-50 dark:text-amber-100">{p.address}</p>
            <p className="text-rose-50 dark:text-amber-100">{p.price}</p> 
            <p className="text-rose-50 dark:text-amber-100">kapacitás: {p.capacity || 'nem ismert'}</p>
            <Link
              to={`/parking/${p.id}`}
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition mt-3"
            >
              Részletek
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
