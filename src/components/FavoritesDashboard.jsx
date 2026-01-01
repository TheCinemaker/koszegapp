// src/components/FavoritesDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaTrash, FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaWalking, FaUtensils } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// --- KÉP FALLBACK HELPER (Marad) ---
function buildCandidates(kind, rawName) {
  const name = rawName || '';
  if (!name) return [];

  const direct = (name.startsWith('http') || name.startsWith('/images/')) ? [name] : [];
  const primaryByKind = {
    events: `/images/events/${name}`,
    attractions: `/images/attractions/${name}`,
    leisure: `/images/leisure/${name}`,
    restaurants: `/images/gastro/${name}`,
  };
  const primary = primaryByKind[kind];
  const fallback = `/images/${name}`;

  const list = [];
  for (const src of [...(direct.length ? direct : []), primary, fallback]) {
    if (src && !list.includes(src)) list.push(src);
  }
  return list;
}

function ImgWithFallback({ kind, name, alt, className }) {
  const [idx, setIdx] = React.useState(0);
  const candidates = React.useMemo(() => buildCandidates(kind, name), [kind, name]);
  const src = candidates[idx] || '';

  if (!src) return <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  );
}

// --- MINI TILE (Apple Store Style) ---
function MiniTile({ kind, item, onClose, onRemove }) {
  if (!item) return null;

  const hrefMap = {
    events: `/events/${item.id}`,
    attractions: `/attractions/${item.id}`,
    leisure: `/leisure/${item.id}`,
    restaurants: `/gastronomy/${item.id}`,
  };

  const href = hrefMap[kind];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative w-32 shrink-0 snap-start flex flex-col gap-2"
    >
      {/* Card Container - iOS App Icon Style */}
      <Link to={href} onClick={onClose} className="block relative aspect-square rounded-[22px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group-hover:scale-[1.02]">
        <ImgWithFallback
          kind={kind}
          name={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {/* Glass Gradient Protection */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Label inside image (Bottom) */}
        <div className="absolute bottom-2 left-3 right-3">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider drop-shadow-md">
            {kind === 'events' ? 'Esemény' : kind === 'attractions' ? 'Látnivaló' : kind === 'leisure' ? 'Szabadidő' : 'Gasztro'}
          </span>
        </div>
      </Link>

      {/* Title & Remove */}
      <div className="flex justify-between items-start gap-2 px-1">
        <Link to={href} onClick={onClose} className="text-xs font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 hover:text-blue-500 transition-colors">
          {item.name}
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(String(item.id)); }}
          className="shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"
          title="Törlés"
        >
          <FaTrash size={8} />
        </button>
      </div>
    </motion.div>
  );
}

// --- DASHBOARD (iOS Popover / Glass) ---
export default function FavoritesDashboard({
  attractions = [],
  events = [],
  leisure = [],
  restaurants = [],
  onClose
}) {
  const { removeFavorite } = useFavorites();

  const hasContent =
    (attractions?.length || 0) > 0 ||
    (events?.length || 0) > 0 ||
    (leisure?.length || 0) > 0 ||
    (restaurants?.length || 0) > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="
          fixed left-4 right-4 top-20 z-[9999]
          md:absolute md:right-0 md:left-auto md:top-full md:mt-4 md:w-[480px]
        "
      >
        {/* --- iOS Glass Material --- */}
        <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-[30px] backdrop-saturate-[1.8] rounded-[32px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-white/40 dark:border-white/10 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 flex items-center justify-center text-white text-sm">
                <FaStar />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Kedvencek</h2>
              </div>
            </div>

            {/* Close (X) */}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200/50 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors flex items-center justify-center text-gray-600 dark:text-white/60">
              <FaTimes size={12} />
            </button>
          </div>

          {/* Scrolling Content Area */}
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {hasContent ? (
              <>
                {/* Events Section */}
                {events?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <FaCalendarAlt className="text-pink-500 text-xs" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Események</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                      {events.map(item => <MiniTile key={item.id} kind="events" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                    </div>
                  </div>
                )}

                {/* Attractions Section */}
                {attractions?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <FaMapMarkerAlt className="text-blue-500 text-xs" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Látnivalók</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                      {attractions.map(item => <MiniTile key={item.id} kind="attractions" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                    </div>
                  </div>
                )}

                {/* Leisure & Restaurants (Grouped nicely) */}
                {(leisure?.length > 0 || restaurants?.length > 0) && (
                  <div className="grid grid-cols-1 gap-8">
                    {leisure?.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <FaWalking className="text-emerald-500 text-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Szabadidő</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                          {leisure.map(item => <MiniTile key={item.id} kind="leisure" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                        </div>
                      </div>
                    )}
                    {restaurants?.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <FaUtensils className="text-amber-500 text-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Gasztro</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                          {restaurants.map(item => <MiniTile key={item.id} kind="restaurants" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <FaStar className="text-3xl text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Még nincsenek kedvenceid</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jelöld meg a szívecskével, ami tetszik!</p>
              </div>
            )}
          </div>

          {/* Footer Blur Lip (Nice touch) */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 dark:from-[#1c1c1e]/80 to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
