import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ScanHelpModal from '../components/ScanHelpModal';

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
  const location = useLocation();
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
    const backgroundUrl = isFound ? `/images/game/located.jpeg` : `/images/game/notlocated.webp`;

    const cardContent = (
      <div
        className="relative aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-amber-700/40 h-full transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#f3eadf] via-[#f3eadfbf] to-transparent z-10" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#f3eadf] via-[#f3eadfbf] to-transparent z-10" />
        <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-6 pb-6 z-20 relative font-zeyada text-amber-900 text-2xl font-bold leading-relaxed">
          {isFound ? (
            <>
              <h2 className="text-2xl sm:text-3xl mb-2">{gem.name}</h2>
              <p className="text-sm font-normal line-clamp-3">{gem.description}</p>
            </>
          ) : (
            <>
              <p className="text-4xl opacity-60">❓</p>
              <p className="mt-2 text-2xl">Rejtett Kincs</p>
              <p className="text-sm opacity-70 font-normal">Még felfedezésre vár...</p>
            </>
          )}
        </div>
      </div>
    );

    return isFound ? (
      <Link 
        to={`/game/gem/${gem.id}`} 
        key={gem.id} 
        className="group"
        state={{ fromMyGems: true }}
      >
        {cardContent}
      </Link>
    ) : (
      <div key={gem.id}>{cardContent}</div>
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
        className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="max-w-6xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/game/pergamen.jpeg')",
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-16 pb-16">
            <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-10 font-bold">
              <h1 className="text-4xl sm:text-5xl font-bold">
                Felfedezett Kincseid
              </h1>
              {allGems.length > 0 ? (
                <>
                  <p>
                    Gratulálunk! Eddig <strong>{foundGems.length}</strong> kincset találtál meg a(z) <strong>{allGems.length}</strong>-ből.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
                    {allGems.map(gem => renderGemCard(gem, foundGems.includes(gem.id)))}
                  </div>
                  <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <ScanButton onClick={() => setShowScanHelp(true)} />
                    <button onClick={handleReset} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold">
                      Játék újraindítása
                    </button>
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl mb-4 font-bold">Kincseid a térképen</h2>
                    <div className="h-80 w-full rounded-lg overflow-hidden shadow-md border-2 border-amber-700/30">
                      <MapContainer center={[47.389, 16.542]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                        {allGems.filter(gem => foundGems.includes(gem.id)).map(gem => (
                          <Marker key={gem.id} position={[gem.coords.lat, gem.coords.lng]}>
                            <Popup>{gem.name}</Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg text-amber-900">Még nem találtál egyetlen rejtett kincset sem.</p>
                  <ScanButton onClick={() => setShowScanHelp(true)} />
                </>
              )}
              <div className="mt-12">
                <Link to="/" className="inline-block text-sm bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  Kilépés a játékból
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
