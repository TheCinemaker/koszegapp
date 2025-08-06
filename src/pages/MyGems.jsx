import React, { useEffect, useState } from 'react';
// === ÚJ IMPORT A NAVIGÁCIÓHOZ ===
import { Link, useNavigate } from 'react-router-dom'; 
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // === ÚJ: A useNavigate hook behívása ===
  const navigate = useNavigate();

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  // === JAVÍTOTT FÜGGVÉNY ===
  const handleReset = () => {
    if (window.confirm("Biztosan törölni szeretnéd az összes eddigi felfedezésedet? Ezzel a játékot újraindítod.")) {
      resetGame();
      // Átirányítjuk a felhasználót a Főoldalra a játék törlése után
      navigate('/'); 
    }
  };

  const discoveredGems = allGems.filter(gem => foundGems.includes(gem.id));

  if (loading) return <p className="text-center p-10">Gyűjtemény betöltése...</p>;

  return (
    <div className="max-w-4xl mx-auto my-6 p-4 md:p-6 bg-white/20 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300">Felfedezett Kincseid</h1>
        <Link to="/" className="text-sm bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
          Vissza a Főoldalra
        </Link>
      </div>

      {discoveredGems.length > 0 ? (
        <>
          <p className="mb-4">Gratulálok! Eddig {discoveredGems.length} kincset találtál meg a {allGems.length}-ből. Csak így tovább!</p>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Kincseid a térképen</h2>
            <div className="h-80 w-full rounded-lg overflow-hidden shadow-md">
              <MapContainer center={[47.389, 16.542]} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                {discoveredGems.map(gem => (
                  <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]}>
                    <Popup>{gem.name}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="space-y-4">
            {discoveredGems.map(gem => (
              <Link to={`/game/gem/${gem.id}`} key={gem.id} className="flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 p-3 rounded-lg shadow hover:shadow-lg transition">
                <img src={`/images/${gem.image}`} alt={gem.name} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-purple-900 dark:text-purple-200">{gem.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{gem.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
            <button onClick={handleReset} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold">
              Játék újraindítása (Felfedezések törlése)
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg mb-4">Még nem találtál egyetlen rejtett kincset sem.</p>
          <p>Sétálj a városban, és keresd a QR kódokat a műemlékeken!</p>
        </div>
      )}
    </div>
  );
}
