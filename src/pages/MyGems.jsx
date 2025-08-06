import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// <<< ÚJ: A "Kamera" komponens, ahogy kérted >>>
const ScanButton = () => (
  <div className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center cursor-pointer">
    📷 Találj egy új kincset! (Használd a kamerád)
  </div>
);

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    if (window.confirm("Biztosan törölni szeretnéd az összes eddigi felfedezésedet? Ezzel a játékot újraindítod.")) {
      resetGame();
      window.location.reload();
    }
  };

  const discoveredGems = allGems.filter(gem => foundGems.includes(gem.id));

  if (loading) return <p className="text-center p-10">Gyűjtemény betöltése...</p>;

  return (
    // <<< JAVÍTÁS: A háttér itt van, nem az App.jsx-ben >>>
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6">
        <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300 mb-6">Felfedezett Kincseid</h1>
        
        {discoveredGems.length > 0 ? (
          <>
            <p className="mb-4 ...">Gratulálok! Eddig {discoveredGems.length} kincset találtál meg...</p>
            <div className="mb-8">{/* ... Térkép ... */}</div>
            <div className="space-y-4">{/* ... Lista ... */}</div>
            <div className="mt-8 pt-6 border-t ...">
              {/* <<< JAVÍTÁS: A gombok >>> */}
              <ScanButton />
              <button onClick={handleReset} className="bg-red-600 ...">Játék újraindítása</button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg ...">Még nem találtál egyetlen kincset sem.</p>
            <div className="mt-6"><ScanButton /></div>
          </div>
        )}
      </div>
    </div>
  );
}
