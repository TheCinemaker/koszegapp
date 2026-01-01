import React, { useEffect, useState, useMemo } from 'react';
import { fetchHotels } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft, FaMapMarkerAlt, FaBed } from 'react-icons/fa';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';

export default function Hotels() {
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
    // Capitalize first letter for display
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-24 pt-0 px-4">
      {/* 1. HEADER section wrapper */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 pt-2">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
            <FaArrowLeft className="text-sm text-gray-700 dark:text-white" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
            Szállás
          </h1>
          <div className="w-9" />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="search"
              placeholder="Keress szállást..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-full px-4 rounded-lg
                       bg-white/60 dark:bg-gray-800/60
                       backdrop-blur-md
                       border border-white/40 dark:border-gray-700/50
                       text-xs font-medium text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-violet-500/30
                       shadow-sm transition-all duration-300
                       hover:bg-white/80 dark:hover:bg-gray-800/80"
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-gradient-to-br from-violet-500 to-purple-600
                       text-white shadow-sm
                       hover:from-violet-600 hover:to-purple-700
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
                  ? 'bg-violet-600 text-white border-transparent shadow-md'
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
          {filteredHotels.length > 0 ? (
            filteredHotels.map((hotel, index) => (
              <FadeUp key={`${hotel.id}-${index}`} delay={index * 0.15} duration={1.6}>
                <Link
                  to={`/hotels/${hotel.id}`}
                  className="group relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/10 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-72"
                >
                  {/* Image Section */}
                  <div className="relative h-40 overflow-hidden z-10">
                    {hotel.image ? (
                      <img
                        src={`/images/hotels/${hotel.image}`}
                        alt={hotel.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}

                    {/* Fallback Ghost */}
                    <div className={`${hotel.image ? 'hidden' : 'flex'} absolute inset-0 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 items-center justify-center`}>
                      <GhostImage className="w-full h-full opacity-50" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">
                        <FaBed /> {hotel.type}
                      </div>
                      <h3 className="text-xl font-bold leading-tight shadow-black drop-shadow-md">{hotel.name}</h3>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex-1 flex flex-col justify-between relative bg-white/30 dark:bg-white/5">
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 text-xs font-medium mb-3">
                      <FaMapMarkerAlt className="shrink-0 mt-0.5 text-violet-500" />
                      <span className="line-clamp-2">{hotel.address}</span>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className="px-4 py-2 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-violet-500/30 group-hover:bg-violet-500 transition-colors">
                        Megtekintés
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-60">
              <p className="text-sm font-bold text-gray-500">Nincs találat...</p>
              <button onClick={() => { setFilterType('all'); setSearchTerm('') }} className="mt-2 text-violet-500 text-xs font-bold hover:underline">
                Szűrők törlése
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
