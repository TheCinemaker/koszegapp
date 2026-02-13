import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // Added import
import { Link, useNavigate } from 'react-router-dom';
import { fetchParking } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';
import {
  IoSearchOutline,
  IoArrowBack,
  IoLocationOutline,
  IoMapOutline,
  IoCarSportOutline
} from 'react-icons/io5';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import { AnimatePresence } from 'framer-motion';
import SMSParkingCard from '../components/SMSParkingCard';

export default function Parking() {
  const { t } = useTranslation('parking'); // Load namespace
  const navigate = useNavigate();
  const [parkingSpots, setParkingSpots] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetchParking()
      .then(data => setParkingSpots(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => {
    return ['Minden', 'Ingyenes', 'Fizetős'];
  }, []);

  const filteredSpots = useMemo(() => {
    return parkingSpots.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const isPaid = isParkingPaidNow(spot.hours);
      let matchesType = true;

      if (filterType === 'Ingyenes') matchesType = isPaid === false;
      if (filterType === 'Fizetős') matchesType = isPaid === true;

      return matchesSearch && matchesType;
    });
  }, [parkingSpots, searchTerm, filterType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">



        {/* 1. SIMPLE HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-colors shadow-sm">
            <IoArrowBack className="text-xl text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('title')}
          </h1>
        </div>

        {/* NEW: SMS PARKING CARD */}
        <FadeUp delay={0.05}>
          <SMSParkingCard />
        </FadeUp>

        {/* 2. SEARCH & CONTROLS */}
        <FadeUp delay={0.1} className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative group h-12">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-500/20 to-stone-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative flex h-full shadow-sm rounded-2xl overflow-hidden bg-white/70 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 group-hover:shadow-lg transition-all duration-300">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 h-full px-5 bg-transparent
                           text-sm font-medium text-gray-900 dark:text-gray-100
                           placeholder-gray-500 dark:placeholder-gray-400
                           focus:outline-none"
              />
              <div className="w-12 h-full flex items-center justify-center text-gray-400 group-focus-within:text-zinc-500 transition-colors">
                <IoSearchOutline className="text-xl" />
              </div>
            </div>
          </div>

          {/* Filters & Map Button Row */}
          <div className="flex items-center gap-3">
            {/* Scrollable Pills */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 flex-nowrap scrollbar-hide mask-image-linear-gradient">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type === 'Minden' ? 'all' : type)}
                  className={`
                       flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border
                       ${(filterType === type || (filterType === 'all' && type === 'Minden'))
                      ? 'bg-zinc-800 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105'
                      : 'bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-white/30 hover:bg-white/60 dark:hover:bg-white/10'
                    }
                     `}
                >
                  {type === 'Minden' ? t('all') : type === 'Ingyenes' ? t('free') : t('paid')}
                </button>
              ))}
            </div>

            {/* Map Button - Compact iOS 26 Style */}
            <Link to="/parking-map" className="flex-shrink-0 relative group overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] w-12 h-12 flex items-center justify-center border border-white/40 bg-white/50 dark:bg-black/30 backdrop-blur-md">
              <IoMapOutline className="text-xl text-zinc-600 dark:text-zinc-400" />
            </Link>
          </div>
        </FadeUp>

        {/* 3. PARKING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSpots.length > 0 ? (
              filteredSpots.map((spot, index) => {
                const isPaid = isParkingPaidNow(spot.hours);
                return (
                  <FadeUp
                    key={`${spot.id}-${index}`}
                    delay={index * 0.1}
                    duration={1}
                    className="h-full"
                  >
                    <Link
                      to={`/parking/${spot.id}`}
                      className="
                            group relative block h-full
                            bg-white/70 dark:bg-white/5 
                            backdrop-blur-[20px] backdrop-saturate-[1.6]
                            border border-white/60 dark:border-white/10
                            rounded-[2rem] overflow-hidden
                            shadow-sm hover:shadow-2xl hover:shadow-zinc-500/20
                            transition-all duration-700 hover:scale-[1.02] active:scale-[0.98]
                            flex flex-col
                        "
                    >
                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden z-10">
                        {spot.image ? (
                          <img
                            src={`/images/parking/${spot.image}`}
                            alt={spot.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ease-out"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const sibling = e.target.nextElementSibling;
                              if (sibling) {
                                sibling.classList.remove('hidden');
                                sibling.classList.add('flex');
                              }
                            }}
                          />
                        ) : null}
                        {/* Fallback Ghost */}
                        <div className={`${spot.image ? 'hidden' : 'flex'} absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 items-center justify-center`}>
                          <GhostImage className="w-full h-full opacity-50" />
                          <IoCarSportOutline className="absolute text-5xl text-gray-400/50" />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                        {/* Status Badge */}
                        <div className={`
                                    absolute top-4 right-4 px-3 py-1.5 rounded-full border border-white/20 
                                    flex items-center gap-1.5 text-[10px] font-bold text-white shadow-lg uppercase tracking-wider
                                    ${isPaid ? 'bg-rose-500/90' : 'bg-emerald-500/90'} backdrop-blur-xl
                                `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-white' : 'bg-white animate-pulse'}`} />
                          {isPaid ? t('paid') : t('free')}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex-1 flex flex-col justify-between relative bg-gradient-to-b from-white/10 to-transparent">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                            {spot.name}
                          </h3>
                          <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
                            <IoLocationOutline className="shrink-0 text-base text-zinc-500" />
                            <span className="line-clamp-2">{spot.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-white/10 pt-4 mt-6">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {spot.capacity ? `${spot.capacity} ${t('spots')}` : ''}
                          </span>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                            {t('details')} <IoArrowBack className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </FadeUp>
                )
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40">
                <IoCarSportOutline className="text-6xl text-gray-400 mb-4" />
                <p className="text-lg font-bold text-gray-500">{t('noResults')}</p>
                <button onClick={() => { setFilterType('all'); setSearchTerm('') }} className="mt-2 text-zinc-500 text-sm font-bold hover:underline">
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
