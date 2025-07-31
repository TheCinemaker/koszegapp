import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchParking } from '../api';

export default function ParkingDetail() {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchParking()
      .then(data => {
        const found = data.find(p => String(p.id) === id);
        if (!found) setError('Nem található ilyen parkoló.');
        else setPark(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!park) return <p className="p-4">Betöltés…</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
      <Link to="/parking" className="inline-block mb-4 text-indigo-600 hover:underline">
        ← Vissza a parkolókhoz
      </Link>
      <Link
        to="/parking-map"
        className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
      Térképes nézet 🗺
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {park.image && (
          <img
            src={`/images/parking/${park.image}`}
            alt={park.name}
            className="w-full md:w-1/2 h-auto object-cover rounded-xl"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{park.name}</h1>
          <p className="mb-2"><strong>Cím:</strong> {park.address}</p>
          <p className="mb-2"><strong>Ár:</strong> {park.price}</p>
          <p className="mb-2"><strong>Nyitvatartás:</strong> {park.hours}</p>
          <p className="mb-2"><strong>Fizetési módok:</strong> {park.payment.join(', ')}</p>
          <p className="mb-2"><strong>Kapacitás:</strong> {park.capacity || 'nem ismert'}</p>
          {park.coords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${park.coords.lat},${park.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Megnyitás Google Maps-ben
            </a>
          )}
        </div>
      </div>

      {park.zones && park.zones.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Érintett utcák és területek:</h3>
          <ul className="list-disc list-inside space-y-1">
            {park.zones.map((zone, idx) => (
              <li key={idx}>{zone}</li>
            ))}
          </ul>
        </div>
      )}

      {park.coords && (
        <div className="mt-6">
          <iframe
            title={park.name}
            src={`https://www.google.com/maps?q=${park.coords.lat},${park.coords.lng}&z=16&output=embed`}
            className="w-full h-72 rounded-lg"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
