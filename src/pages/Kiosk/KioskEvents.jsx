// src/pages/Kiosk/KioskEvents.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCalendarOutline, IoLocationOutline, IoWalkOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { getDistance, formatDistance } from './KioskAttractions';
import { useKioskLang } from '../../contexts/KioskLangContext';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

const getEventImage = (image) => {
  if (!image) return '/images/fo_ter.jpg';
  if (image.startsWith('http')) return image;
  if (image === 'event_default.jpg') return '/images/fo_ter.jpg';
  if (image === 'varszinhaz_default.jpg') return '/images/events/varszinhaz_default.jpg';
  return `/images/events/${image}`;
};

export const VENUE_COORDS = {
  "jurisics-vár": { lat: 47.3900222, lng: 16.539825 },
  "jurisics vár": { lat: 47.3900222, lng: 16.539825 },
  "vár": { lat: 47.3900222, lng: 16.539825 },
  "fő tér": { lat: 47.3884512, lng: 16.5420029 },
  "főtér": { lat: 47.3884512, lng: 16.5420029 },
  "portré étterem": { lat: 47.3884512, lng: 16.5420029 },
  "tóth pincészet borház": { lat: 47.387309, lng: 16.541962 },
  "stefanich pincészet": { lat: 47.384315, lng: 16.545902 }
};

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function KioskEvents({ events }) {
  const navigate = useNavigate();
  const { t } = useKioskLang();

  // Compute event coordinates and distances, filter future events, and sort them chronologically
  const processedEvents = useMemo(() => {
    if (!events) return [];

    const today = getLocalDateString();
    const currentEvents = events.filter(evt => (evt.date || '') >= today);

    const mapped = currentEvents.map(evt => {
      const locKey = String(evt.location || '').toLowerCase().trim();
      let coords = null;

      // Try finding direct or partial match in venue map
      for (const [key, value] of Object.entries(VENUE_COORDS)) {
        if (locKey.includes(key)) {
          coords = value;
          break;
        }
      }

      const dist = coords ? getDistance(KIOSK_LAT, KIOSK_LNG, coords.lat, coords.lng) : null;
      return { ...evt, _distance: dist };
    });

    // Sort chronologically by date and time
    return mapped.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });
  }, [events]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoCalendarOutline className="text-sm" />
            {t('events.subtitle')}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            {t('events.title')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            {t('events.desc')}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {processedEvents.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-zinc-400 text-xs font-medium">Betöltés...</div>
          ) : (
            processedEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/kiosk/events/${evt.id}`)}
                className="
                  relative rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between
                  bg-white/80 dark:bg-zinc-900/60
                  backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                  shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.005] active:scale-[0.99]
                "
              >
                {/* Banner Image */}
                <div 
                  className="w-full h-40 bg-cover bg-center bg-zinc-200 dark:bg-zinc-800 relative"
                  style={{ 
                    backgroundImage: `url(${getEventImage(evt.image)})`
                  }}
                >
                  {/* Distance badge if resolved */}
                  {evt._distance !== null && (
                    <div className="absolute top-3 right-3 flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-black/75 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-md">
                      <IoWalkOutline className="text-xs" />
                      {formatDistance(evt._distance)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      {evt.date}
                    </span>
                    <h3 className="text-base font-extrabold text-zinc-950 dark:text-white leading-snug line-clamp-2">
                      {evt.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold">
                    <IoLocationOutline className="text-xs shrink-0" />
                    <span className="line-clamp-1">{evt.location}</span>
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
