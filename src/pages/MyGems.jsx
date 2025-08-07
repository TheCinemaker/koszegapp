import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import DiscoveredGemCard from '../components/DiscoveredGemCard'; 
import LockedGemCard from '../components/LockedGemCard'; 
import ScanHelpModal from '../components/ScanHelpModal'; 

// Leaflet ikon javítás a megbízható működésért
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

// A ScanButton komponens definíciója
const ScanButton = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center"
  >
    📷 Találj egy új kincset!
  </button>
);

export default function MyGems() {
  // --- Hooks ---
  const { foundGems, resetGame } = useGame();
  const navigate = useNavigate();

  // --- Állapotok (States) ---
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanHelp, setShowScanHelp] = useState(false);

  // --- Adatbetöltés ---
  useEffect(() => {
    setLoading(true);
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  // --- Eseménykezelők ---
  const handleReset = () => {
    if (window.confirm("Biztosan törölni szeretnéd az összes eddigi felfedezésedet? Ezzel a játékot újraindítod.")) {
      resetGame();
      navigate('/');
    }
  };

  // --- Betöltési és Hiba Állapotok Kezelése ---
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
        <div 
          className="max-w-6xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/game/pergamen.jpeg')",
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-4 sm:px-8 md:px-16 pt-12 pb-12">
            <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-10 font-bold">
              
              <h1 className="text-4xl sm:text-5xl font-bold">Felfedezett Kincseid</h1>
              
              {allGems.length > 0 ? (
                <>
                  <p>Gratulálunk! Eddig <strong>{foundGems.length}</strong> kincset találtál meg a(z) <strong>{allGems.length}</strong>-ből.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              <div>
                    <h2 className="text-3xl sm:text-4xl mb-4 font-bold">Kincseid a térképen</h2>
                    <div className="h-80 w-full rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30">
                      <MapContainer center={[47.389, 16.542]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                        {allGems.filter(gem => foundGems.includes(gem.id)).map(gem => (
                          <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]}><Popup>{gem.name}</Popup></Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
              <div className="mt-12">
                <Link to="/" className="inline-block text-sm bg-gray-700/80 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Kilépés a Játékból
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
