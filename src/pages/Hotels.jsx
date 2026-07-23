import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchHotels } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft, FaMapMarkerAlt, FaBed } from 'react-icons/fa';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Hotels() {
  const { t } = useTranslation('hotels');
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetchHotels()
      .then(data => setHotels(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => {
    const base = Array.from(new Set(hotels.map(h => h.type))).filter(Boolean);
    return ['Minden', ...base.map(t => t.charAt(0).toUpperCase() + t.slice(1))];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const normalizedType = hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1);
      const matchesType = filterType === 'all' || filterType === 'Minden' || normalizedType === filterType;

      return matchesSearch && matchesType;
    });
  }, [hotels, searchTerm, filterType]);

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Szállások betöltése..." />
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      <SEO
          title="Szállások Kőszegen"
          description="Kőszegi szálláshelyek listája: hotelek, panziók, vendégházak és apartmanok. Foglalj szállást közvetlenül Kőszegen."
          url="/hotels"
          keywords="Kőszeg szállás, Kőszeg hotel, Kőszeg panzió, Kőszeg vendégház"
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-surface-card dark:bg-surface-card-dark backdrop-blur-md flex items-center justify-center shadow-card hover:scale-105 transition-transform border border-slate-200/80 dark:border-white/10">
            <FaArrowLeft className="text-sm text-gray-700 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('title')}
          </h1>
          <div className="w-9" />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex gap-3 h-10">
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full px-4 rounded-control
                       bg-surface-card dark:bg-surface-card-dark
                       backdrop-blur-md
                       border border-slate-200/80 dark:border-white/10
                       text-xs font-medium text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-brand
                       shadow-card transition-all duration-300"
            />
            <button
              aria-label="Keresés"
              className="w-10 h-10 rounded-control flex items-center justify-center
                       bg-brand text-gold-light border border-gold/30 shadow-card
                       hover:opacity-90 transition-all duration-300
                       hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <FaSearch className="text-xs" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 flex-nowrap scrollbar-hide">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type === 'Minden' ? 'all' : type)}
              className={`
                 flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-transform active:scale-95 border
                 ${(filterType === type || (filterType === 'all' && type === 'Minden'))
                  ? 'bg-brand dark:bg-brand text-gold-light border-gold/30 shadow-card'
                  : 'bg-surface-card dark:bg-surface-card-dark text-gray-600 dark:text-gray-400 border-slate-200/80 dark:border-white/10 hover:bg-gold/10'
                }
               `}
            >
              {type === 'Minden' ? t('all') : type}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.length > 0 ? (
            filteredHotels.map((hotel, index) => (
              <FadeUp key={`${hotel.id}-${index}`} delay={index * 0.1} duration={1.2}>
                <Link
                  to={`/hotels/${hotel.id}`}
                  className="group relative bg-surface-card dark:bg-surface-card-dark backdrop-blur-md rounded-card border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-card hover:shadow-floating transition-all duration-300 hover:scale-[1.02] flex flex-col h-72"
                >
                  {/* Image Section */}
                  <div className="relative h-44 overflow-hidden z-10">
                    {hotel.image ? (
                      <img
                        src={`/images/hotels/${hotel.image}`}
                        alt={hotel.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}

                    <div className={`${hotel.image ? 'hidden' : 'flex'} absolute inset-0 bg-slate-800 items-center justify-center`}>
                      <GhostImage className="w-full h-full opacity-50" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1 text-gold-light">
                        <FaBed /> {hotel.type}
                      </div>
                      <h3 className="text-lg font-bold leading-tight drop-shadow-md tracking-display">{hotel.name}</h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex-1 flex flex-col justify-between relative bg-surface-card dark:bg-surface-card-dark">
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 text-xs font-medium mb-3">
                      <FaMapMarkerAlt className="shrink-0 mt-0.5 text-gold-text dark:text-gold-light" />
                      <span className="line-clamp-2">{hotel.address}</span>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="px-4 py-1.5 rounded-full bg-brand text-gold-light text-[10px] font-semibold uppercase tracking-wider shadow-card border border-gold/30 group-hover:opacity-90 transition-opacity">
                        {t('view')}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-60">
              <p className="text-sm font-semibold text-gray-500">{t('noResults')}</p>
              <button onClick={() => { setFilterType('all'); setSearchTerm('') }} className="mt-2 text-gold-text dark:text-gold-light text-xs font-semibold hover:underline">
                {t('clearFilters')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
