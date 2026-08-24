import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { fetchParking } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';
import {
  IoArrowBack,
  IoLocationOutline,
  IoMapOutline,
  IoCarSportOutline
} from 'react-icons/io5';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import { AnimatePresence } from 'framer-motion';
import SMSParkingCard from '../components/SMSParkingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO';

export default function Parking() {
  const { t } = useTranslation('parking');
  const navigate = useNavigate();
  const [parkingSpots, setParkingSpots] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchParking()
      .then(data => setParkingSpots(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Parkolási adatok betöltése..." />
    );
  }

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <SEO
        title="Parkolás Kőszegen"
        description="Parkolóhelyek, zónák, díjak és SMS parkolási információk Kőszegen."
        url="/parking"
        keywords="Kőszeg parkolás, Kőszeg parkoló, SMS parkolás Kőszeg"
      />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* 1. SIMPLE HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 hover:opacity-90 transition-opacity">
            <IoArrowBack className="text-xl text-brand dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('title')}
          </h1>
        </div>

        {/* SMS PARKING CARD */}
        <FadeUp delay={0.05}>
          <SMSParkingCard />
        </FadeUp>

        {/* 2. MAP BUTTON */}
        <FadeUp delay={0.1} className="mb-6 flex justify-end">
          <Link to="/parking-map" className="flex-shrink-0 relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] w-12 h-12 flex items-center justify-center border border-white/60 dark:border-white/10 bg-brand text-white">
            <IoMapOutline className="text-xl" />
          </Link>
        </FadeUp>

        {/* 3. PARKING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {parkingSpots.length > 0 ? (
              parkingSpots.map((spot, index) => {
                const isPaid = isParkingPaidNow(spot.hours);
                return (
                  <FadeUp
                    key={`${spot.id}-${index}`}
                    delay={index * 0.08}
                    duration={1}
                    className="h-full"
                  >
                    <Link
                      to={`/parking/${spot.id}`}
                      className="
                            group relative block h-full
                            bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10
                            rounded-2xl overflow-hidden
                            shadow-sm hover:shadow-md
                            transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                            flex flex-col
                        "
                    >
                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden z-10">
                        {spot.image ? (
                          <img
                            src={`/images/parking/${spot.image}`}
                            alt={spot.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out"
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
                        <div className={`${spot.image ? 'hidden' : 'flex'} absolute inset-0 bg-slate-800 items-center justify-center`}>
                          <GhostImage className="w-full h-full opacity-50" />
                          <IoCarSportOutline className="absolute text-5xl text-gray-400/50" />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                        {/* Status Badge */}
                        <div className={`
                                    absolute top-4 right-4 px-3 py-1.5 rounded-full border border-white/20 
                                    flex items-center gap-1.5 text-[10px] font-semibold text-white shadow-sm uppercase tracking-wider
                                    ${isPaid ? 'bg-rose-500/90' : 'bg-emerald-500/90'} backdrop-blur-md
                                `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-white' : 'bg-white animate-pulse'}`} />
                          {isPaid ? t('paid') : t('free')}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex-1 flex flex-col justify-between relative">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 tracking-display">
                            {spot.name}
                          </h3>
                          <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
                            <IoLocationOutline className="shrink-0 text-base text-brand dark:text-brand-light" />
                            <span className="line-clamp-2">{spot.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-white/10 pt-4 mt-6">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                            {spot.capacity ? `${spot.capacity} ${t('spots')}` : ''}
                          </span>
                          <span className="text-xs font-semibold text-brand dark:text-brand-light flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
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
                <p className="text-lg font-semibold text-gray-500">{t('noResults')}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
