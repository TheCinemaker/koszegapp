import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GastroCard from '../components/GastroCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../contexts/FavoritesContext';
import { FaSearch } from 'react-icons/fa';
import { FadeUp } from '../components/AppleMotion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const featuredIds = ['gastro-10'];

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0) / 0xffffffff;
}

function makeStableWeightFn(salt) {
  return (id) => hash32(String(salt) + ':' + String(id));
}

export default function Gastronomy({ restaurants = [], loading }) {
  const { t } = useTranslation('gastronomy');
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isFavorite } = useFavorites();

  const saltRef = useRef(Math.random().toString(36).slice(2));
  const weightOf = useMemo(() => makeStableWeightFn(saltRef.current), []);

  const types = useMemo(() => {
    const base = Array.from(new Set(restaurants.map(r => r.type))).filter(Boolean);
    return ['Minden', 'Kedvenceim', ...base];
  }, [restaurants]);

  const finalList = useMemo(() => {
    let filtered = restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'Kedvenceim') return isFavorite(r.id);
      return filterType === 'all' || filterType === 'Minden' || r.type === filterType;
    });

    const featured = filtered.filter(r => featuredIds.includes(r.id));
    const nonFeatured = filtered.filter(r => !featuredIds.includes(r.id));

    nonFeatured.sort((a, b) => {
      const wa = weightOf(a.id);
      const wb = weightOf(b.id);
      if (wa === wb) return a.name.localeCompare(b.name, 'hu');
      return wa - wb;
    });

    return [...featured, ...nonFeatured];
  }, [restaurants, filterType, searchTerm, isFavorite, weightOf]);

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Vendéglátás betöltése..." />
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      <SEO
          title="Éttermek és gasztronómia Kőszegen"
          description="Kőszeg legjobb éttermeinek, borozóinak és kávézóinak listája. Helyi specialitások, Kőszegi bor, asztalfoglalás és ételrendelés egy helyen."
          url="/gastronomy"
          keywords="Kőszeg étterem, Kőszeg bor, kőszegi gasztronómia, Kőszeg kávézó, Kőszeg borozó"
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-surface-card dark:bg-surface-card-dark backdrop-blur-md flex items-center justify-center shadow-card hover:scale-105 transition-transform border border-slate-200/80 dark:border-white/10">
            <svg className="w-5 h-5 text-gray-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
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
          {finalList.length > 0 ? (
            finalList.map((restaurant, index) => (
              <FadeUp key={restaurant.id} delay={index * 0.1} duration={1.2}>
                <GastroCard
                  restaurant={restaurant}
                />
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
