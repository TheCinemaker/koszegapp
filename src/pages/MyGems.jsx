// src/pages/MyGems.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// --- Egyszerű Modal komponens (portál nélkül) ---
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden border-2 border-amber-700/40 shadow-2xl">
        {/* Pergamen háttér a modalban is */}
        <div
          className="h-full w-full flex flex-col relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/game/pergamen.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Görgethető belső tartalom maszkolva – ugyanúgy, mint az intróban */}
          <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-8 pb-8">
            <div
            className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-8 pb-8"
            style={{ WebkitOverflowScrolling: 'touch' }}
+         >
            {children}
          </div>

          {/* Bezárás gomb a jobb felső sarokban */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 transition font-sans text-lg z-20"
            aria-label="Bezárás"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// Térkép méretezés fix modal nyitáskor
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Kiskártya – megtalált kincs (kattintásra a részletek modal nyílik)
function DiscoveredGemCard({ gem, onOpen }) {
  return (
    <button
      onClick={() => onOpen(gem)}
      className="group relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-amber-800/30 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      <div className="relative z-10 h-full w-full p-3 flex flex-col items-center justify-between text-center">
        <h3 className="font-zeyada text-amber-900 text-2xl font-bold leading-tight line-clamp-2 mt-1">
          {gem.name}
        </h3>
        <img
          src={`/images/game/${gem.image}`}
          alt={gem.name}
          className="w-full h-20 object-cover rounded-md shadow-inner"
        />
        <p className="font-sans text-xs text-amber-900/80">
          Koppints a részletekhez
        </p>
      </div>
    </button>
  );
}

// Kiskártya – NEM megtalált kincs
function LockedGemCard() {
  return (
    <div
      className="relative w-full aspect-square bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden flex items-center justify-center"
      style={{ backgroundImage: "url('/images/game/notlocated.webp')" }}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>
      <div className="relative z-10 text-center text-white font-zeyada space-y-2 px-4">
        <div className="text-5xl opacity-60 mx-auto">?</div>
        <h3 className="text-xl sm:text-2xl font-bold">Rejtett kincs</h3>
        <p className="font-sans text-sm sm:text-base opacity-90">Még felfedezésre vár...</p>
      </div>
    </div>
  );
}

const ScanButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center font-sans"
  >
    📷 Találj egy új kincset!
  </button>
);

export default function MyGems() {
  const { foundGems, resetGame } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showScanHelp, setShowScanHelp] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [detailGem, setDetailGem] = useState(null); // { id, name, image, description, coords... }

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

  const foundSet = new Set(foundGems);

  return (
    <>
      {/* Háttér, mint az intróban */}
      <div
        className="fixed inset-0 bg-black/90"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Pergamen „főkártya” – intróval azonos stílus */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          className="max-w-6xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/game/pergamen.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* görgethető belső – scroll-mask, mint az intróban */}
          <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-24 pb-24">
            <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-8 font-bold">
              {/* Fejléc + kis kerek kompasz gomb (térkép modal) */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-4xl sm:text-5xl font-bold">Felfedezett Kincseid</h1>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
                  aria-label="Térképnézet"
                >
                  <img
                    src={compassImg}
                    alt="Iránytű"
                    className="w-full h-full object-cover rounded-full"
                  />
                </button>
              </div>

              {allGems.length > 0 ? (
                <>
                  <p className="font-sans font-semibold text-amber-900">
                    Gratulálok! Eddig <strong>{foundGems.length}</strong> / <strong>{allGems.length}</strong> kincset találtál meg.
                  </p>

                  {/* Kiskártya-rács */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allGems.map(gem =>
                      foundSet.has(gem.id) ? (
                        <DiscoveredGemCard
                          key={gem.id}
                          gem={gem}
                          onOpen={setDetailGem}
                        />
                      ) : (
                        <LockedGemCard key={gem.id} />
                      )
                    )}
                  </div>

                  {/* Láb – Scan + Reset */}
                  <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <ScanButton onClick={() => setShowScanHelp(true)} />
                    <button
                      onClick={handleReset}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold font-sans"
                    >
                      Játék újraindítása
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <p className="font-sans text-lg text-amber-900">
                    Még nem találtál egyetlen rejtett kincset sem.
                  </p>
                  <ScanButton onClick={() => setShowScanHelp(true)} />
                </div>
              )}

              <div className="pt-4">
                <Link
                  to="/"
                  className="inline-block text-sm bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-sans"
                >
                  Kilépés a játékból
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === TÉRKÉP MODAL (összes kincs) === */}
      <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)}>
        <h2 className="text-3xl sm:text-4xl font-bold font-zeyada text-amber-900 text-center mb-6">
          A Kincsek Térképe
        </h2>
        <div className="font-sans text-amber-900/80 text-center mb-4">
          A megtalált kincsek erősebb színnel jelennek meg.
        </div>
        <div className="rounded-xl overflow-hidden shadow-md border-2 border-amber-700/30">
          <MapContainer
            center={[47.389, 16.542]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '60vh', width: '100%' }}
          >
            <MapInvalidateSize />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {allGems.map(gem => (
              <Marker
                key={gem.id}
                position={[gem.coords.lat, gem.coords.lng]}
                opacity={foundSet.has(gem.id) ? 1 : 0.5}
              >
                <Popup>
                  {gem.name}
                  {!foundSet.has(gem.id) && ' (Rejtett)'}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Modal>

      {/* === KINCS-RÉSZLETEK MODAL (kiskártyáról) === */}
      <Modal isOpen={!!detailGem} onClose={() => setDetailGem(null)}>
        {detailGem && (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold font-zeyada text-amber-900">{detailGem.name}</h2>
            <img
              src={`/images/game/${detailGem.image}`}
              alt={detailGem.name}
              className="w-full h-56 object-cover rounded-lg shadow-md"
            />
            <p className="font-sans text-lg leading-relaxed text-amber-900/90 whitespace-pre-line">
              {detailGem.description}
            </p>
          </div>
        )}
      </Modal>

      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </>
  );
}
