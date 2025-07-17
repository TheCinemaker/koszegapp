import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeisure } from '../api';

export default function Leisure() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeisure()
      .then(data => setList(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!list.length) return <p className="p-4">Betöltés…</p>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {list.map(item => (
        <div key={item.id} className="bg-white/20 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          {item.image && (
          <img
            src={`/images/leisure/${item.image}`}
            alt={item.name}
            className="w-full h-40 object-cover"
            />
        )}
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-1 text-indigo-500 dark:text-indigo-700">{item.name}</h3>
            <p className="text-rose-50 dark:text-amber-100 mb-3">{item.shortDescription}</p>
            <Link
              to={`/leisure/${item.id}`}
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Részletek
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
