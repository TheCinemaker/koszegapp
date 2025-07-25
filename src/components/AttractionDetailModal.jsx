import React, { useEffect, useState } from 'react';
import { fetchAttractionById } from '../api';
import { Link } from 'react-router-dom';

export default function AttractionDetailModal({ attractionId, onClose }) {
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    
    const fadeInTimer = setTimeout(() => setIsShowing(true), 10);

    // Adatok betöltése
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
    // Modal háttér (overlay)
    <div 
      onClick={handleBackdropClick}
      onTransitionEnd={handleTransitionEnd} 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out
                  ${isShowing ? 'opacity-100' : 'opacity-0'}`} 
    >
      {/* Modal tartalom */}
      <div 
        className={`bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative transition-all duration-300 ease-in-out
                    ${isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} 
      >
        {/* Bezárás gomb */}
        <button onClick={handleClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && <p className="p-8 text-center">Betöltés...</p>}
        {error && <p className="p-8 text-center text-red-500">Hiba: {error}</p>}
        
        {attr && (
          <div className="p-6 pt-10">
            <img src={attr.image} alt={attr.name} className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg" />
            <h1 className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">{attr.name}</h1>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{attr.details}</p>
            
            <div className="text-center mt-6">
              <Link
                to={`/attractions/${attr.id}`}
                onClick={handleClose} 
                className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition"
              >
                Megnyitás külön oldalon
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
