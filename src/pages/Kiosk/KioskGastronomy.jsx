// src/pages/Kiosk/KioskGastronomy.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { IoRestaurantOutline, IoLocationOutline, IoWalkOutline, IoCallOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchRestaurants } from '../../api';
import { getDistance, formatDistance } from './KioskAttractions';
import { useKioskLang } from '../../contexts/KioskLangContext';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

export default function KioskGastronomy() {
  const { t } = useKioskLang();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchRestaurants()
      .then(data => {
        if (isMounted) {
          setRestaurants(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load restaurants in Kiosk:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Compute distances and sort by proximity
  const sortedRestaurants = useMemo(() => {
    return (restaurants || [])
      .map(rest => {
        const dist = getDistance(KIOSK_LAT, KIOSK_LNG, rest.coords?.lat, rest.coords?.lng);
        return { ...rest, _distance: dist };
      })
      .sort((a, b) => a._distance - b._distance);
  }, [restaurants]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoRestaurantOutline className="text-sm" />
            {t('gastronomy.subtitle')}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            {t('gastronomy.title')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            {t('gastronomy.desc')}
          </p>
        </div>

        {/* Restaurants List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-16 text-zinc-400 text-xs font-medium">Betöltés...</div>
          ) : sortedRestaurants.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm font-semibold">
              {t('gastronomy.empty')}
            </div>
          ) : (
            sortedRestaurants.map((rest) => (
              <div
                key={rest.id}
                className="
                  relative rounded-3xl overflow-hidden
                  bg-white/80 dark:bg-zinc-900/60
                  backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                  shadow-sm flex flex-col sm:flex-row gap-4 p-4
                "
              >
                {/* Thumbnail Image */}
                <div 
                  className="w-full sm:w-28 h-28 rounded-2xl bg-cover bg-center shrink-0 bg-zinc-200 dark:bg-zinc-800"
                  style={{ 
                    backgroundImage: `url(${
                      rest.image 
                        ? (rest.image.startsWith('http') || rest.image.startsWith('/images/') ? rest.image : `/images/gastro/${rest.image}`) 
                        : '/images/event_default.jpg'
                    })`
                  }}
                />

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-0.5 gap-3">
                  <div className="flex flex-col gap-1.5">
                    
                    {/* Header line: Title + Distance */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mr-2 inline-block">
                          {rest.type || t('gastronomy.defaultType')}
                        </span>
                        <h3 className="text-lg font-bold text-zinc-950 dark:text-white leading-tight inline">
                          {rest.name}
                        </h3>
                      </div>

                      {/* Distance badge */}
                      <span className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                        <IoWalkOutline className="text-sm" />
                        {formatDistance(rest._distance, t('common.rightHere'))}
                      </span>
                    </div>

                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-2 font-semibold">
                      {rest.description}
                    </p>
                  </div>

                  {/* Footer details (no external websites/facebook links) */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold">
                    <div className="flex items-center gap-1">
                      <IoLocationOutline className="text-xs shrink-0" />
                      <span>{rest.address}</span>
                    </div>
                    {rest.phone && (
                      <div className="flex items-center gap-1">
                        <IoCallOutline className="text-xs shrink-0" />
                        <span>{rest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
