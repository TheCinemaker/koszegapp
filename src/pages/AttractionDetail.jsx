import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// ÚJ IMPORT: Az új, specifikus függvényt importáljuk be
import { fetchAttractionById } from '../api';

export default function AttractionDetail() {
  const { id } = useParams();
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);
  // ÚJ STATE: A betöltési állapot explicit kezelésére
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A teljes useEffect logikát lecseréljük
    setLoading(true); // Indul a betöltés

    fetchAttractionById(id)
      .then(data => {
        setAttr(data);
        setError(null); // Sikeres betöltés esetén a korábbi hiba törlése
      })
      .catch(err => {
        setError(err.message);
        setAttr(null); // Hiba esetén az adatokat is töröljük
      })
      .finally(() => {
        setLoading(false); // A betöltés befejeződött (akár sikeres, akár nem)
      });

  }, [id]); // Az effektus csak akkor fut le újra, ha az 'id' megváltozik

  // ÁTTEKINTHETŐBB KEZELÉSE A KÜLÖNBÖZŐ ÁLLAPOTOKNAK
  if (loading) {
    return <p className="p-4 text-center">Betöltés...</p>;
  }

  if (error) {
    return <p className="p-4 text-center text-red-500">Hiba: {error}</p>;
  }
  
  // Ha valamiért nincs adat, de hiba és betöltés sincs
  if (!attr) {
    return (
        <div className="text-center p-4">
            <p className="text-red-500 mb-4">A látnivaló nem tölthető be.</p>
            <Link to="/attractions" className="inline-block text-indigo-500 hover:underline">
                ← Vissza a látnivalókhoz
            </Link>
        </div>
    );
  }

  // A JSX rész innentől változatlan, minden a helyén van
  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl">
      <div className="mb-4">
        <Link to="/attractions" className="inline-block text-indigo-500 hover:underline">
          ← Vissza a látnivalókhoz
        </Link>
      </div>

      <img
        src={attr.image}
        alt={attr.name}
        className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg"
      />

      <h1 className="text-3xl font-bold mb-2 text-indigo-500 dark:text-indigo-700">{attr.name}</h1>

      <p className="text-rose-50 dark:text-amber-100 leading-relaxed mb-6">{attr.details}</p>

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

      <section>
        <h2 className="text-2xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">Térkép</h2>
        <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
          <iframe
            title="Térkép"
            src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=15&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}
