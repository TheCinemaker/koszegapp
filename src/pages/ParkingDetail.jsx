import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchParking } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils'; // <<< ÚJ IMPORT

export default function ParkingDetail() {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchParking()
      .then(data => {
        const found = data.find(p => String(p.id) === id); // Stringgé alakítás a biztonság kedvéért
        if (!found) setError('Nem található ilyen parkoló.');
        else setPark(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!park) return <p className="p-4 text-center">Betöltés…</p>;

  const isPaid = isParkingPaidNow(park.hours);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <Link to="/parking" className="inline-block text-purple-600 dark:text-purple-400 hover:underline">
          ← Vissza a parkolókhoz
        </Link>
        <Link to="/parking-map" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
          Térképes nézet 🗺
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {park.image && <img src={`/images/parking/${park.image}`} alt={park.name} className="w-full md:w-1/2 h-auto object-cover rounded-xl"/>}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300">{park.name}</h1>
            {isPaid !== null && (
              <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                {isPaid ? 'ÉPPEN FIZETŐS' : 'MOST INGYENES'}
              </span>
            )}
          </div>
          <p className="mb-2"><strong>Cím:</strong> {park.address}</p>
          <p className="mb-2"><strong>Ár:</strong> {park.price}</p>
          <p className="mb-2"><strong>Díjfizetési időszak:</strong> {park.hours}</p>
          <p className="mb-2"><strong>Fizetési módok:</strong> {park.payment.join(', ')}</p>
          <p className="mb-2"><strong>Kapacitás:</strong> {park.capacity || 'nem ismert'}</p>
          {park.coords && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${park.coords.lat},${park.coords.lng}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Megnyitás Google Maps-ben
            </a>
          )}
        </div>
      </div>
      {/* ... a többi rész (zones, térkép) változatlan ... */}
    </div>
  );
}
