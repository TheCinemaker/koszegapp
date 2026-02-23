import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { IoHeart, IoHeartOutline, IoRestaurantOutline, IoBeerOutline, IoCafeOutline } from 'react-icons/io5';
import GhostImage from './GhostImage';

// Prefixelt ID-k
const featuredIds = ['gastro-10'];

const getIconForType = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('kávé') || t.includes('cukrász')) return <IoCafeOutline />;
  if (t.includes('bár') || t.includes('pub')) return <IoBeerOutline />;
  return <IoRestaurantOutline />;
};

export default function GastroCard({ restaurant }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const isFeatured = featuredIds.includes(restaurant.id);
  const typeIcon = getIconForType(restaurant.type);

  return (
    <Link
      to={`/gastronomy/${restaurant.id}`}
      className={`
        group relative flex flex-col
        rounded-[2rem] overflow-hidden
        border transition-all duration-500 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        ${isFeatured
          ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
          : 'bg-white/40 dark:bg-[#1a1c2e]/40 border-white/50 dark:border-white/10'
        }
        backdrop-blur-[20px] backdrop-saturate-[1.8]
        shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]
      `}
    >
      {/* Image Container with Diagonal Cut */}
      <div className="relative h-48 w-full overflow-hidden">
        {isFeatured && (
          <div className="absolute top-3 left-3 z-20">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1">
              ★ Kiemelt
            </span>
          </div>
        )}


        {/* Favorite Button (Floating) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isFavorite(restaurant.id) ? removeFavorite(restaurant.id) : addFavorite(restaurant.id);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
        >
          {isFavorite(restaurant.id) ? <IoHeart /> : <IoHeartOutline />}
        </button>

        {restaurant.image ? (
          <img
            src={`/images/gastro/${restaurant.image}`}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        {/* Gradient Overlay for Text readability if needed, usually not with card separate content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col grow relative">
        {/* Decorative Type Icon Background */}
        <div className="absolute -top-6 right-6 w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center text-2xl text-orange-500 rotate-12 group-hover:rotate-0 transition-transform duration-500 border border-white/20">
          {typeIcon}
        </div>

        <div className="mb-1">
          <span className="inline-block px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider">
            {restaurant.type}
          </span>
        </div>

        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {restaurant.name}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
            Részletek
          </span>
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-red-600 group-hover:text-white transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
