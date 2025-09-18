import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById } from '../api';
import { format, parseISO, isValid, addHours } from 'date-fns';
import EventImageCard from '../components/EventImageCard'; 

function parseDateRange(evt) {
  // 1) preferált séma: date + end_date (ISO yyyy-MM-dd)
  if (evt?.date) {
    const s = parseISO(evt.date);
    const e = parseISO(evt.end_date || evt.date);

    // időablak finomítása, ha van time mező
    if (evt.time && typeof evt.time === 'string') {
      const t = evt.time.replace(/\s/g, '');
      // "HH:mm-HH:mm"
      if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) {
        const [ts, te] = t.split('-');
        const [hs, ms] = ts.split(':').map(Number);
        const [he, me] = te.split(':').map(Number);
        const s2 = new Date(s);
        s2.setHours(hs, ms ?? 0, 0, 0);
        const e2 = new Date(e);
        e2.setHours(he, me ?? 0, 0, 0);
        return { s: s2, e: e2 };
      }
      // "HH:mm"
      if (/^\d{2}:\d{2}$/.test(t)) {
        const [h, m] = t.split(':').map(Number);
        const s2 = new Date(s);
        s2.setHours(h, m ?? 0, 0, 0);
        // ha csak kezdőidő van, tegyünk +2 óra véget ésszerű alapértelmezésként
        const e2 = addHours(s2, 2);
        return { s: s2, e: e2 };
      }
    }
    // nincs értelmezhető time → egész nap
    const sDay = new Date(s);
    sDay.setHours(0,0,0,0);
    const eDay = new Date(e);
    eDay.setHours(23,59,59,999);
    return { s: sDay, e: eDay };
  }

  // 2) régi fallback: "date" tartalmazhat "start/end" formátumot
  if (evt?.date && evt.date.includes('/')) {
    const [a, b] = evt.date.split('/');
    const s = parseISO(a);
    const e = parseISO(b);
    return { s, e };
  }

  // 3) teljesen ismeretlen
  return { s: null, e: null };
}

export default function EventDetail() {
  const { id } = useParams();
  const [evt, setEvt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEventById(id)
      .then(data => {
        if (!data) throw new Error('A keresett esemény nem található.');
        setEvt(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const { s, e } = useMemo(() => parseDateRange(evt || {}), [evt]);
  const isMultiDay = !!(evt?.end_date && evt.end_date !== evt.date);

  const dateText = useMemo(() => {
    if (!s || !e || !isValid(s) || !isValid(e)) return 'Dátum ismeretlen';
    const sf = format(s, 'yyyy.MM.dd');
    const ef = format(e, 'yyyy.MM.dd');
    return +s !== +e ? `${sf} – ${ef}` : sf;
  }, [s, e]);

  if (loading) return <p className="p-4 text-center">Esemény betöltése...</p>;
  if (error) return <p className="p-4 text-center text-red-500">Hiba: {error}</p>;
  if (!evt) {
    return (
      <div className="text-center p-4">
        <p className="mb-4">Az esemény nem található, vagy már nem aktuális.</p>
        <Link to="/events" className="text-purple-600 underline">Vissza az eseményekhez</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/events" className="inline-block text-purple-600 dark:text-purple-400 hover:underline font-semibold">
          ← Vissza az eseményekhez
        </Link>

        <div className="flex items-center gap-2">
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
              hivatalos oldal
            </a>
          )}
        </div>
      </div>

      {evt.image && (
        <div className="mb-6 shadow-lg rounded-xl overflow-hidden">
          <EventImageCard 
            src={`/images/events/${evt.image}`}
            alt={evt.name}
          />
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2 text-purple-800 dark:text-purple-300">{evt.name}</h1>

      <div className="text-gray-700 dark:text-gray-400 mb-6 space-y-1">
        <p><strong>Dátum:</strong> {dateText}{evt.time ? ` • ${evt.time}` : ''}</p>
        {evt.location && <p><strong>Helyszín:</strong> {evt.location}</p>}
      </div>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-purple-800 dark:text-purple-300 border-b pb-1">Leírás</h2>
        <p className="text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pt-2">{evt.description}</p>
      </section>

      {evt.coords && (
        <section className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-purple-800 dark:text-purple-300">Helyszín a Térképen</h2>
          <div className="w-full h-72 rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Esemény helyszíne"
              src={`https://www.google.com/maps?q=${evt.coords.lat},${evt.coords.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}
    </div>
  );
}
