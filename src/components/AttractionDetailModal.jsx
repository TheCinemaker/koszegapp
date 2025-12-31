import React, { useEffect, useState } from 'react';
import { fetchAttractionById } from '../api';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function AttractionDetailModal({ attractionId, onClose, isFavorite, addFavorite, removeFavorite }) {
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => setIsShowing(true), 10);

    if (!attractionId) return;
    setLoading(true);
    fetchAttractionById(attractionId)
      .then(data => setAttr(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    return () => clearTimeout(fadeInTimer);
  }, [attractionId]);

  const handleClose = () => {
    setIsShowing(false);
  };

  const handleTransitionEnd = () => {
    if (!isShowing) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      onTransitionEnd={handleTransitionEnd}
      className={`fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex justify-center items-end sm:items-center sm:p-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                  ${isShowing ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white/90 dark:bg-[#0f111a]/90 backdrop-blur-3xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl border border-white/20 dark:border-white/5 w-full max-w-2xl max-h-[95vh] h-[90vh] sm:h-auto overflow-hidden relative transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
                    ${isShowing ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-24 opacity-0 scale-90'}`}
      >
        {/* Floating Close Button (Glass Orb) */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-30 w-12 h-12 bg-black/20 dark:bg-white/10 hover:bg-black/40 dark:hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}
        {error && <div className="h-full flex items-center justify-center"><p className="text-rose-500 font-bold">Hiba: {error}</p></div>}

        {attr && (
          <div className="h-full flex flex-col overflow-y-auto scrollbar-hide bg-transparent">

            {/* 1. HERO SECTION (Massive Image) */}
            <div className="relative shrink-0 h-[45vh] w-full">
              <img
                src={attr.image}
                alt={attr.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

              {/* Title Overlay - Massive & Bold */}
              <div className="absolute bottom-0 left-0 w-full p-8 pb-12 translate-y-8 z-10 pointer-events-none">
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.9] tracking-tight drop-shadow-2xl">
                  {attr.name}
                </h1>
                <div className="flex items-center gap-3 mt-4">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-white">
                    {attr.category || 'Látnivaló'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. CONTENT BODY (Overlapping 'Glass Sheet') */}
            <div className="relative -mt-10 z-20 flex-grow bg-white dark:bg-[#0f111a] rounded-t-[3rem] px-8 pt-12 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-white/20 dark:border-white/5">

              {/* Floating Favorite Button (Between Segments) */}
              <button
                onClick={() => isFavorite(attr.id) ? removeFavorite(attr.id) : addFavorite(attr.id)}
                className="absolute -top-8 right-8 w-16 h-16 bg-white dark:bg-[#1a1d2d] rounded-[1.5rem] shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 border border-gray-100 dark:border-gray-700 group ring-4 ring-transparent hover:ring-indigo-500/20"
              >
                {isFavorite(attr.id)
                  ? <FaHeart size={28} className="text-rose-500 animate-heart-pop drop-shadow-lg" />
                  : <FaRegHeart size={28} className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors" />
                }
              </button>

              {/* Text Content */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium opacity-90 first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:text-indigo-500">
                  {attr.details}
                </p>
              </div>

              {/* 3. FUTURE ACTIONS */}
              <div className="mt-12 flex flex-col gap-4">
                <Link
                  to={`/attractions/${attr.id}`}
                  onClick={handleClose}
                  className="group relative w-full py-4 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 animate-gradient-xy" />
                  <div className="relative flex items-center justify-center gap-2">
                    <span className="text-white font-black uppercase tracking-widest text-sm">Felfedezés</span>
                    <svg className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </Link>

                <button
                  onClick={handleClose}
                  className="w-full py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Bezárás
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
