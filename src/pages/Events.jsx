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

  useEffect(() => {
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
      })
      .catch(err => setError(err.message));
  }, []);

  const now = new Date();
  const wkStart = startOfWeek(now,{weekStartsOn:1});
  const wkEnd = endOfWeek(now,{weekStartsOn:1});
  const moStart = startOfMonth(now);
  const moEnd = endOfMonth(now);

  // normalizálás
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

  // dátum szerint rendezés mindig
  const sortedNormalized = normalized.slice().sort((a, b) => a._s - b._s);

  const filtered = sortedNormalized.filter(evt => {
    if (filter === 'week')
      return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: wkStart, end: wkEnd});
    if (filter === 'month')
      return areIntervalsOverlapping({start: evt._s, end: evt._e}, {start: moStart, end: moEnd});
    if (filter === 'byMonth')
      return evt._s.getMonth() + 1 === selectedMonth;
    return true;
  });

  const upcoming = filtered.filter(evt => evt._e >= now);
  const past = filtered.filter(evt => evt._e < now);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  const renderDate = ({_s, _e}) =>
    +_s !== +_e
      ? `${format(_s, 'yyyy.MM.dd')}–${format(_e, 'yyyy.MM.dd')}`
      : format(_s, 'yyyy.MM.dd');

  return (
    <div className="container mx-auto p-4 relative">
      <div className="flex flex-wrap justify-center gap-3 mb-6">
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
      </div>

      {filter === 'byMonth' && (
        <h2 className="text-center font-medium mb-4">
          Kiválasztott hónap: {MONTH_NAMES[selectedMonth - 1]}
        </h2>
      )}

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

      {filter === 'week' && upcoming.length === 0 && (
        <p className="text-center text-gray-600 mb-6">Nincs esemény ezen a héten.</p>
      )}
      {upcoming.length > 0 && (
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
          <div className="flex gap-2">
            <Link
              to={`/events/${evt.id}`}
              className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600"
            >
              Részlet
            </Link>
            <a
              href={`data:text/calendar;charset=utf8,${encodeURIComponent(
                `BEGIN:VCALENDAR
                  VERSION:2.0
                  BEGIN:VEVENT
                  SUMMARY:${evt.name}
                  DTSTART:${evt._s.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
                  DTEND:${evt._e.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
                  LOCATION:${evt.location || ''}
                  DESCRIPTION:${evt.description || ''}
                  END:VEVENT
                  END:VCALENDAR` 
                )}`}
      download={`${evt.name.replace(/\s+/g, '_')}.ics`}
        className="inline-flex items-center gap-2 bg-indigo-500 text-white px-5 py-2 rounded-full shadow hover:bg-indigo-600 transition"
>
  📅 <span>Naptárhoz adom</span>
</a>

          </div>
        </div>
      </div>
    ))}
  </div>
)}


      {past.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mb-4">Lezajlott események</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(evt => (
              <div key={evt.id} className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden grayscale">
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
