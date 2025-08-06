import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Új "Kamera" komponens a felhasználó instruálásához
const ScanButton = () => (
  <div className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg cursor-pointer">
    📷 Új kincs szkennelése
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
      // A frissítéshez újra kell tölteni az oldalt, hogy a useGame hook frissüljön
      window.location.reload(); 
    }
  };

  const discoveredGems = allGems.filter(gem => foundGems.includes(gem.id));

  if (loading) return <div className="bg-gray-900/90 ..."><p>Gyűjtemény betöltése...</p></div>;

  return (
    // === ITT A JAVÍTÁS: ÚJ HÁTTÉR ÉS ELRENDEZÉS ===
    <div 
      className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')" }}
    >
      <div className="max-w-4xl w-full bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300">Felfedezett Kincseid</h1>
          {/* A Főoldalra link itt már nem kell, mert a fejlécben a logóval ki lehet lépni */}
        </div>

        {discoveredGems.length > 0 ? (
          <>
            <p className="mb-4 text-amber-900 dark:text-amber-200">Gratulálok! Eddig {discoveredGems.length} kincset találtál meg a {allGems.length}-ből. Csak így tovább!</p>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-amber-800 dark:text-amber-300">Kincseid a térképen</h2>
              <div className="h-80 w-full rounded-lg overflow-hidden shadow-md">
                <MapContainer center={[47.389, 16.542]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
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

            <div className="mt-8 pt-6 border-t border-amber-200 dark:border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-4">
              <ScanButton />
              <button onClick={handleReset} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold">
                Játék újraindítása
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg mb-4 text-amber-800 dark:text-amber-200">Még nem találtál egyetlen rejtett kincset sem.</p>
            <p className="text-amber-900 dark:text-amber-300">Sétálj a városban, és keresd a QR kódokat a műemlékeken!</p>
            <div className="mt-6">
              <ScanButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
