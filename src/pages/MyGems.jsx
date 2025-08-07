import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import DiscoveredGemCard from '../components/DiscoveredGemCard';
import LockedGemCard from '../components/LockedGemCard';
import ScanHelpModal from '../components/ScanHelpModal';
import { FaMap, FaList } from 'react-icons/fa';

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
  <button
    onClick={onClick}
    className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center"
  >
    📷 Találj egy új kincset!
  </button>
);

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanHelp, setShowScanHelp] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

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
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')" }}
      >
        <div className="flip-card-container w-full max-w-6xl h-[90vh]">
          <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
            
            <div className="flip-card-front">
              <div
                className="w-full h-full flex flex-col rounded-2xl shadow-2xl border-2 border-amber-700/40 relative overflow-hidden"
                style={{
                  backgroundImage: "url('/images/game/pergamen.jpeg')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-4 sm:px-8 md:px-16 pt-12 pb-12">
                  <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-10 font-bold">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <h1 className="text-4xl sm:text-5xl font-bold text-left">Felfedezett Kincseid</h1>
                      <button onClick={() => setIsFlipped(true)} className="w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform duration-300" aria-label="Térképnézet">
                        <img src="/images/game/compass.jpeg" alt="Iránytű" className="w-full h-full object-cover rounded-full" />
                      </button>
                    </div>
                    {allGems.length > 0 ? (
                      <>
                        <p>
                          Gratulálok! Eddig <strong>{foundGems.length}</strong> kincset találtál meg a(z) <strong>{allGems.length}</strong>-ből.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {allGems.map(gem => 
                            foundGems.includes(gem.id) ? (
                              <DiscoveredGemCard key={gem.id} gem={gem} />
                            ) : (
                              <LockedGemCard key={gem.id} />
                            )
                          )}
                        </div>
                        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
                          <ScanButton onClick={() => setShowScanHelp(true)} />
                          <button onClick={handleReset} className="bg-red-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-800 transition shadow-lg">
                            Játék Újraindítása
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-lg text-amber-900">Még nem találtál egyetlen rejtett kincset sem.</p>
                        <ScanButton onClick={() => setShowScanHelp(true)} />
                      </>
                    )}
                    <div className="mt-12">
                      <Link to="/" className="inline-block text-sm bg-gray-700/80 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                        Kilépés a Játékból
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flip-card-back">
              <div className="w-full h-full flex flex-col rounded-2xl shadow-2xl border-2 border-amber-700/40 bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 md:p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-3xl font-bold text-amber-800 dark:text-amber-300">A Kincsek Térképe</h2>
                  <button onClick={() => setIsFlipped(false)} className="w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform duration-300" aria-label="Vissza a listához">
                    <img src="/images/game/compass.jpeg" alt="Iránytű" className="w-full h-full object-cover rounded-full transform rotate-180" />
                  </button>
                </div>
                <div className="flex-1 rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30">
                  <MapContainer center={[47.389, 16.542]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    {allGems.map(gem => (
                      <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]} opacity={foundGems.includes(gem.id) ? 1.0 : 0.5}>
                        <Popup>{gem.name}{!foundGems.includes(gem.id) && ' (Még felfedezésre vár)'}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
