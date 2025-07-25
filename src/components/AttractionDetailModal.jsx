// src/components/AttractionDetailModal.jsx

import React, { useEffect, useState } from 'react';
import { fetchAttractionById } from '../api';
import { Link } from 'react-router-dom';

export default function AttractionDetailModal({ attractionId, onClose }) {
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attractionId) return;

    setLoading(true);
    fetchAttractionById(attractionId)
      .then(data => setAttr(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [attractionId]);

  // A modal háttérre kattintva bezárul
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Modal háttér (overlay)
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
    >
      {/* Modal tartalom */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {/* Bezárás gomb */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && <p className="p-8 text-center">Betöltés...</p>}
        {error && <p className="p-8 text-center text-red-500">Hiba: {error}</p>}
        
        {attr && (
          // Itt lényegében újrahasznosítjuk az AttractionDetail oldal kinézetét
          <div className="p-6">
            <img src={attr.image} alt={attr.name} className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg" />
            <h1 className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">{attr.name}</h1>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{attr.details}</p>
            
            {/* ... Itt jöhet a többi részlet (nyitvatartás, árak stb.), ha szeretnéd ... */}

            <div className="text-center mt-6">
              <Link
                to={`/attractions/${attr.id}`}
                onClick={onClose} // Bezárjuk a modalt, ha a felhasználó a teljes oldalra navigál
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
