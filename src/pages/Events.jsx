import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../api';
import {
  format,
  parseISO,
  areIntervalsOverlapping,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns';

const MONTH_NAMES = [
  'Január','Február','Március','Április',
  'Május','Június','Július','Augusztus',
  'Szeptember','Október','November','December'
];
const MONTH_SHORT = [
  'Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Szep','Okt','Nov','Dec'
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('week'); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openPicker, setOpenPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Címke state-ek
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // --- ÚJ RÉSZ: Kereső state ---
  const [searchQuery, setSearchQuery] = useState('');

  // Adatok betöltése
  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then(data => {
        const sorted = data.slice().sort((a, b) => {
          const getStart = evt => {
            if (evt.startDate) return new Date(evt.startDate);
            if (evt.date.includes('/')) return new Date(evt.date.split('/')[0]);
            return new Date(evt.date);
          };
          return getStart(a) - getStart(b);
        });
        
        setEvents(sorted);

        const allTags = sorted.flatMap(event => event.tags || []);
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});
        const topTags = Object.keys(tagCounts)
                              .sort((a, b) => tagCounts[b] - tagCounts[a])
                              .slice(0, 10);
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

  const normalized = events.map(evt => {
    let s, e;
    if (evt.startDate) {
      s = parseISO(evt.startDate);
      e = parseISO(evt.endDate || evt.startDate);
    } else if (evt.date.includes('/')) {
      [s, e] = evt.date.split('/').map(d => parseISO(d));
    } else {
      s = e = parseISO(evt.date);
    }
    return { ...evt, _s: s, _e: e };
  });

  // --- ÚJ RÉSZ: Bővített szűrési logika ---
  const filtered = normalized
  .filter(evt => { // 1. Dátum szűrés
    if (filter === 'week') return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: wkStart, end: wkEnd});
    if (filter === 'month') return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: moStart, end: moEnd});
    if (filter === 'byMonth') return evt._s.getMonth() + 1 === selectedMonth;
    return true;
  })
  .filter(evt => { // 2. Címke szűrés
    return !selectedTag || (evt.tags && evt.tags.includes(selectedTag));
  })
  .filter(evt => { // 3. Szöveges kereső szűrés
    const query = searchQuery.toLowerCase().trim();
    if (query === '') return true; // Ha üres a kereső, minden átmegy

    const nameMatch = evt.name.toLowerCase().includes(query);
    const descriptionMatch = evt.description ? evt.description.toLowerCase().includes(query) : false;
    const tagsMatch = evt.tags ? evt.tags.some(tag => tag.toLowerCase().includes(query)) : false;
    
    return nameMatch || descriptionMatch || tagsMatch;
  });


  const upcoming = filtered.filter(evt => evt._e >= now);
  const past = filtered.filter(evt => evt._e < now);

  const renderDate = ({_s, _e}) =>
    +_s !== +_e
      ? `${format(_s, 'yyyy.MM.dd')}–${format(_e, 'yyyy.MM.dd')}`
      : format(_s, 'yyyy.MM.dd');

  if (loading) return <p className="p-4 text-center">Események betöltése...</p>;
  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

     return (
    <div className="container mx-auto p-4 relative">
      
      {/* === SZŰRŐK SZEKCIÓ === */}

      {/* --- ÚJ RÉSZ: KERESŐMEZŐ --- */}
      <div className="mb-6 px-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Keress eseményre, pl. koncert..."
          className="w-full p-3 bg-white/30 backdrop-blur-sm rounded-full text-indigo-900 placeholder-indigo-900/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* 1. DÁTUM SZŰRŐK */}
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
                setSelectedTag(null);
                if (opt === 'byMonth') {
                  setOpenPicker(true);
                }
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
      </div>

      {/* 2. CÍMKE SZŰRŐK */}
      {tags.length > 0 && (
        <div className="flex items-center justify-center md:justify-center gap-2 mb-8 overflow-x-auto pb-2 flex-nowrap md:flex-wrap scrollbar-hide">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(prevTag => prevTag === tag ? null : tag)}
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

      {/* ... a kód többi része változatlan ... */}
      
      {/* HÓNAPVÁLASZTÓ MODAL */}
      {openPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpenPicker(false)}
          />
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

      {/* === TARTALOM SZEKCIÓ === */}

      {filter === 'byMonth' && (
        <h2 className="text-center font-medium mb-4">
          Kiválasztott hónap: {MONTH_NAMES[selectedMonth - 1]}
        </h2>
      )}

      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {upcoming.map(evt => (
            <div key={evt.id} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              {evt.image && (
                <img
                  src={`/images/events/${evt.image}`}
                  alt={evt.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="text-lg font-semibold mb-1 truncate text-indigo-500 dark:text-indigo-700">
                  {evt.name}
                </h4>
                <p className="text-sm text-rose-50 dark:text-amber-100 mb-2">
                  {renderDate(evt)} {evt.time || ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/events/${evt.id}`}
                    className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600"
                  >
                    Részlet
                  </Link>
                  <a
                    href={`data:text/calendar;charset=utf8,${encodeURIComponent(
                      `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${evt.name}\nDTSTART:${evt._s.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDTEND:${evt._e.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nLOCATION:${evt.location || ''}\nDESCRIPTION:${evt.description || ''}\nEND:VEVENT\nEND:VCALENDAR` 
                    )}`}
                    download={`${evt.name.replace(/\s+/g, '_')}.ics`}
                    className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition"
                  >
                    📅
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400 my-8">A kiválasztott szűrőkkel nincs közelgő esemény.</p>
      )}

      {past.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mb-4 border-t border-gray-300/50 pt-4">Lezajlott események</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(evt => (
              <div key={evt.id} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden opacity-60 grayscale">
                {evt.image && <img src={`/images/events/${evt.image}`} alt={evt.name} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-1 truncate text-indigo-500 dark:text-indigo-700">{evt.name}</h4>
                  <p className="text-sm text-rose-50 dark:text-amber-100 mb-2">{renderDate(evt)} {evt.time || ''}</p>
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
