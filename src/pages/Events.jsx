import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../api';
import {
  format,
  parseISO,
  areIntervalsOverlapping,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  endOfDay,
  addHours
} from 'date-fns';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import EventImageCard from '../components/EventImageCard';

const MONTH_NAMES = ['Január','Február','Március','Április','Május','Június','Július','Augusztus','Szeptember','Október','November','December'];
const MONTH_SHORT = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Szep','Okt','Nov','Dec'];

function computeRange(evt) {
  // Alapeset: date + end_date (ISO)
  if (evt?.date) {
    const sBase = parseISO(evt.date);
    const eBase = parseISO(evt.end_date || evt.date);

    // time feldolgozás
    if (evt.time && typeof evt.time === 'string') {
      const t = evt.time.replace(/\s/g, '');
      // "HH:mm-HH:mm"
      if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) {
        const [ts, te] = t.split('-');
        const [hs, ms] = ts.split(':').map(Number);
        const [he, me] = te.split(':').map(Number);
        const s = new Date(sBase);
        s.setHours(hs, ms ?? 0, 0, 0);
        const e = new Date(eBase);
        e.setHours(he, me ?? 0, 0, 0);
        return { _s: s, _e: e };
      }
      // "HH:mm"
      if (/^\d{2}:\d{2}$/.test(t)) {
        const [h, m] = t.split(':').map(Number);
        const s = new Date(sBase);
        s.setHours(h, m ?? 0, 0, 0);
        const e = addHours(s, 2);
        return { _s: s, _e: e };
      }
    }

    // nincs használható time → egész napos intervallum
    const s = new Date(sBase); s.setHours(0,0,0,0);
    const e = new Date(eBase); e.setHours(23,59,59,999);
    return { _s: s, _e: e };
  }

  // Régi fallback: "start/end" a date-ben
  if (evt?.date && evt.date.includes('/')) {
    const [a, b] = evt.date.split('/');
    return { _s: parseISO(a), _e: parseISO(b) };
  }

  return { _s: null, _e: null };
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('week'); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openPicker, setOpenPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { favorites, addFavorite, removeFavorite, isFavorite, pruneFavorites } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then(data => {
        // egységesítés: egynaposoknál töltsük fel end_date = date
        const norm = data.map(e => ({
          ...e,
          end_date: e.end_date || e.date,
          tags: (e.tags || []).map(t => String(t).toLowerCase())
        }));
        // dátum szerinti rendezés (kezdőnap)
        const sorted = norm.slice().sort((a, b) => a.date.localeCompare(b.date));
        setEvents(sorted);

        // --- KEDVENCEK AUTOTAKARÍTÁS ---
        const validIds = new Set(sorted.map(e => e.id));
        const isUpcomingById = (id) => {
        const evt = sorted.find(x => x.id === id);
        if (!evt) return false;
        const s = parseISO(evt.date);
        const e = parseISO(evt.end_date || evt.date);
        // end-of-day a végdátumra
        e.setHours(23,59,59,999);
        return e >= new Date();
        };
        pruneFavorites(validIds, isUpcomingById);

        // top tagek
        const allTags = sorted.flatMap(event => event.tags || []);
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});
        const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 10);
        setTags(topTags);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const wkStart = startOfWeek(now,{weekStartsOn:1});
  const wkEnd = endOfWeek(now,{weekStartsOn:1});
  const moStart = startOfMonth(now);
  const moEnd = endOfMonth(now);

  const normalized = useMemo(() => {
    return events.map(evt => {
      const { _s, _e } = computeRange(evt);
      return { ...evt, _s, _e };
    });
  }, [events]);

  const filtered = useMemo(() => {
    const base = normalized
      .filter(evt => {
        if (filter === 'favorites') return isFavorite(evt.id) && evt._e && evt._e >= now;
        if (filter === 'week') return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: wkStart, end: wkEnd});
        if (filter === 'month') return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: moStart, end: moEnd});
        if (filter === 'byMonth') return evt._s && (evt._s.getMonth() + 1 === selectedMonth);
        return true; // 'all'
      })
      .filter(evt => !selectedTag || (evt.tags && evt.tags.includes(selectedTag)))
      .filter(evt => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const nameMatch = evt.name?.toLowerCase().includes(q);
        const descriptionMatch = evt.description?.toLowerCase().includes(q);
        const tagsMatch = evt.tags?.some(tag => tag.includes(q));
        const locationMatch = evt.location?.toLowerCase().includes(q);
        return nameMatch || descriptionMatch || tagsMatch || locationMatch;
      });

    return base;
  }, [normalized, filter, wkStart, wkEnd, moStart, moEnd, selectedMonth, selectedTag, searchQuery, isFavorite]);

  const upcoming = filtered.filter(evt => evt._e && evt._e >= now);
  const past = filtered.filter(evt => evt._e && evt._e < now);

  const renderDate = ({_s, _e}) =>
    (+_s !== +_e)
      ? `${format(_s, 'yyyy.MM.dd')}–${format(_e, 'yyyy.MM.dd')}`
      : format(_s, 'yyyy.MM.dd');

  // ICS helper
  function toICS(evt) {
    if (!evt._s || !evt._e) return '';
    const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${evt.name}`,
      `DTSTART:${dt(evt._s)}`,
      `DTEND:${dt(evt._e)}`,
      `LOCATION:${evt.location || ''}`,
      `DESCRIPTION:${(evt.description || '').replace(/\r?\n/g, ' ')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
  }

  if (loading) return <p className="p-4 text-center">Események betöltése...</p>;
  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  return (
    <div className="container mx-auto p-4 relative">
      {/* === KERESŐ === */}
      <div className="mb-6 px-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Keress eseményre, pl. koncert..."
          className="w-full p-3 bg-white/30 backdrop-blur-sm rounded-full text-indigo-900 placeholder-indigo-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* === FŐ SZŰRŐK === */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {[
          ['week','E heti'],
          ['month','Havi'],
          ['byMonth','Hónap'],
          ['all','Összes']
        ].map(([opt, label]) => (
          <button
            key={opt}
            onClick={() => {
              setFilter(opt);
              if (opt === 'byMonth') setOpenPicker(true);
            }}
            className={
              'px-4 py-2 rounded-full transition-all duration-200 ' +
              (filter === opt
                ? 'bg-indigo-600 text-white font-semibold shadow ring-2 ring-indigo-500'
                : 'bg-purple-100 text-indigo-500 hover:bg-indigo-600 hover:text-white')
            }
          >
            {label}
          </button>
        ))}

        {/* Kedvenceim */}
        {favorites.length > 0 && (
          <button
            onClick={() => setFilter('favorites')}
            className={
              'px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ' +
              (filter === 'favorites'
                ? 'bg-rose-600 text-white font-semibold shadow ring-2 ring-rose-500'
                : 'bg-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white')
            }
          >
            <FaHeart /> Kedvenceim
          </button>
        )}
      </div>

      {/* === TAG CHIPSEK === */}
      {tags.length > 0 && (
        <div className="flex items-center justify-start md:justify-center gap-2 mb-8 overflow-x-auto pb-2 flex-nowrap md:flex-wrap scrollbar-hide">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(prev => (prev === tag ? null : tag))}
              className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 capitalize ${
                selectedTag === tag
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-white/50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTag && (
             <button
              onClick={() => setSelectedTag(null)}
              className="flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400"
             >
               ✕ Törlés
             </button>
          )}
        </div>
      )}

      {/* === HÓNAP PICKER === */}
      {openPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpenPicker(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-11/12 max-w-sm animate-scale-in shadow-xl">
            <h3 className="text-lg font-semibold text-center mb-4">Válassz hónapot</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {MONTH_SHORT.map((short, idx) => (
                <button
                  key={short}
                  onClick={() => {
                    setSelectedMonth(idx + 1);
                    setFilter('byMonth');
                    setOpenPicker(false);
                  }}
                  className={
                    'px-4 py-2 rounded-full transition-all ' +
                    (selectedMonth === idx + 1
                      ? 'bg-indigo-600 text-white font-semibold shadow ring-2 ring-indigo-500'
                      : 'bg-purple-100 text-indigo-500 hover:bg-indigo-600 hover:text-white')
                  }
                >
                  {short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {filter === 'byMonth' && (
        <h2 className="text-center font-medium mb-4">
          Kiválasztott hónap: {MONTH_NAMES[selectedMonth - 1]}
        </h2>
      )}

      {/* === KÖZELGŐ === */}
      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {upcoming.map(evt => {
            const isMultiDay = evt.end_date && evt.end_date !== evt.date;
            return (
              <div key={evt.id} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden flex flex-col">
                <div className="relative">
                  {evt.image && (
                    <EventImageCard 
                      src={`/images/events/${evt.image}`} 
                      alt={evt.name}
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {isMultiDay && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                        többnapos
                      </span>
                    )}
                    {evt.link && (
                      <a
                        href={evt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        hivatalos
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  {/* Cím + szív */}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-lg font-semibold truncate text-indigo-500 dark:text-indigo-700 pr-2 flex-grow">
                      {evt.name}
                    </h4>
                    {(() => {
  const isPast = evt._e && evt._e < now;
  return (
    <button
      onClick={() => {
        if (isPast) return; // ha lejárt, nem csinál semmit
        isFavorite(evt.id) ? removeFavorite(evt.id) : addFavorite(evt.id);
      }}
      className={
        'text-rose-500 flex-shrink-0 p-1 transition-transform active:scale-90 ' +
        (isPast ? 'opacity-40 cursor-not-allowed' : '')
      }
      aria-label={
        isPast
          ? 'Lezajlott esemény nem jelölhető kedvencnek'
          : isFavorite(evt.id)
          ? 'Eltávolítás a kedvencekből'
          : 'Hozzáadás a kedvencekhez'
      }
      title={isPast ? 'Lezajlott esemény nem jelölhető kedvencnek' : ''}
    >
      {isFavorite(evt.id) ? (
        <FaHeart size={22} className="animate-heart-pop" />
      ) : (
        <FaRegHeart size={22} />
      )}
    </button>
  );
})()}

                  </div>

                  <p className="text-sm text-rose-50 dark:text-amber-100 mb-3">
                    {renderDate(evt)} {evt.time ? `• ${evt.time}` : ''}
                  </p>

                  {evt.location && (
                    <p className="text-sm text-cyan-600 mb-4">
                      📍 {evt.location}
                      {evt.coords && (
                        <a
                          className="ml-2 text-gray-900 underline"
                          href={`https://www.google.com/maps?q=${evt.coords.lat},${evt.coords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Vigyél oda
                        </a>
                      )}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      to={`/events/${evt.id}`}
                      className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600"
                    >
                      Részlet
                    </Link>

                    {/* ICS export */}
                    <a
                      href={`data:text/calendar;charset=utf8,${encodeURIComponent(toICS(evt))}`}
                      download={`${evt.name.replace(/\s+/g, '_')}.ics`}
                      className="inline-flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg shadow hover:bg-purple-600 transition"
                      title="Add naptárhoz"
                    >
                      📅
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400 my-8">A kiválasztott szűrőkkel nincs közelgő esemény.</p>
      )}

      {/* === LEZAJLOTT === */}
      {past.length > 0 && filter !== 'favorites' && (
        <>
          <h3 className="text-xl font-semibold mb-4 border-t border-gray-300/50 pt-4">Lezajlott események</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(evt => (
              <div key={evt.id} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden opacity-60 grayscale">
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-1 truncate text-indigo-500 dark:text-indigo-700">{evt.name}</h4>
                  <p className="text-sm text-rose-50 dark:text-amber-100 mb-2">{renderDate(evt)} {evt.time ? `• ${evt.time}` : ''}</p>
                  <Link to={`/events/${evt.id}`} className="inline-block text-gray-500 underline">Részlet</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
