import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEvents } from '../api';
import { format, parseISO } from 'date-fns';
import { fetchEventById } from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const [evt, setEvt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
  fetchEventById(id)
    .then(data => {
      setEvt(data);
    })
    .catch(err => {
      setError(err.message);
    });
}, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!evt)   return <p className="p-4">Betöltés...</p>;

  // dátum formázása (range vagy single)
  let dateText;
  if (evt.date.includes('/')) {
    const [s, e] = evt.date.split('/');
    dateText = `${format(parseISO(s), 'yyyy.MM.dd')} – ${format(parseISO(e), 'yyyy.MM.dd')}`;
  } else {
    dateText = format(parseISO(evt.date), 'yyyy.MM.dd');
  }

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
      {/* Vissza gomb */}
      <div className="mb-4">
        <Link to="/events" className="inline-block text-indigo-600 hover:underline">
          ← Vissza az eseményekhez
        </Link>
      </div>

      {/* Hero kép */}
      {evt.image && (
        <img
          src={`/images/events/${evt.image}`}
          alt={evt.name}
          className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg"
        />
      )}

      {/* Cím */}
      <h1 className="text-3xl font-bold mb-2 text-indigo-500 dark:text-indigo-700">{evt.name}</h1>

      {/* Dátum és idő */}
      <p className="text-rose-50 dark:text-amber-100 mb-1">
        <strong>Dátum:</strong> {dateText}
        {evt.time && <> &nbsp; <strong>Idő:</strong> {evt.time}</>}
      </p>

      {/* Helyszín */}
      {evt.location && (
        <p className="text-rose-50 dark:text-amber-100 mb-4">
          <strong>Helyszín:</strong> {evt.location}
        </p>
      )}

      {/* Leírás */}
      <section className="mb-4">
        <h2 className="text-2xl font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Leírás</h2>
        <p className="text-rose-50 dark:text-amber-100 leading-relaxed">{evt.description}</p>
      </section>

      {/* Címkék */}
      {evt.tags?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Címkék</h2>
          <ul className="flex flex-wrap gap-2">
            {evt.tags.map(tag => (
              <li key={tag} className="bg-purple-100 text-indigo-500 px-2 py-1 rounded-full text-sm">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Térkép (ha van.coords) */}
      {evt.coords && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Térkép</h2>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Esemény helyszíne"
              src={`https://www.google.com/maps?q=${evt.coords.lat},${evt.coords.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="text-sm text-rose-50 dark:text-amber-100 mt-2">
            Koordináták: {evt.coords.lat}, {evt.coords.lng}
          </p>
        </section>
      )}
    </div>
  );
}
