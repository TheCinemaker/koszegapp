import React from 'react';
import { Link } from 'react-router-dom';

const featuredIds = [10]; 

export default function GastroCard({ restaurant }) {
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
        <h3 className="text-xl font-semibold mb-1 flex-grow">{restaurant.name}</h3>
        <p className="text-gray-800 dark:text-gray-200 text-sm mb-4">
          {restaurant.tags.join(' • ')}
        </p>
        <Link
          to={`/gastronomy/${restaurant.id}`}
          className="
            inline-block bg-purple-600 text-white mt-auto
            px-4 py-2 rounded-lg hover:bg-purple-700 transition
            text-center font-semibold
          "
        >
          Részletek
        </Link>
      </div>
    </div>
  );
}
