import React, { useState, useMemo, useCallback, useRef } from 'react';
import GastroCard from '../components/GastroCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { FaSearch } from 'react-icons/fa';
import { FadeUp } from '../components/AppleMotion';

import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { favorites, isFavorite } = useFavorites();

  const saltRef = useRef(Math.random().toString(36).slice(2));
  const weightOf = useMemo(() => makeStableWeightFn(saltRef.current), []);

  const types = useMemo(() => {
    const base = Array.from(new Set(restaurants.map(r => r.type))).filter(Boolean);
    return ['Minden', 'Kedvenceim', ...base];
  }, [restaurants]);

  const finalList = useMemo(() => {
    let filtered = restaurants.filter(r => {
      // Text search
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Type filter
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      {/* 1. HEADER section wrapper matching Attractions */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-gray-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
            Gasztro & Ízek
          </h1>
          <div className="w-9" />
        </div>

        {/* Search Bar - MATCHING EXACTLY ATTRACTIONS/EVENTS (h-8, gap-3) */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="search"
              placeholder="Keress éttermet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full px-4 rounded-lg
                       bg-white/60 dark:bg-gray-800/60
                       backdrop-blur-md
                       border border-white/40 dark:border-gray-700/50
                       text-xs font-medium text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-orange-500/30
                       shadow-sm transition-all duration-300
                       hover:bg-white/80 dark:hover:bg-gray-800/80"
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-gradient-to-br from-orange-500 to-red-600
                       text-white shadow-sm
                       hover:from-orange-600 hover:to-red-700
                       transition-all duration-300
                       hover:scale-105 active:scale-95"
            >
              <FaSearch className="text-xs" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Filter Pills (Aligned with Search Bar) */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 flex-nowrap scrollbar-hide">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type === 'Minden' ? 'all' : type)}
              className={`
                 flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-transform active:scale-95 border
                 ${(filterType === type || (filterType === 'all' && type === 'Minden'))
                  ? 'bg-orange-600 text-white border-transparent shadow-md'
                  : 'bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-white/40 dark:border-white/10 hover:bg-white/80'
                }
               `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalList.length > 0 ? (
            finalList.map((restaurant, index) => (
              <FadeUp key={restaurant.id} delay={index * 0.15} duration={1.6}>
                <GastroCard
                  restaurant={restaurant}
                />
              </FadeUp>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-60">
              <p className="text-sm font-bold text-gray-500">Nincs találat...</p>
              <button onClick={() => { setFilterType('all'); setSearchTerm('') }} className="mt-2 text-orange-500 text-xs font-bold hover:underline">
                Szűrők törlése
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
