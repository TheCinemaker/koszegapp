import React, { useEffect, useState } from 'react';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';

export default function Attractions() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState(['Minden']);
  const [selectedCategory, setSelectedCategory] = useState('Minden');

  useEffect(() => {
    setLoading(true);
    fetchAttractions()
      .then(data => {
        setItems(data);
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        setCategories(['Minden', ...uniqueCategories]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Szűrési logika
  // A megjelenítendő elemek listája attól függ, melyik kategória van kiválasztva.
  const filteredItems = selectedCategory === 'Minden'
    ? items
    : items.filter(item => item.category === selectedCategory);

  if (loading) return <p className="p-4 text-center">Látnivalók betöltése...</p>;
  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 flex-nowrap md:flex-wrap md:justify-center scrollbar-hide">
        {categories.map(category => (
          <button
            key={category}
            // A flex-shrink-0 kulcsfontosságú, hogy a gombok ne zsugorodjanak össze!
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-transform transform active:scale-95 ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white/30 text-indigo-900 hover:bg-white/50 backdrop-blur-sm'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* A grid most már a SZŰRT listából (`filteredItems`) dolgozik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 && !loading && (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-rose-50 dark:text-amber-100">Nincs találat ebben a kategóriában.</p>
          </div>
        )}

        {filteredItems.map(item => (
          // A kártya komponens 
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
    </div>
  );
}
