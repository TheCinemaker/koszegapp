import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ScanHelpModal from '../components/ScanHelpModal';

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

  const renderGemCard = (gem, isFound) => {
    const backgroundUrl = isFound
      ? "/images/game/located.jpeg"
      : "/images/game/notlocated.jpeg";

    return (
      <div
        key={gem.id}
        className="relative aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-amber-700/40"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#fdf5e6] via-[#fdf5e6aa] to-transparent z-10" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#fdf5e6] via-[#fdf5e6aa] to-transparent z-10" />

        <div className="scroll-mask flex flex-col items-center justify-center h-full text-center px-4 pt-6 pb-6 z-20 relative font-zeyada text-amber-900 text-2xl font-bold leading-relaxed">
          {isFound ? (
            <>
              <h2 className="text-3xl mb-2">{gem.name}</h2>
              <p className="text-sm font-normal">{gem.description.slice(0, 100)}...</p>
            </>
          ) : (
            <>
              <p className="text-4xl opacity-60">❓</p>
              <p className="mt-2">Rejtett Kincs</p>
              <p className="text-sm opacity-70 font-normal">Még felfedezésre vár...</p>
            </>
          )}
        </div>
      </div>
    );
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
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')"
        }}
      >
        <div className="max-w-6xl w-full bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300">
              Felfedezett Kincseid
            </h1>
            <Link
              to="/"
              className="text-sm bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Kilépés a játékból
            </Link>
          </div>

          {allGems.length > 0 ? (
            <>
              <p className="mb-6 text-amber-900 dark:text-amber-200 text-center font-semibold">
                Gratulálok! Eddig {foundGems.length} kincset találtál meg a(z) {allGems.length}-ből.
              </p>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-amber-800 dark:text-amber-300">
                  Kincseid a térképen
                </h2>
                <div className="h-80 w-full rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30">
                  <MapContainer
                    center={[47.389, 16.542]}
                    zoom={15}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    {allGems
                      .filter(gem => foundGems.includes(gem.id))
                      .map(gem => (
                        <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]}>
                          <Popup>{gem.name}</Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allGems.map(gem => renderGemCard(gem, foundGems.includes(gem.id)))}
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200/50 dark:border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-4">
                <ScanButton onClick={() => setShowScanHelp(true)} />
                <button
                  onClick={handleReset}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Játék újraindítása
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg mb-6 text-amber-800 dark:text-amber-200">
                Még nem találtál egyetlen rejtett kincset sem.
              </p>
              <ScanButton onClick={() => setShowScanHelp(true)} />
            </div>
          )}
        </div>
      </div>

      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
