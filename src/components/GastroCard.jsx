import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext'; // <<< ÚJ
import { FaHeart, FaRegHeart } from 'react-icons/fa';         // <<< ÚJ

// Fontos: a prefixelt, string ID-t használjuk!
const featuredIds = ['gastro-10'];

export default function GastroCard({ restaurant }) {
  // <<< ÚJ: Kedvencek hook behívása >>>
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const isFeatured = featuredIds.includes(restaurant.id);

  return (
    <div
      className={`
        relative rounded-xl shadow-lg overflow-hidden flex flex-col
        transition-transform duration-300 hover:-translate-y-1
        ${isFeatured
          ? 'ring-4 ring-yellow-500 bg-white/50 dark:bg-gray-800'
          : 'bg-white/20 dark:bg-gray-800 backdrop-blur-sm'
        }
      `}
    >
      <div className="relative">
        {isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
            Kiemelt
          </div>
        )}
        {restaurant.image && (
          <img
            src={`/images/gastro/${restaurant.image}`}
            alt={restaurant.name}
            className="w-full h-40 object-cover"
          />
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* <<< ÚJ: Cím és szív ikon egy sorban >>> */}
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300 pr-2 flex-grow">{restaurant.name}</h3>
          <button 
            onClick={() => isFavorite(restaurant.id) ? removeFavorite(restaurant.id) : addFavorite(restaurant.id)} 
            className="text-rose-500 flex-shrink-0 p-1 transition-transform active:scale-90"
            aria-label={isFavorite(restaurant.id) ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
          >
            {isFavorite(restaurant.id) 
              ? <FaHeart size={22} className="animate-heart-pop" /> 
              : <FaRegHeart size={22} />
            }
          </button>
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
          {restaurant.tags.join(' • ')}
        </p>
        <Link
          to={`/gastronomy/${restaurant.id}`}
          className="
            inline-block bg-purple-600 text-white mt-auto
            px-4 py-2 rounded-lg hover:bg-purple-700 transition
            text-center font-semibold self-start
          "
        >
          Részletek
        </Link>
      </div>
    </div>
  );
}
