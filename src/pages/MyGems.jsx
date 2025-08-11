import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import DiscoveredGemCard from '../components/DiscoveredGemCard';
import LockedGemCard from '../components/LockedGemCard';
import ScanHelpModal from '../components/ScanHelpModal';
import compassImg from '/images/game/compass.jpeg';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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

// Egyszerű újrafelhasználható Modal alap
function Modal({ isOpen, onClose, children, className = '' }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/75 transition"
          aria-label="Bezárás"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanHelp, setShowScanHelp] = useState(false);

  // ÚJ: modálok állapotai
  const [showMapModal, setShowMapModal] = useState(false);
  const [showGemModal, setShowGemModal] = useState(false);
  const [selectedGem, setSelectedGem] = useState(null);

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

  const handleOpenGem = (gem) => {
    setSelectedGem(gem);
    setShowGemModal(true);
  };

  const handleCloseGem = () => {
    setShowGemModal(false);
    setSelectedGem(null);
  };

  const foundGemObjects = useMemo(
    () => allGems.filter(g => foundGems.includes(g.id)),
    [allGems, foundGems]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Háttér + pergamen kártya — ugyanaz a struktúra, mint az intrónál */}
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div
          className="w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/game/pergamen.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-24 pb-24">
            <div className="space-y-8 text-center">
              {/* Cím — kézírásos */}
              <h1 className="font-zeyada text-amber-900 text-4xl sm:text-5xl font-bold leading-relaxed">
                Felfedezett Kincseid
              </h1>

              {/* Összegzés — olvashatóbb sans */}
              <p className="font-sans text-amber-900 text-lg sm:text-xl">
                Gratulálok! Eddig <span className="font-bold">{foundGems.length}</span> kincset találtál meg a(z){' '}
                <span className="font-bold">{allGems.length}</span>-ből.
              </p>

              {/* Térkép gomb – kicsi, kerek iránytű */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowMapModal(true)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
                  aria-label="Térkép megnyitása"
                >
                  <img src={compassImg} alt="Térkép" className="w-full h-full object-cover" />
                </button>
              </div>

              {/* Kincskártyák rácsa */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allGems.map(gem =>
                  foundGems.includes(gem.id) ? (
                    <DiscoveredGemCard key={gem.id} gem={gem} onOpen={() => handleOpenGem(gem)} />
                  ) : (
                    <LockedGemCard key={gem.id} />
                  )
                )}
              </div>

              {/* Alsó gombok – olvasható sans */}
              <div className="font-sans mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                <ScanButton onClick={() => setShowScanHelp(true)} />
                <button
                  onClick={handleReset}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Játék újraindítása
                </button>
              </div>

              <div className="mt-6">
                <Link
                  to="/"
                  className="font-sans inline-block text-sm bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  Kilépés a játékból
                </Link>
              </div>
            </div>
          </div>

          {/* Fade maszkolás a pergamen tetején/alján */}
          <div className="pointer-events-none absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
        </div>
      </div>

      {/* === MAP MODAL === */}
      <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)} className="bg-amber-50">
        <div className="h-full w-full flex flex-col">
          <div className="p-4 pb-0 text-center">
            <h2 className="font-zeyada text-amber-900 text-3xl sm:text-4xl font-bold">A Kincsek Térképe</h2>
            <p className="font-sans text-amber-900/80 mt-1 text-sm sm:text-base">
              A megtalált kincseid erősebb színnel jelennek meg.
            </p>
          </div>
          <div className="flex-1 m-4 rounded-xl overflow-hidden shadow-md border-2 border-amber-700/30">
            <MapContainer
              center={[47.389, 16.542]}
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
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
      </Modal>

      {/* === GEM MODAL (kiskártya tartalma ide nyílik) === */}
      <Modal isOpen={showGemModal} onClose={handleCloseGem} className="bg-white">
        {selectedGem && (
          <div className="h-full w-full flex flex-col">
            <div
              className="relative rounded-t-2xl overflow-hidden"
              style={{ maxHeight: '46vh' }}
            >
              <img
                src={`/images/${selectedGem.image}`}
                alt={selectedGem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="font-zeyada text-white text-3xl font-bold drop-shadow">
                  {selectedGem.name}
                </h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="prose max-w-none">
                <p className="font-sans text-lg leading-relaxed text-amber-900 whitespace-pre-line">
                  {selectedGem.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
