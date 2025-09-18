// components/FavoritesDropdown.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { parseISO, isValid, endOfDay } from 'date-fns';

function isPastEvent(item) {
  if (!item) return false;
  const s = item.date && isValid(parseISO(item.date)) ? parseISO(item.date) : null;
  const e = item.end_date && isValid(parseISO(item.end_date)) ? parseISO(item.end_date) : s;
  if (!s || !e) return false;
  return endOfDay(e) < new Date();
}

export default function FavoritesDropdown({ attractions = [], events = [], leisure = [], onClose }) {
  const { removeFavorite, clearFavorites } = useFavorites();

  const sections = useMemo(() => ([
    attractions?.length ? { title: 'Helyek',    kind: 'attractions', items: attractions } : null,
    events?.length      ? { title: 'Események', kind: 'events',       items: events }      : null,
    leisure?.length     ? { title: 'Szabadidő', kind: 'leisure',      items: leisure }     : null,
  ].filter(Boolean)), [attractions, events, leisure]);

  const hasAny = sections.length > 0;

  return (
    <div
      className="absolute right-0 mt-2 w-72 bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl ring-1 ring-black/5"
      role="menu"
      aria-label="Kedvencek menü"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-purple-800 dark:text-purple-300">Személyes Programfüzet</h3>
          {hasAny && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFavorites(); }}
              className="text-xs text-red-600 hover:underline"
              title="Összes kedvenc törlése"
            >
              Mind törlése
            </button>
          )}
        </div>

        {!hasAny && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Még nincsenek kedvenceid.</p>
        )}

        {sections.map(sec => (
          <div key={sec.title} className="mb-3">
            <h4 className="font-semibold text-sm mb-1 text-gray-600 dark:text-gray-400">{sec.title}</h4>
            <ul className="space-y-1">
              {sec.items.map(item => {
                // ha netán stringet kapnánk, guard
                const id = String(typeof item === 'string' ? item : item.id);
                const name = typeof item === 'string' ? item : item.name;
                const href = `/${sec.kind}/${id}`;
                const muted = sec.kind === 'events' ? isPastEvent(item) : false;

                return (
                  <li key={id} className="flex items-center justify-between gap-2 py-1">
                    {muted ? (
                      <span className="text-sm truncate opacity-50">{name}</span>
                    ) : (
                      <Link
                        to={href}
                        onClick={onClose}
                        className="text-sm hover:underline truncate"
                        title={name}
                      >
                        {name}
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavorite(String(id));
                      }}
                      aria-label="Eltávolítás a kedvencekből"
                      className="shrink-0 rounded-md px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      title="Törlés"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
