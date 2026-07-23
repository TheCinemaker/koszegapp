import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLeisure } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaHeart, FaRegHeart, FaSearch, FaArrowLeft, FaMapMarkerAlt, FaHiking } from 'react-icons/fa';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leisure() {
  const { t } = useTranslation('leisure');
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchLeisure()
      .then(data => setList(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => {
    const base = Array.from(new Set(list.map(item => item.category || 'Egyéb'))).filter(Boolean);
    const sortedBase = base.sort((a, b) => {
      if (a.toLowerCase().includes('alpannonia')) return -1;
      if (b.toLowerCase().includes('alpannonia')) return 1;
      return a.localeCompare(b, 'hu');
    });
    return ['Minden', 'Kedvenceim', ...sortedBase];
  }, [list]);

  const filteredList = useMemo(() => {
    return list.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());

      const itemCategory = item.category || 'Egyéb';

      let matchesType = true;
      if (filterType === 'Kedvenceim') {
        matchesType = isFavorite(item.id);
      } else {
        matchesType = filterType === 'all' || filterType === 'Minden' || itemCategory === filterType;
      }

      return matchesSearch && matchesType;
    });
  }, [list, searchTerm, filterType, isFavorite]);

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Szabadidő betöltése..." />
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      <SEO
        title="Szabadidő és aktív kikapcsolódás Kőszegen"
        description="Túraútvonalak, tanösvények, Alpannonia túrák, kerékpárutak és aktív pihenés Kőszegen."
        url="/leisure"
        keywords="Kőszeg túra, Kőszeg kirándulás, Alpannonia Kőszeg, Kőszeg szabadidő"
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
              {type === 'Minden' ? t('all') : type === 'Kedvenceim' ? t('favorites') : type}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.length > 0 ? (
            filteredList.map((item, index) => (
              <FadeUp key={`${item.id}-${index}`} delay={index * 0.1} duration={1.2}>
                <div
                  className="group relative bg-surface-card dark:bg-surface-card-dark backdrop-blur-md rounded-card border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-card hover:shadow-floating transition-all duration-300 hover:scale-[1.02] flex flex-col h-[22rem]"
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden z-10">
                    {item.image ? (
                      <img
                        src={`/images/leisure/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}

                    <div className={`${item.image ? 'hidden' : 'flex'} absolute inset-0 bg-slate-800 items-center justify-center`}>
                      <GhostImage className="w-full h-full opacity-50" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Alpannonia Badge Index Overlay */}
                    {item.category && item.category.toLowerCase().includes('alpannonia') && (
                      <div className="absolute top-3 left-3 z-20">
                        <img
                          src={`/images/leisure/${item.category.toLowerCase().includes('hard') ? 'alpannonia-hard-index10.jpg' : 'alpannonia-light-index9.jpg'}`}
                          alt="alpannonia index"
                          className="w-10 h-10 rounded-full border border-white/40 shadow-card object-cover"
                        />
                      </div>
                    )}

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1 text-gold-light">
                        <FaHiking /> {item.category || t('defaultCategory')}
                      </div>
                      <h3 className="text-lg font-bold leading-tight drop-shadow-md tracking-display">{item.name}</h3>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id);
                      }}
                      className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white shadow-card hover:scale-110 transition-transform active:scale-95 z-20"
                    >
                      {isFavorite(item.id)
                        ? <FaHeart className="text-rose-500 text-sm" />
                        : <FaRegHeart className="text-sm" />
                      }
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between relative bg-surface-card dark:bg-surface-card-dark">
                    <p className="text-gray-600 dark:text-gray-300 text-xs font-medium line-clamp-3 leading-relaxed">
                      {item.shortDescription}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60 dark:border-white/5">
                      {item.location && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                          <FaMapMarkerAlt className="text-gold-text dark:text-gold-light" />
                          <span className="truncate max-w-[120px]">{item.location}</span>
                        </div>
                      )}
                      <Link
                        to={`/leisure/${item.id}`}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-card border transition-colors ${item.external
                          ? 'bg-gold/20 text-gold-light border-gold/40 hover:bg-gold/30'
                          : 'bg-brand text-gold-light border-gold/30 hover:opacity-90'
                          }`}
                      >
                        {item.external ? 'Külső oldal' : t('details')}
                      </Link>
                    </div>
                  </div>
                </div>
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
