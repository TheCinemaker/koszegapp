import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAttractions } from '../api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import AttractionsMap from '../components/AttractionsMap';
import AttractionDetailModal from '../components/AttractionDetailModal';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { LocationContext } from '../contexts/LocationContext';
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
import SEO from '../components/SEO';

export default function Attractions() {
  const { t } = useTranslation('attractions');
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

  const { location, requestLocation } = React.useContext(LocationContext);

  useEffect(() => {
    if (location) {
      setUserPosition([location.lat, location.lng]);
      setIsLocating(false);
    }
  }, [location]);

  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationError('');
    requestLocation();

    setTimeout(() => {
      if (!location && isLocating) {
        // Optional timeout logic
      }
    }, 10000);
  };

  if (loading) return (
    <LoadingSpinner fullScreen={true} label="Látnivalók betöltése..." />
  );
  if (error) return <p className="text-red-500 p-8 text-center bg-red-50 m-4 rounded-xl">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <SEO
        title="Kőszeg látnivalói és nevezetességei"
        description="Felfedeznivalók Kőszegen: Jurisics-vár, Hősök kapuja, Fő tér, Chernel-kert, Óház-kilátó. Interaktív térkép és részletes leírások."
        url="/attractions"
        keywords="Kőszeg látnivalók, Kőszeg vár, Kőszeg Fő tér, Kőszeg nevezetességek"
      />

      <div className="max-w-7xl mx-auto">
        {/* Top Controls Area */}
        <FadeUp delay={0.1} className="mb-8">
          {/* Header Title with Back Button */}
          <div className="flex items-center gap-4 mb-6 mt-2">
            <Link to="/" aria-label="Vissza" className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400">
              <IoArrowBack className="text-lg" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('title')}
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 group">
            <div className="relative flex items-center bg-surface-card dark:bg-surface-card-dark rounded-control border border-slate-200/80 dark:border-white/10 shadow-card overflow-hidden transition-all duration-300 focus-within:border-brand">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full py-3.5 pl-4 pr-12 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-medium"
              />
              <div className="w-12 h-full flex items-center justify-center text-gray-400 group-focus-within:text-gold-text transition-colors">
                <IoSearchOutline className="text-xl" />
              </div>
            </div>
          </div>

          {/* Categories & View Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 border ${selectedCategory === category
                    ? 'bg-brand dark:bg-brand text-gold-light border-gold/30 shadow-card'
                    : 'bg-surface-card dark:bg-surface-card-dark text-gray-600 dark:text-gray-400 border-slate-200/80 dark:border-white/10 hover:bg-gold/10'
                    }`}
                >
                  {category === 'Minden' ? t('all') : category === 'Kedvenceim' ? t('favorites') : category}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="bg-surface-card dark:bg-surface-card-dark backdrop-blur-md p-1 rounded-control border border-slate-200/80 dark:border-white/10 flex gap-1 self-end sm:self-auto shadow-card">
              <button
                onClick={() => setView('list')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${view === 'list'
                  ? 'bg-brand text-gold-light shadow-card'
                  : 'text-gray-400 hover:bg-gold/10'
                  }`}
              >
                <IoListOutline className="text-lg" />
              </button>
              <button
                onClick={() => setView('map')}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${view === 'map'
                  ? 'bg-brand text-gold-light shadow-card'
                  : 'text-gray-400 hover:bg-gold/10'
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
                  <p className="text-xl font-light">{t('noResults')}</p>
                </FadeUp>
              )}
              {filteredItems.map((item, idx) => (
                <FadeUp
                  key={item.id}
                  delay={idx * 0.1}
                  duration={1.2}
                  className="group relative"
                >
                  <div className="
                    relative h-full block rounded-card overflow-hidden
                    bg-surface-card dark:bg-surface-card-dark
                    backdrop-blur-md
                    border border-slate-200/80 dark:border-white/10
                    shadow-card hover:shadow-floating
                    transition-all duration-500 hover:scale-[1.02] active:scale-[0.99]
                    flex flex-col
                  ">

                    {/* Image Area */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/koeszeg_logo_nobg.png'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gold/20 backdrop-blur-md border border-gold/40 text-[10px] font-semibold uppercase tracking-widest text-gold-light">
                        {item.category}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-rose-500 transition-all duration-300 shadow-card"
                      >
                        {isFavorite(item.id)
                          ? <IoHeart className="text-xl text-rose-500" />
                          : <IoHeartOutline className="text-xl" />
                        }
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 lg:p-8 flex flex-col flex-grow relative">
                      <div className="mb-2 relative z-10">
                        <h3 className="text-xl font-semibold tracking-display text-gray-900 dark:text-white leading-tight mb-1">
                          {item.name}
                        </h3>
                        <div className="h-1 w-12 bg-gold rounded-full opacity-50 group-hover:w-20 transition-all duration-500" />
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2 mb-6 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.description}
                      </p>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
                        <a
                          href={`https://www.google.com/maps?q=${item.coordinates.lat},${item.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gold-text transition-colors flex items-center gap-1"
                        >
                          <IoLocationOutline className="text-lg" /> {t('mapLink')}
                        </a>

                        <Link
                          to={`/attractions/${item.id}`}
                          className="flex items-center gap-1 text-sm font-semibold tracking-display text-gold-text dark:text-gold-light hover:gap-2 transition-all duration-300"
                        >
                          {t('details')} <IoChevronForward />
                        </Link>
                      </div>
                    </div>

                  </div>
                </FadeUp>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[60vh] rounded-surface shadow-floating border border-slate-200/80 dark:border-white/10 overflow-hidden relative z-10">
            <AttractionsMap items={filteredItems} onMarkerClick={(id) => setModalAttractionId(id)} onLocateMe={handleLocateMe} userPosition={userPosition} isLocating={isLocating} />
          </div>
        )}

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
