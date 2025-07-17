import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchRestaurants } from '../api';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [rest, setRest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRestaurants()
      .then(data => {
        const found = data.find(r => String(r.id) === id);
        if (!found) setError('Nem található ilyen vendéglátóhely.');
        else setRest(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!rest)  return <p className="p-4">Betöltés…</p>;

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
      <div className="mb-4">
        <Link to="/gastronomy" className="inline-block text-indigo-600 hover:underline">
          ← Vissza
        </Link>
      </div>

      {rest.image && (
        <img
          src={`/images/gastro/${rest.image}`}
          alt={rest.name}
          className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
        />
      )}

      <h1 className="text-3xl font-bold mb-2 text-indigo-500 dark:text-indigo-700">{rest.name}</h1>

      {rest.description && (
        <p className="text-gray-800 mb-4 text-rose-50 dark:text-amber-100">{rest.description}</p>
      )}

      {/* Térkép */}
      {rest.coords && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Helyszín térképen</h2>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Helyszín térképe"
              src={`https://www.google.com/maps?q=${rest.coords.lat},${rest.coords.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="text-sm text-rose-50 dark:text-amber-100 mt-2">
            Koordináták: {rest.coords.lat}, {rest.coords.lng}
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {rest.address && (
          <div>
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Cím</h3>
            <p className="text-rose-50 dark:text-amber-100">{rest.address}</p>
          </div>
        )}
        {rest.phone && (
          <div>
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Telefon</h3>
            <a href={`tel:${rest.phone}`} className="underline text-rose-50 dark:text-amber-100">{rest.phone}</a>
          </div>
        )}
        {rest.email && (
          <div>
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Email</h3>
            <a href={`mailto:${rest.email}`} className="underline text-rose-50 dark:text-amber-100">{rest.email}</a>
          </div>
        )}
        {rest.website && (
          <div className="md:col-span-2">
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Web</h3>
            <a href={rest.website} target="_blank" rel="noopener noreferrer" className="underline text-rose-50 dark:text-amber-100">
              {rest.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {rest.facebook && (
          <div className="md:col-span-2">
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Facebook</h3>
            <a href={rest.facebook} target="_blank" rel="noopener noreferrer" className="underline text-rose-50 dark:text-amber-100">
              {rest.facebook.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {/* Nincs delivery objektum, csak true/false */}
        {typeof rest.delivery === "boolean" && (
          <div>
            <h3 className="font-semibold text-indigo-500 dark:text-indigo-700">Házhozszállítás</h3>
            <p className="text-rose-50 dark:text-amber-100">{rest.delivery ? "Van" : "Nincs"}</p>
          </div>
        )}
      </div>

      {rest.amenities?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Kényelmi szolgáltatások</h2>
          <ul className="list-disc list-inside text-rose-50 dark:text-amber-100">
            {rest.amenities.map(a => <li key={a}>{a}</li>)}
          </ul>
        </section>
      )}

      {rest.rating && (
        <p className="text-sm text-rose-50 dark:text-amber-100">
          ⭐ {rest.rating} ({rest.reviews_count} értékelés)
        </p>
      )}

      {rest.details && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Részletek</h2>
          <p className="text-rose-50 dark:text-amber-100">{rest.details}</p>
        </section>
      )}
    </div>
  );
}
