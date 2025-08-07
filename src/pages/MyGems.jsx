import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import DiscoveredGemCard from '../components/DiscoveredGemCard';
import LockedGemCard from '../components/LockedGemCard';
import ScanHelpModal from '../components/ScanHelpModal';
import compassImg from '/images/game/compass.jpeg';

// Leaflet ikon beállítások
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
    if (window.confirm("Biztosan törölni szeretnéd az összes eddigi felfedezésedet?")) {
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
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),url('/images/game/terkep.webp')"
        }}
      >
        <div className="flip-card-container w-full max-w-6xl h-[90vh]">
          <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>

            {/* — FRONT (lista) — */}
            <div className="flip-card-front">
              <div
                className="w-full h-full flex flex-col rounded-2xl shadow-2xl border-2 border-amber-700/40 relative overflow-hidden"
                style={{
                  backgroundImage: "url('/images/game/pergamen.jpeg')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-24 pb-24">
                  <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-8 font-bold">

                    <div className="flex justify-between items-center gap-4">
                      <h1 className="text-4xl sm:text-5xl">Felfedezett Kincseid</h1>
                      <img
                        src={compassImg}
                        alt="Térképnézet"
                        onClick={() => setIsFlipped(true)}
                        className="w-12 h-12 rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {allGems.length > 0 ? (
                      <>
                        <p>
                          Gratulálok! Eddig <strong>{foundGems.length}</strong> kincset találtál a(z){' '}
                          <strong>{allGems.length}</strong>-ból.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
                          {allGems.map(gem =>
                            foundGems.includes(gem.id)
                              ? <DiscoveredGemCard key={gem.id} gem={gem} />
                              : <LockedGemCard key={gem.id} />
                          )}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
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
                      <div className="space-y-6">
                        <p className="text-lg">Még nem találtál egyetlen rejtett kincset sem.</p>
                        <ScanButton onClick={() => setShowScanHelp(true)} />
                      </div>
                    )}

                    <div className="mt-8">
                      <Link
                        to="/"
                        className="inline-block text-sm bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                      >
                        Kilépés a játékból
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* — BACK (térkép) — */}
            <div className="flip-card-back">
              <div
                className="w-full h-full flex flex-col rounded-2xl shadow-2xl border-2 border-amber-700/40 relative overflow-hidden"
                style={{
                  backgroundImage: "url('/images/game/pergamen.jpeg')",
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="flex justify-between items-center mb-4 p-4">
                  <h2 className="text-3xl font-bold text-amber-800">A Kincsek Térképe</h2>
                  <img
                    src={compassImg}
                    alt="Lista nézet"
                    onClick={() => setIsFlipped(false)}
                    className="w-10 h-10 rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30 m-4">
                  <MapContainer
                    center={[47.389, 16.542]}
                    zoom={15}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    {allGems.map(gem => (
                      <Marker
                        key={gem.id}
                        position={[gem.coords.lat, gem.coords.lng]}
                        opacity={foundGems.includes(gem.id) ? 1 : 0.5}
                      >
                        <Popup>
                          {gem.name}
                          {!foundGems.includes(gem.id) && ' (Rejtett)'}
                        </Popup>
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
