// components/FavoritesDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaTrash, FaTimes, FaExternalLinkAlt, FaMapMarkerAlt, FaCalendarAlt, FaExternalLinkSquareAlt } from 'react-icons/fa';

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

  if (!src) return <div className="w-full h-full bg-gray-100" />;

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

// --- MINI TILE (Light Mode) ---
function MiniTile({ kind, item, onClose, onRemove }) {
  if (!item) return null;

  const hrefMap = {
    events: `/events/${item.id}`,
    attractions: `/attractions/${item.id}`,
    leisure: `/leisure/${item.id}`,
    restaurants: `/gastronomy/${item.id}`,
  };

  // Darker shades for Light Mode contrast
  const colorMap = {
    events: 'text-indigo-600',
    attractions: 'text-blue-600',
    leisure: 'text-emerald-600',
    restaurants: 'text-amber-600',
  };

  const href = hrefMap[kind];
  const accentColor = colorMap[kind] || 'text-gray-600';

  return (
    <div className="group relative w-36 shrink-0 snap-start flex flex-col gap-2">
      {/* Card Container - White Border / Shadow */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200/50 group-hover:border-indigo-300 transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]">
        {/* Image */}
        <ImgWithFallback
          kind={kind}
          name={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Subtle Gradient Overlay for text readability if needed, but here we have text outside */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Remove Button (Corner) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(String(item.id)); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/80 backdrop-blur-md border border-white/40 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
          title="Eltávolítás"
        >
          <FaTrash size={10} />
        </button>
      </div>

      {/* Text Content */}
      <Link to={href} onClick={onClose} className="group-hover:translate-x-1 transition-transform duration-300">
        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {item.name}
        </h4>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor} opacity-90`}>
          {kind === 'events' ? 'Esemény' : kind === 'attractions' ? 'Látnivaló' : kind === 'leisure' ? 'Szabadidő' : 'Gasztro'}
        </span>
      </Link>
    </div>
  );
}

// --- DASHBOARD (Light Mode - White Glass) ---
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
    <div
      className="
        fixed left-4 right-4 top-24 z-[9999]
        md:absolute md:right-0 md:left-auto md:top-full md:mt-4
        animate-fade-in-up origin-top
      "
      role="dialog"
      aria-label="Kedvenceim"
    >
      {/* --- Gradiens Keret Wrapper (Subtle Light Gradient) --- */}
      <div className="relative rounded-[32px] p-[2px] bg-gradient-to-br from-white via-indigo-50 to-purple-50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md">

        {/* --- Light Glass Content (95% White) --- */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[30px] p-5 md:p-6 md:w-[420px] max-h-[75vh] overflow-y-auto scrollbar-hide relative border border-white/50">

          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative z-10 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              {/* Icon Background */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white shadow-indigo-200">
                <div className="font-bold text-lg">❤️</div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800 tracking-tight">Kedvenceim</h3>
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Mentett elemek</p>
              </div>
            </div>
            {/* Close Button (Gray/White) */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 transition-all hover:scale-105"
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          {hasContent ? (
            <div className="space-y-8 relative z-10">
              {events?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FaCalendarAlt className="text-indigo-500 text-xs" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-indigo-500">Események</h4>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                    {events.map(item => (
                      <MiniTile key={`e-${item.id}`} kind="events" item={item} onClose={onClose} onRemove={removeFavorite} />
                    ))}
                  </div>
                </section>
              )}

              {attractions?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FaMapMarkerAlt className="text-blue-500 text-xs" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-blue-500">Látnivalók</h4>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                    {attractions.map(item => (
                      <MiniTile key={`a-${item.id}`} kind="attractions" item={item} onClose={onClose} onRemove={removeFavorite} />
                    ))}
                  </div>
                </section>
              )}

              {leisure?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-emerald-500 text-xs">🏃</div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-500">Szabadidő</h4>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                    {leisure.map(item => (
                      <MiniTile key={`l-${item.id}`} kind="leisure" item={item} onClose={onClose} onRemove={removeFavorite} />
                    ))}
                  </div>
                </section>
              )}

              {restaurants?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-amber-500 text-xs">🍔</div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-amber-500">Gasztro</h4>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide">
                    {restaurants.map(item => (
                      <MiniTile key={`r-${item.id}`} kind="restaurants" item={item} onClose={onClose} onRemove={removeFavorite} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                <div className="text-3xl opacity-30 grayscale">❤️</div>
              </div>
              <p className="text-gray-800 font-medium mb-1">Még nincsenek kedvenceid</p>
              <p className="text-xs text-gray-500 max-w-[200px]">Böngéssz az alkalmazásban és jelöld meg szívvel, ami tetszik!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
