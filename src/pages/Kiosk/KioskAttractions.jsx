// src/pages/Kiosk/KioskAttractions.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLocationOutline, IoWalkOutline, IoCompassOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';

// Portré Étterem coordinates (kiosk location)
const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

// Haversine formula for distance calculation in meters
export function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters) {
  if (meters === Infinity) return '';
  if (meters < 15) return 'Itt van melletted';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function KioskAttractions({ attractions }) {
  const navigate = useNavigate();

  // Compute distances and sort by proximity
  const sortedAttractions = useMemo(() => {
    if (!attractions) return [];
    return attractions
      .map(attr => {
        const dist = getDistance(KIOSK_LAT, KIOSK_LNG, attr.coords?.lat, attr.coords?.lng);
        return { ...attr, _distance: dist };
      })
      .sort((a, b) => a._distance - b._distance);
  }, [attractions]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoCompassOutline className="text-sm" />
            Turisztikai Felfedező
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            Látnivalók a közelemben
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            Kőszeg történelmi látványosságai és műemlékei, a Portré Étteremtől való távolságuk alapján rendezve.
          </p>
        </div>

        {/* Attractions List */}
        <div className="flex flex-col gap-4">
          {sortedAttractions.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm font-semibold animate-pulse">
              Adatok betöltése...
            </div>
          ) : (
            sortedAttractions.map((attr) => (
              <div
                key={attr.id}
                onClick={() => navigate(`/kiosk/attractions/${attr.id}`)}
                className="
                  relative rounded-3xl overflow-hidden cursor-pointer
                  bg-white/80 dark:bg-zinc-900/60
                  backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                  shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.005] active:scale-[0.99]
                  flex flex-col sm:flex-row gap-4 p-4
                "
              >
                {/* Thumbnail Image */}
                <div 
                  className="w-full sm:w-32 h-32 rounded-2xl bg-cover bg-center shrink-0 bg-zinc-200 dark:bg-zinc-800"
                  style={{ 
                    backgroundImage: `url(${
                      attr.image 
                        ? (attr.image.startsWith('http') || attr.image.startsWith('/images/') ? attr.image : `/images/${attr.image}`) 
                        : '/images/event_default.jpg'
                    })`
                  }}
                />

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg font-bold text-zinc-950 dark:text-white leading-tight">
                        {attr.name}
                      </h3>
                      {/* Distance badge */}
                      <span className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                        <IoWalkOutline className="text-sm" />
                        {formatDistance(attr._distance)}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-2 font-semibold">
                      {attr.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold">
                    <IoLocationOutline className="text-zinc-500 dark:text-zinc-400" />
                    <span>{attr.address}</span>
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
