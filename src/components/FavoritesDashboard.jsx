// src/components/FavoritesDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaTrash, FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaWalking, FaUtensils, FaHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// --- KÉP FALLBACK HELPER ---
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

// --- MINI TILE ---
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
      {/* Card Container - Primary Radius standard (rounded-2xl) */}
      <Link to={href} onClick={onClose} className="block relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group-hover:scale-[1.02]">
        <ImgWithFallback
          kind={kind}
          name={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {/* Glass Gradient Protection */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

        {/* Label inside image (Bottom) */}
        <div className="absolute bottom-2 left-2.5 right-2.5">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider drop-shadow-md">
            {kind === 'events' ? 'Esemény' : kind === 'attractions' ? 'Látnivaló' : kind === 'leisure' ? 'Szabadidő' : 'Gasztro'}
          </span>
        </div>
      </Link>

      {/* Title & Remove */}
      <div className="flex justify-between items-start gap-2 px-1">
        <Link to={href} onClick={onClose} className="text-xs font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
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
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="
          fixed left-4 right-4 top-20 z-[9999]
          md:absolute md:right-0 md:left-auto md:top-full md:mt-4 md:w-[480px]
        "
      >
        {/* Modal Container: Solid high-contrast background with rounded-3xl (Dialog Radius) */}
        <div className="bg-white dark:bg-[#18181b] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-200 dark:border-white/10 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center text-xs">
                <FaHeart />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Kedvencek</h2>
              </div>
            </div>

            {/* Close (X) */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center text-gray-600 dark:text-zinc-300"
            >
              <FaTimes size={12} />
            </button>
          </div>

          {/* Scrolling Content Area */}
          <div className="max-h-[70vh] overflow-y-auto p-6 space-y-7 scrollbar-hide">
            {hasContent ? (
              <>
                {/* Events Section */}
                {events?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <FaCalendarAlt className="text-pink-500 text-xs" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Események</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x scrollbar-hide">
                      {events.map(item => <MiniTile key={item.id} kind="events" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                    </div>
                  </div>
                )}

                {/* Attractions Section */}
                {attractions?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <FaMapMarkerAlt className="text-indigo-500 dark:text-indigo-400 text-xs" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Látnivalók</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x scrollbar-hide">
                      {attractions.map(item => <MiniTile key={item.id} kind="attractions" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                    </div>
                  </div>
                )}

                {/* Leisure & Restaurants */}
                {(leisure?.length > 0 || restaurants?.length > 0) && (
                  <div className="grid grid-cols-1 gap-7">
                    {leisure?.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <FaWalking className="text-emerald-500 text-xs" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Szabadidő</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x scrollbar-hide">
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
                        <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x scrollbar-hide">
                          {restaurants.map(item => <MiniTile key={item.id} kind="restaurants" item={item} onClose={onClose} onRemove={removeFavorite} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                  <FaHeart className="text-2xl text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">Még nincsenek kedvenceid</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Jelöld meg a szívecskével, ami tetszik!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
