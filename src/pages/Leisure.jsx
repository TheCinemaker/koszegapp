import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeisure } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import { FaHeart, FaRegHeart } from 'react-icons/fa';   // <<< ÚJ

export default function Leisure() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // <<< ÚJ: Robusztusabb betöltéskezelés

  // <<< ÚJ: Kedvencek hook behívása >>>
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchLeisure()
      .then(data => setList(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false)); // <<< ÚJ
  }, []);

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (loading) return <p className="p-4 text-center">Betöltés...</p>; // <<< ÚJ

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {list.map(item => (
        <div key={item.id} className="bg-white/20 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden flex flex-col">
          {item.image && (
            <img
              src={`/images/leisure/${item.image}`}
              alt={item.name}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-4 flex flex-col flex-grow">
            {/* <<< ÚJ: Cím és szív ikon egy sorban >>> */}
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300 pr-2 flex-grow">{item.name}</h3>
              <button 
                onClick={() => isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id)} 
                className="text-rose-500 flex-shrink-0 p-1 transition-transform active:scale-90"
                aria-label={isFavorite(item.id) ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
              >
                {isFavorite(item.id) 
                  ? <FaHeart size={22} className="animate-heart-pop" /> 
                  : <FaRegHeart size={22} />
                }
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3 flex-grow">{item.shortDescription}</p>
            <Link
              to={`/leisure/${item.id}`}
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition mt-auto self-start"
            >
              Részletek
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
