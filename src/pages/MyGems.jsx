import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ScanHelpModal from '../components/ScanHelpModal';
import { FaMapMarkerAlt, FaQuestion } from 'react-icons/fa';

// Leaflet ikon javítás
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const ScanButton = ({ onClick }) => (
  <button onClick={onClick} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center">
    📷 Találj egy új kincset!
  </button>
);

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanHelp, setShowScanHelp] = useState(false);
  const [flippedCardId, setFlippedCardId] = useState(null);

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    if (window.confirm("Biztosan törölni szeretnéd az összes eddigi felfedezésedet? Ezzel a játékot újraindítod.")) {
      resetGame();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4">
        <p className="text-white">Gyűjtemény betöltése...</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')" }}
      >
        <div className="max-w-6xl w-full bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300">Felfedezett Kincseid</h1>
            <Link to="/" className="text-sm bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
              Kilépés a játékból
            </Link>
          </div>

          {allGems.length > 0 ? (
            <>
              <p className="mb-6 text-amber-900 dark:text-amber-200 text-center font-semibold">
                Gratulálok! Eddig {foundGems.length} kincset találtál meg a(z) {allGems.length}-ből.
              </p>
              
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-amber-800 dark:text-amber-300">Kincseid a térképen</h2>
                <div className="h-80 w-full rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30">
                  <MapContainer center={[47.389, 16.542]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    {allGems.filter(gem => foundGems.includes(gem.id)).map(gem => (
                      <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]}><Popup>{gem.name}</Popup></Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allGems.map(gem => {
                  const isFound = foundGems.includes(gem.id);
                  const isFlipped = flippedCardId === gem.id;

                  return isFound ? (
                    <div key={gem.id} className={`flip-card w-full aspect-square ${isFlipped ? 'flipped' : ''}`} onClick={() => setFlippedCardId(isFlipped ? null : gem.id)}>
                      <div className="flip-card-inner">
                        <div className="flip-card-front bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 cursor-pointer" style={{ backgroundImage: "url('/images/game/located.jpeg')" }}>
                          <div className="flex flex-col h-full bg-black/10 backdrop-blur-sm p-3 rounded-2xl">
                            <div className="flex-grow text-center font-zeyada text-amber-900"><h3 className="text-2xl font-bold line-clamp-2">{gem.name}</h3><img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-24 object-cover rounded-md my-2 shadow-inner" /></div>
                            <div className="flex items-center justify-center text-xs font-semibold text-amber-800/70"><FaMapMarkerAlt className="mr-1" /><span>Fordítsd meg a térképért!</span></div>
                          </div>
                        </div>
                        <div className="flip-card-back bg-gray-700 rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden">
                          {isFlipped && <MapContainer center={[gem.coords.lat, gem.coords.lng]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[gem.coords.lat, gem.coords.lng]} /></MapContainer>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={gem.id} className="relative w-full aspect-square bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden flex items-center justify-center" style={{ backgroundImage: "url('/images/game/notlocated.jpeg')" }}>
                      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>
                      <div className="relative z-10 text-center text-white font-zeyada space-y-2 px-4">
                        <FaQuestion className="text-5xl opacity-60 mx-auto" />
                        <h3 className="text-xl sm:text-2xl font-bold">Rejtett kincs</h3>
                        <p className="text-sm sm:text-base opacity-80">Még felfedezésre vár...</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200/50 dark:border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-4">
                <ScanButton onClick={() => setShowScanHelp(true)} />
                <button onClick={handleReset} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold">
                  Játék újraindítása
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg mb-6 text-amber-800 dark:text-amber-200">Még nem találtál egyetlen rejtett kincset sem.</p>
              <ScanButton onClick={() => setShowScanHelp(true)} />
            </div>
          )}
        </div>
      </div>
      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
