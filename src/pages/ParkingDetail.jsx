import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchParking } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';

export default function ParkingDetail() {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Hozzáadva a jobb betöltéskezeléshez

  useEffect(() => {
    setLoading(true);
    fetchParking()
      .then(data => {
        // A String() biztosítja, hogy a preffixelt ID-kkal is működjön
        const found = data.find(p => String(p.id) === id); 
        if (!found) {
          setError('Nem található ilyen parkoló.');
        } else {
          setPark(found);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;
  if (loading) return <p className="p-4 text-center">Betöltés...</p>;
  if (!park) return null; // Ha valamiért nincs adat, ne jelenjen meg semmi

  // Kiszámoljuk a státuszt
  const isPaid = isParkingPaidNow(park.hours);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Link to="/parking" className="inline-block text-purple-600 dark:text-purple-400 hover:underline">
          ← Vissza a parkolókhoz
        </Link>
        <Link to="/parking-map" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          Térképes nézet 🗺
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {park.image && (
          <img
            src={`/images/parking/${park.image}`}
            alt={park.name}
            className="w-full md:w-1/2 h-auto object-cover rounded-xl shadow-md"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300">{park.name}</h1>
            {isPaid !== null && (
              <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                {isPaid ? 'ÉPPEN FIZETŐS' : 'MOST INGYENES'}
              </span>
            )}
          </div>
          <div className="space-y-2 text-gray-800 dark:text-gray-300">
            <p><strong>Cím:</strong> {park.address}</p>
            <p><strong>Ár:</strong> {park.price}</p>
            <p><strong>Díjfizetési időszak:</strong> {park.hours}</p>
            <p><strong>Fizetési módok:</strong> {park.payment.join(', ')}</p>
            <p><strong>Kapacitás:</strong> {park.capacity || 'nem ismert'}</p>
          </div>
          {park.coords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${park.coords.lat},${park.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Megnyitás Google Maps-ben
            </a>
          )}
        </div>
      </div>

      {/* --- ITT VAN A ZONES SZEKCIÓ --- */}
      {park.zones && park.zones.length > 0 && (
        <div className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-3 text-purple-800 dark:text-purple-300">Érintett utcák és területek:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 pl-4">
            {park.zones.map((zone, idx) => (
              <li key={idx}>{zone}</li>
            ))}
          </ul>
        </div>
      )}

      {park.coords && (
        <div className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-3 text-purple-800 dark:text-purple-300">Elhelyezkedés</h2>
          <div className="w-full h-80 rounded-lg overflow-hidden shadow-md">
            <iframe
              title={park.name}
              src={`https://www.google.com/maps?q=${park.coords.lat},${park.coords.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
