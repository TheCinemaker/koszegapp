import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHotels } from '../api';

export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHotels()
      .then(data => {
        const found = data.find(h => h.id === parseInt(id, 10));
        if (!found) setError('Nem található ilyen szállás.');
        else setHotel(found);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!hotel) return <p className="p-4">Betöltés...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
      <div className="mb-4">
        <Link to="/hotels" className="text-indigo-600 hover:underline">
          ← Vissza a szállásokhoz
        </Link>
      </div>
      {hotel.image && (
        <img
          src={`/images/hotels/${hotel.image}`}
          alt={hotel.name}
          className="w-full h-64 object-contain rounded-lg mb-6 shadow-md"
      />
      )}
      <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
      <p className="text-gray-700 mb-4">{hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1)}</p>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Leírás</h2>
        <p className="text-gray-800 leading-relaxed">{hotel.description}</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-1">Cím</h3>
          <p>{hotel.address}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Ár</h3>
          <p>{hotel.price_from} {hotel.currency} / éj</p>
        </div>
        {hotel.rating && (
          <div>
            <h3 className="font-semibold mb-1">Értékelés</h3>
            <p>{hotel.rating} ★ ({hotel.reviews_count} vélemény)</p>
          </div>
        )}
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Szolgáltatások</h2>
        <ul className="list-disc list-inside">
          {hotel.amenities.map((a,i) => <li key={i}>{a}</li>)}
        </ul>
      </section>
      {hotel.website && (
        <p className="mb-2"><strong>Web:</strong> <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="underline">{hotel.website.replace(/^https?:\/\//,'')}</a></p>
      )}
      {hotel.phone && (
        <p className="mb-2"><strong>Telefon:</strong> <a href={`tel:${hotel.phone}`} className="underline">{hotel.phone}</a></p>
      )}
      {hotel.email && (
        <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${hotel.email}`} className="underline">{hotel.email}</a></p>
      )}
      {/* Map */}
      {hotel.coords && (
        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">Elhelyezkedés</h2>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Hotel helye"
              src={`https://www.google.com/maps?q=${hotel.coords.lat},${hotel.coords.lng}&z=16&output=embed`}
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
