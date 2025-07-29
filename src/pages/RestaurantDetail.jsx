import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchRestaurants } from '../api';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaFacebook, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [rest, setRest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRestaurants()
      .then(data => {
        const found = data.find(r => String(r.id) === id);
        if (!found) {
          setError('Nem található ilyen vendéglátóhely.');
        } else {
          setRest(found);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <p className="text-red-500 text-center p-4">Hiba: {error}</p>;
  
  // <<< JAVÍTÁS: A SKELETON HELYETT EZT HASZNÁLJUK >>>
  if (loading) return <p className="text-center p-10">Részletek betöltése...</p>;

  if (!rest) return null;

  return (
    <div className="max-w-3xl mx-auto my-6 p-4 md:p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
      <div className="mb-4">
        <Link to="/gastronomy" className="inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Vissza a listához
        </Link>
      </div>

      {rest.image && (
        <img
          src={`/images/gastro/${rest.image}`}
          alt={rest.name}
          className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
        />
      )}

      <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-indigo-800 dark:text-indigo-300">{rest.name}</h1>

      {rest.description && (
        <p className="text-gray-800 dark:text-gray-200 mb-6">{rest.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-8 text-gray-800 dark:text-gray-200">
        {rest.address && (
          <div className="flex items-start"><FaMapMarkerAlt className="mt-1 mr-3 text-indigo-500 flex-shrink-0" /><span>{rest.address}</span></div>
        )}
        {rest.phone && (
          <div className="flex items-center"><FaPhone className="mr-3 text-indigo-500 flex-shrink-0" /><a href={`tel:${rest.phone}`} className="hover:underline">{rest.phone}</a></div>
        )}
        {rest.email && (
          <div className="flex items-center"><FaEnvelope className="mr-3 text-indigo-500 flex-shrink-0" /><a href={`mailto:${rest.email}`} className="hover:underline">{rest.email}</a></div>
        )}
        {rest.website && (
          <div className="flex items-center"><FaGlobe className="mr-3 text-indigo-500 flex-shrink-0" /><a href={rest.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{rest.website.replace(/^https?:\/\//, '')}</a></div>
        )}
        {rest.facebook && (
          <div className="flex items-center"><FaFacebook className="mr-3 text-indigo-500 flex-shrink-0" /><a href={rest.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{rest.facebook.replace(/^https?:\/\//, '')}</a></div>
        )}
        {typeof rest.delivery === "boolean" && (
          <div className="flex items-center">
            {rest.delivery 
              ? <FaCheckCircle className="mr-3 text-green-500 flex-shrink-0" /> 
              : <FaTimesCircle className="mr-3 text-red-500 flex-shrink-0" />
            }
            <span>Házhozszállítás</span>
          </div>
        )}
      </div>

      {rest.coords && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3 text-indigo-800 dark:text-indigo-300">Térkép</h2>
          <div className="w-full h-80 rounded-lg overflow-hidden shadow-md border-2 border-white/20">
            <iframe
              title="Helyszín térképe"
              src={`https://www.google.com/maps?q=${rest.coords.lat},${rest.coords.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {rest.amenities?.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-indigo-800 dark:text-indigo-300">Szolgáltatások</h2>
          <div className="flex flex-wrap gap-2">
            {rest.amenities.map(a => 
              <span key={a} className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">{a}</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
