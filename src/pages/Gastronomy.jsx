import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../api';
import CustomDropdown from '../components/CustomDropdown';

// KIEMELT ID-K
const featuredIds = [10]; // tetszőlegesen bővítheted

// Randomizáló függvény
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

export default function Gastronomy() {
  const [list, setList] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRestaurants()
      .then(data => setList(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!list.length) return <p className="p-4">Betöltés…</p>;

  const types = Array.from(new Set(list.map(r => r.type)));
  const filtered = filterType === 'all'
    ? list
    : list.filter(r => r.type === filterType);

  const featured = filtered.filter(r => featuredIds.includes(r.id));
  const nonFeatured = filtered.filter(r => !featuredIds.includes(r.id));
  const finalList = [
    ...featured,
    ...shuffle([...nonFeatured])
  ];

  const dropdownOptions = ['all', ...types];

  return (
    <div className="p-4">
      {/* === SZŰRŐ === */}
      <div className="mb-6">
        <CustomDropdown
          options={dropdownOptions}
          value={filterType}
          onChange={setFilterType}
        />
      </div>

      {/* Kártyák */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalList.map(r => (
          <div
            key={r.id}
            className={`
              relative
              rounded-xl shadow-lg overflow-hidden
              transition hover:shadow-2xl
              ${featuredIds.includes(r.id)
                ? 'border-4 border-teal-500'
                : 'bg-white/20 dark:bg-gray-800 backdrop-blur-sm'}
            `}
          >
            <div className="relative">
              {featuredIds.includes(r.id) && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10">
                  Kiemelt hirdetés
                </div>
              )}
              {r.image && (
                <img
                  src={`/images/gastro/${r.image}`}
                  alt={r.name}
                  className="w-full h-40 object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-1">{r.name}</h3>
              <p className="text-gray-800 dark:text-gray-200 mb-4">
                {r.tags.join(', ')}
              </p>
          <Link
            to={`/gastronomy/${r.id}`}
              className="
                inline-block bg-purple-600 text-white
                px-4 py-2 rounded-lg hover:bg-purple-700
                transition
          "
          >
                Részletek
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
