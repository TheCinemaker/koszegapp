import React, { useEffect, useState } from 'react';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';
import AttractionsMap from '../components/AttractionsMap';
import AttractionDetailModal from '../components/AttractionDetailModal';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  IoListOutline,
  IoMapOutline,
  IoHeart,
  IoHeartOutline,
  IoArrowBack,
  IoSearchOutline,
  IoLocationOutline,
  IoChevronForward
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

export default function Attractions() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Minden']);
  const [selectedCategory, setSelectedCategory] = useState('Minden');
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalAttractionId, setModalAttractionId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchAttractions()
      .then(data => {
        setItems(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let availableCategories = ['Minden', ...new Set(items.map(item => item.category))];
    if (favorites.length > 0) {
      if (!availableCategories.includes('Kedvenceim')) {
        availableCategories.splice(1, 0, 'Kedvenceim');
      }
    }
    setCategories(availableCategories);
  }, [items, favorites]);

  const filteredItems = items
    .filter(item => {
      if (selectedCategory === 'Kedvenceim') {
        return isFavorite(item.id);
      }
      return selectedCategory === 'Minden' || item.category === selectedCategory;
    })
    .filter(item => {
      const query = searchQuery.toLowerCase().trim();
      if (query === '') return true;
      const nameMatch = item.name.toLowerCase().includes(query);
      const descriptionMatch = item.description.toLowerCase().includes(query);
      const tagsMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));
      return nameMatch || descriptionMatch || tagsMatch;
    });

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
        setLocationError('Nem sikerült lekérni a pozíciót. Engedélyezd a böngészőben.');
        setIsLocating(false);
      }
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* GLOBAL BACKGROUND NOISE (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* 1. SIMPLE HEADER */}
        <FadeUp className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-colors shadow-sm">
            <IoArrowBack className="text-xl text-gray-900 dark:text-white" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Látnivalók
          </h1>
        </FadeUp>

        {/* 2. SEARCH & CONTROLS */}
        <FadeUp delay={0.1} className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative group h-12">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative flex h-full shadow-sm rounded-2xl overflow-hidden bg-white/70 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 group-hover:shadow-lg transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keress kincseket..."
                className="flex-1 h-full px-5 bg-transparent
                           text-sm font-medium text-gray-900 dark:text-gray-100
                           placeholder-gray-500 dark:placeholder-gray-400
                           focus:outline-none"
              />
              <div className="w-12 h-full flex items-center justify-center text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <IoSearchOutline className="text-xl" />
              </div>
            </div>
          </div>

          {/* Categories & View Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mask-image-linear-gradient">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border ${selectedCategory === category
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105'
                      : 'bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-white/30 hover:bg-white/60 dark:hover:bg-white/10'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 flex gap-1 self-end sm:self-auto">
              <button
                onClick={() => setView('list')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${view === 'list'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm scale-110'
                  : 'text-gray-400 hover:bg-white/50'
                  }`}
              >
                <IoListOutline className="text-lg" />
              </button>
              <button
                onClick={() => setView('map')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${view === 'map'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm scale-110'
                  : 'text-gray-400 hover:bg-white/50'
                  }`}
              >
                <IoMapOutline className="text-lg" />
              </button>
            </div>
          </div>
        </FadeUp>

        {locationError && <p className="text-center text-red-500 mb-4 text-sm">{locationError}</p>}

        {view === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredItems.length === 0 && !loading && (
                <FadeUp className="col-span-full text-center py-20 opacity-50">
                  <p className="text-xl font-light">Nincs találat.</p>
                </FadeUp>
              )}
              {filteredItems.map((item, idx) => (
                <FadeUp
                  key={item.id}
                  delay={idx * 0.1} // Staggered delay
                  duration={1.2}
                  className="group relative"
                >
                  <div className="
                    relative h-full block rounded-[2rem] overflow-hidden
                    bg-white/70 dark:bg-white/5 
                    backdrop-blur-[20px] backdrop-saturate-[1.6]
                    border border-white/60 dark:border-white/10
                    shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20
                    transition-all duration-700 hover:scale-[1.02] active:scale-[0.99]
                    flex flex-col
                  ">

                    {/* Image Area */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ease-out"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/koeszeg_logo_nobg.png'; }}
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white">
                        {item.category}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-rose-500 transition-all duration-300 shadow-lg"
                      >
                        {isFavorite(item.id)
                          ? <IoHeart className="text-xl text-rose-500" />
                          : <IoHeartOutline className="text-xl" />
                        }
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex flex-col flex-grow relative">
                      {/* Shine Effect (Internal) */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000" />

                      <div className="mb-2 relative z-10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                          {item.name}
                        </h3>
                        <div className="h-1 w-12 bg-indigo-500 rounded-full opacity-50 group-hover:w-20 transition-all duration-500" />
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2 mb-6 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.description}
                      </p>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
                        <a
                          href={`https://www.google.com/maps?q=${item.coordinates.lat},${item.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
                        >
                          <IoLocationOutline className="text-lg" /> Térkép
                        </a>

                        <Link
                          to={`/attractions/${item.id}`}
                          className="flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all duration-300"
                        >
                          Részletek <IoChevronForward />
                        </Link>
                      </div>
                    </div>

                  </div>
                </FadeUp>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[60vh] rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden relative z-10">
            <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Loading/Placeholder state */}
            <AttractionsMap items={filteredItems} onMarkerClick={(id) => setModalAttractionId(id)} onLocateMe={handleLocateMe} userPosition={userPosition} isLocating={isLocating} />
          </div>
        )}

        {/* Modal Logic (Ideally should be a page transition, but keeping modal for map view) */}
        {modalAttractionId && (
          <AttractionDetailModal
            attractionId={modalAttractionId}
            onClose={() => setModalAttractionId(null)}
            isFavorite={isFavorite}
            addFavorite={addFavorite}
            removeFavorite={removeFavorite}
          />
        )}
      </div>
    </div>
  );
}
