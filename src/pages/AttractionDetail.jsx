import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAttractions } from '../api';

export default function AttractionDetail() {
  const { id } = useParams();
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttractions()
      .then(data => {
        const found = data.find(item => item.id === parseInt(id, 10));
        if (!found) setError('Nem található ilyen látnivaló.');
        else setAttr(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!attr)  return <p className="p-4">Betöltés...</p>;

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
      {/* Back button */}
      <div className="mb-4">
        <Link to="/attractions" className="inline-block text-indigo-500 hover:underline">
          ← Vissza a látnivalókhoz
        </Link>
      </div>

      {/* Hero image */}
      <img
        src={attr.image}
        alt={attr.name}
        className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg"
      />

      {/* Title */}
      <h1 className="text-3xl font-bold mb-2 text-indigo-500 dark:text-indigo-700">{attr.name}</h1>

      {/* Short description */}
      {/*<p className="text-rose-50 dark:text-amber-100 mb-4 italic">{attr.description}</p>*/}

      {/* Details */}
      <section className="mb-6">
        {/*<h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Részletes leírás</h2>*/}
        <p className="text-rose-50 dark:text-amber-100 leading-relaxed">{attr.details}</p>
      </section>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Nyitvatartás</h3>
          <p className="text-rose-50 dark:text-amber-100">{attr.hours}</p>
        </div>

        {attr.price && (
          <div>
            <h3 className="font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Belépő árak</h3>
            <ul className="list-disc list-inside text-rose-50 dark:text-amber-100">
              <li>Felnőtt: {attr.price.adult}</li>
              <li>Diák/Nyugdíjas: {attr.price.studentSenior}</li>
              <li>6 év alatt: {attr.price.childUnder6}</li>
            </ul>
          </div>
        )}

        {attr.phone && (
          <div>
            <h3 className="font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Telefon</h3>
            <a href={`tel:${attr.phone}`} className="underline text-rose-50 dark:text-amber-100">{attr.phone}</a>
          </div>
        )}
        {attr.website && (
          <div>
            <h3 className="font-semibold mb-1 text-indigo-500 dark:text-indigo-700">Weboldal</h3>
            <a href={attr.website} target="_blank" rel="noopener noreferrer" className="underline text-rose-50 dark:text-amber-100">
              {attr.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Map */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Térkép</h2>
        <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
          <iframe
            title="Térkép"
            src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=20&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* Coordinates */}
      <p className="text-sm text-rose-50 mt-4">
        Koordináták: {attr.coordinates.lat}, {attr.coordinates.lng}
      </p>
    </div>
  );
}
