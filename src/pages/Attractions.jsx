import React, { useEffect, useState } from 'react';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';
import AttractionsMap from '../components/AttractionsMap';
import { FaList, FaMapMarkedAlt } from 'react-icons/fa';

export default function Attractions() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Minden']);
  const [selectedCategory, setSelectedCategory] = useState('Minden');
  // A nézetváltó state-je. Alapból a lista nézetet mutatjuk.
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredItems = items
    .filter(item => {
      return selectedCategory === 'Minden' || item.category === selectedCategory;
    })
    .filter(item => {
      const query = searchQuery.toLowerCase().trim();
      if (query === '') {
        return true;
      }
      const nameMatch = item.name.toLowerCase().includes(query);
      const descriptionMatch = item.description.toLowerCase().includes(query);
      const tagsMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
      return nameMatch || descriptionMatch || tagsMatch;
    });

  if (loading) return <p className="p-4 text-center">Látnivalók betöltése...</p>;
  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  // === INNEN JÖN A HELYESEN FELÉPÍTETT RETURN BLOKK ===
  return (
    <div className="p-4">
      
      {/* --- 1. KEZELŐSZERVEK SZEKCIÓ --- */}
      
      {/* Keresőmező */}
      <div className="mb-6 px-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Keress látnivalót, pl. reneszánsz..."
          className="w-full p-3 bg-white/30 backdrop-blur-sm rounded-full text-indigo-900 placeholder-indigo-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* Swipe-olható menüsor */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 flex-nowrap md:flex-wrap md:justify-center scrollbar-hide">
        {categories.map(category => (
          <button
            key={category}
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

      {/* Nézetváltó gombok */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/30 backdrop-blur-sm p-1 rounded-full flex gap-1">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 transition ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-900'}`}
          >
            <FaList /> Lista
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 transition ${view === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-900'}`}
          >
            <FaMapMarkedAlt /> Térkép
          </button>
        </div>
      </div>

      {/* --- 2. TARTALOM SZEKCIÓ (Feltételes renderelés) --- */}

      {view === 'list' ? (
        // HA A 'view' ÉRTÉKE 'list', EZ JELENIK MEG:
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-rose-50 dark:text-amber-100">Nincs a keresésnek megfelelő találat.</p>
            </div>
          )}
          {filteredItems.map(item => (
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
      ) : (
        // HA A 'view' ÉRTÉKE BÁRMI MÁS (pl. 'map'), EZ JELENIK MEG:
        <div className="px-4">
            <AttractionsMap items={filteredItems} />
        </div>
      )}
    </div>
  );
}
