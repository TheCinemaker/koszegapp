import React, { useEffect, useState } from 'react';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';
import AttractionsMap from '../components/AttractionsMap';
import { FaList, FaMapMarkedAlt } from 'react-icons/fa';
import AttractionDetailModal from '../components/AttractionDetailModal';

export default function Attractions() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Minden']);
  const [selectedCategory, setSelectedCategory] = useState('Minden');
  const [modalAttractionId, setModalAttractionId] = useState(null);
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [userPosition, setUserPosition] = useState(null);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

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

  useEffect(() => {
  setLoading(true);
  fetchAttractions()
    .then(data => {
      setItems(data);
      let availableCategories = ['Minden', ...new Set(data.map(item => item.category))];
      if (favorites.length > 0) {
        availableCategories.splice(1, 0, 'Kedvenceim');
      }
      
      setCategories(availableCategories);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [favorites.length]);

  const filteredItems = items
  .filter(item => {
    if (selectedCategory === 'Kedvenceim') {
      return isFavorite(item.id);
    }
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

  const handleLocateMe = () => {
  if (!navigator.geolocation) {
    setLocationError('A böngésződ nem támogatja a helymeghatározást.');
    return;
  }

  setIsLocating(true);
  setLocationError('');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setUserPosition([latitude, longitude]);
      setIsLocating(false);
    },
    () => {
      setLocationError('Nem sikerült lekérni a pozíciót. Engedélyezd a böngészőben a helymeghatározást.');
      setIsLocating(false);
    }
  );
};
  
  return (
    <div className="p-4 relative">
      
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

      {view === 'list' ? (
        // === LISTA NÉZET ===
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-rose-50 dark:text-amber-100">Nincs a keresésnek megfelelő találat.</p>
            </div>
          )}
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex flex-col">
  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
  <div className="p-4 flex flex-col flex-grow">
    
    {/* ÚJ, ÁTALAKÍTOTT RÉSZ A CÍMNEK ÉS A SZÍVNEK */}
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xl font-semibold text-indigo-500 dark:text-indigo-700 pr-2">
        {item.name}
      </h3>
      <button 
        onClick={() => isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id)} 
        className="text-rose-500 flex-shrink-0 p-1"
        aria-label={isFavorite(item.id) ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
      >
        {isFavorite(item.id) ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
      </button>
    </div>

    <p className="text-rose-50 dark:text-amber-100 mb-4 flex-grow">{item.description}</p>
    
    <div className="flex justify-between items-center mt-auto">
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
        className="bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600 transition"
      >
        Részletek
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // === TÉRKÉP NÉZET ===
        <div className="px-1 sm:px-4">
          <div className="rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <AttractionsMap 
              items={filteredItems} 
              onMarkerClick={(id) => setModalAttractionId(id)}
              onLocateMe={handleLocateMe}
              userPosition={userPosition}
              isLocating={isLocating}
            />
          </div>
        </div>
      )}

      {modalAttractionId && (
        <AttractionDetailModal 
          attractionId={modalAttractionId}
          onClose={() => setModalAttractionId(null)}
        />
      )}
    </div>
  );
}
