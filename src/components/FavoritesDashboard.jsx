// components/FavoritesDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';

function imgSrc(kind, item) {
  // próbáljuk meg a mappákat: events / attractions / leisure / gastro
  const name = item?.image || '';
  if (!name) return '';
  const byKind = {
    events: `/images/events/${name}`,
    attractions: `/images/attractions/${name}`,
    leisure: `/images/leisure/${name}`,
    restaurants: `/images/gastro/${name}`,
  };
  return byKind[kind] || `/images/${name}`;
}

function MiniTile({ kind, item, onClose, onRemove }) {
  const hrefMap = {
    events: `/events/${item.id}`,
    attractions: `/attractions/${item.id}`,
    leisure: `/leisure/${item.id}`,
    restaurants: `/gastronomy/${item.id}`,
  };
  const href = hrefMap[kind];
  const src = imgSrc(kind, item);

  return (
    <div className="relative w-36 shrink-0 snap-start rounded-xl overflow-hidden bg-white/70 dark:bg-gray-700/60 shadow">
      {/* remove gomb */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(String(item.id)); }}
        title="Eltávolítás a kedvencekből"
        aria-label="Eltávolítás a kedvencekből"
        className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-black/60 text-white text-sm leading-none grid place-items-center hover:bg-black/80"
      >
        ×
      </button>

      {/* kép */}
      {src ? (
        <div className="w-full aspect-[16/10] bg-neutral-200 dark:bg-neutral-600">
          <img
            src={src}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display='none'; }}
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/10] bg-neutral-200 dark:bg-neutral-600" />
      )}

      {/* cím + link */}
      <Link
        to={href}
        onClick={onClose}
        className="block p-2 text-xs font-medium line-clamp-2 hover:underline"
        title={item.name}
      >
        {item.name}
      </Link>
    </div>
  );
}

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
    <div className="absolute right-0 mt-2 w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-fadein-fast">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-purple-800 dark:text-purple-300">Kedvenceim</h3>
          <button onClick={onClose} className="text-xl text-gray-500 hover:text-gray-800 dark:hover:text-white">×</button>
        </div>

        {hasContent ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {attractions?.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Elmentett helyek</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {attractions.map(item => (
                    <MiniTile
                      key={`a-${item.id}`}
                      kind="attractions"
                      item={item}
                      onClose={onClose}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {events?.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Események</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {events.map(item => (
                    <MiniTile
                      key={`e-${item.id}`}
                      kind="events"
                      item={item}
                      onClose={onClose}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {leisure?.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Szabadidő</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {leisure.map(item => (
                    <MiniTile
                      key={`l-${item.id}`}
                      kind="leisure"
                      item={item}
                      onClose={onClose}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {restaurants?.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Vendéglátó</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {restaurants.map(item => (
                    <MiniTile
                      key={`r-${item.id}`}
                      kind="restaurants"
                      item={item}
                      onClose={onClose}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm text-center py-4 text-gray-600 dark:text-gray-400">Még nincsenek kedvenceid.</p>
        )}
      </div>
    </div>
  );
}
