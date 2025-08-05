import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventById } from '../api';
import { format, parseISO, isValid } from 'date-fns';
import EventImageCard from '../components/EventImageCard'; 

export default function EventDetail() {
  const { id } = useParams();
  const [evt, setEvt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEventById(id)
      .then(data => {
        if (!data) {
          throw new Error('A keresett esemény nem található.');
        }
        setEvt(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-4 text-center">Esemény betöltése...</p>;
  if (error) return <p className="p-4 text-center text-red-500">Hiba: {error}</p>;
  if (!evt) return (
    <div className="text-center p-4">
      <p className="mb-4">Az esemény nem található, vagy már nem aktuális.</p>
      <Link to="/events" className="text-purple-600 underline">Vissza az eseményekhez</Link>
    </div>
  );

  let s, e;
  if (evt.startDate && isValid(parseISO(evt.startDate))) {
    s = parseISO(evt.startDate);
    e = parseISO(evt.endDate || evt.startDate);
  } else if (evt.date && evt.date.includes('/')) {
    const parts = evt.date.split('/');
    s = parseISO(parts[0]);
    e = parseISO(parts[1]);
  } else if (evt.date && isValid(parseISO(evt.date))) {
    s = e = parseISO(evt.date);
  } else {
    s = e = null;
  }

  let dateText = "Dátum ismeretlen";
  if (s && e && isValid(s) && isValid(e)) {
    if (+s !== +e) {
      dateText = `${format(s, 'yyyy.MM.dd')} – ${format(e, 'yyyy.MM.dd')}`;
    } else {
      dateText = format(s, 'yyyy.MM.dd');
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
      <div className="mb-6">
        <Link to="/events" className="inline-block text-purple-600 dark:text-purple-400 hover:underline font-semibold">
          ← Vissza az eseményekhez
        </Link>
      </div>

      {/* A Dinamikus Képarányú Kép */}
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
        <p><strong>Dátum:</strong> {dateText}</p>
        {evt.time && <p><strong>Idő:</strong> {evt.time}</p>}
        {evt.location && <p><strong>Helyszín:</strong> {evt.location}</p>}
      </div>

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold text-purple-800 dark:text-purple-300 border-b pb-1">Leírás</h2>
        <p className="text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pt-2">{evt.description}</p>
      </section>

      {evt.tags?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-purple-800 dark:text-purple-300">Címkék</h3>
          <ul className="flex flex-wrap gap-2">
            {evt.tags.map(tag => (
              <li key={tag} className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm capitalize">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

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
