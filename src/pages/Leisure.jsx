import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLeisure } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaHeart, FaRegHeart, FaSearch, FaArrowLeft, FaMapMarkerAlt, FaHiking } from 'react-icons/fa';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';

export default function Leisure() {
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
    return ['Minden', 'Kedvenceim', ...base];
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      {/* 1. HEADER section wrapper matching Attractions/Gastronomy */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
            <FaArrowLeft className="text-sm text-gray-700 dark:text-white" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
            Szabadidő
          </h1>
          <div className="w-9" />
        </div>

        {/* Search Bar - EXACT REPLICA (h-8, gap-3) */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="search"
              placeholder="Keress programot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full px-4 rounded-lg
                       bg-white/60 dark:bg-gray-800/60
                       backdrop-blur-md
                       border border-white/40 dark:border-gray-700/50
                       text-xs font-medium text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-lime-500/30
                       shadow-sm transition-all duration-300
                       hover:bg-white/80 dark:hover:bg-gray-800/80"
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-gradient-to-br from-lime-500 to-green-600
                       text-white shadow-sm
                       hover:from-lime-600 hover:to-green-700
                       transition-all duration-300
                       hover:scale-105 active:scale-95"
            >
              <FaSearch className="text-xs" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 flex-nowrap scrollbar-hide">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type === 'Minden' ? 'all' : type)}
              className={`
                 flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-transform active:scale-95 border
                 ${(filterType === type || (filterType === 'all' && type === 'Minden'))
                  ? 'bg-lime-600 text-white border-transparent shadow-md'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.length > 0 ? (
            filteredList.map((item, index) => (
              <FadeUp key={`${item.id}-${index}`} delay={index * 0.15} duration={1.6}>
                <div
                  className="group relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/10 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-[22rem]"
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden z-10">
                    {item.image ? (
                      <img
                        src={`/images/leisure/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {/* Fallback Ghost */}
                    <div className={`${item.image ? 'hidden' : 'flex'} absolute inset-0 bg-gradient-to-br from-lime-50 to-green-50 dark:from-slate-800 dark:to-slate-900 items-center justify-center`}>
                      <GhostImage className="w-full h-full opacity-50" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">
                        <FaHiking /> {item.category || 'Szabadidő'}
                      </div>
                      <h3 className="text-xl font-bold leading-tight shadow-black drop-shadow-md">{item.name}</h3>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id);
                      }}
                      className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white shadow-sm hover:scale-110 transition-transform active:scale-95"
                    >
                      {isFavorite(item.id)
                        ? <FaHeart className="text-rose-500 text-sm animate-heart-pop" />
                        : <FaRegHeart className="text-sm" />
                      }
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between relative bg-white/30 dark:bg-white/5">
                    <p className="text-gray-600 dark:text-gray-300 text-xs font-medium line-clamp-3 leading-relaxed">
                      {item.shortDescription}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                      {item.location && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                          <FaMapMarkerAlt className="text-lime-600 dark:text-lime-400" />
                          <span className="truncate max-w-[120px]">{item.location}</span>
                        </div>
                      )}
                      <Link
                        to={`/leisure/${item.id}`}
                        className="px-4 py-2 rounded-full bg-lime-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-lime-500/30 group-hover:bg-lime-500 transition-colors"
                      >
                        Részletek
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-60">
              <p className="text-sm font-bold text-gray-500">Nincs találat...</p>
              <button onClick={() => { setFilterType('all'); setSearchTerm('') }} className="mt-2 text-lime-500 text-xs font-bold hover:underline">
                Szűrők törlése
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
