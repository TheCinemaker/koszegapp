import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLeisure } from '../api';

export default function LeisureDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeisure()
      .then(data => {
        const found = data.find(i => String(i.id) === id);
        if (!found) setError('Nem található ilyen szabadidős program.');
        else setItem(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!item) return <p className="p-4">Betöltés…</p>;

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 dark:bg-gray-800 backdrop-blur-md rounded-2xl shadow-xl">
      <div className="mb-4">
        <Link to="/leisure" className="inline-block text-indigo-600 hover:underline">
          ← Vissza a Szabadidőhöz
        </Link>
      </div>

      {item.image && (
        <img
          src={`/images/leisure/${item.image}`}
          alt={item.name}
          className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg"
        />
      )}

      <h1 className="text-3xl font-bold mb-4 text-indigo-500 dark:text-indigo-700">{item.name}</h1>

      {item.shortDescription && (
        <p className="font-semibold text-rose-50 dark:text-amber-100 mb-2 italic">
          {item.shortDescription}
        </p>
      )}

      <p className="text-rose-50 dark:text-amber-100 mb-6">{item.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-800 dark:text-gray-300">
        <div>
          <h2 className="font-semibold text-indigo-500 dark:text-indigo-700">Típus</h2>
          <p className="text-rose-50 dark:text-amber-100">
            {item.type === 'hike' ? 'Túraútvonal' :
             item.type === 'park' ? 'Park / Tanösvény' :
             item.type === 'playground' ? 'Játszótér' :
             item.type === 'bike' ? 'Kerékpárút' : item.type}
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-indigo-500 dark:text-indigo-700">Hossz</h2>
          <p className="text-rose-50 dark:text-amber-100">{item.lengthKm !== null && item.lengthKm !== undefined ? `${item.lengthKm} km` : 'n.a.'}</p>
        </div>
      </div>

      {item.mapUrl && (
        <div className="mb-4">
          <a href={item.mapUrl} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            Útvonaltervezés Google Maps-en
          </a>
        </div>
      )}

      {item.moreInfoUrl && (
        <div className="mb-4">
          <a href={item.moreInfoUrl} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            Bővebb információ
          </a>
        </div>
      )}

      {item.gpxUrl && (
        <div className="mb-4">
          <a href={item.gpxUrl} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            GPX letöltése
          </a>
        </div>
      )}

      {item.coords && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Térkép</h2>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
            <iframe
              title={item.name}
              src={`https://www.google.com/maps?q=${item.coords.lat},${item.coords.lng}&z=14&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="text-sm text-rose-50 dark:text-amber-100 mt-2">
            Koordináták: {item.coords.lat}, {item.coords.lng}
          </p>
        </section>
      )}
    </div>
  );
}
