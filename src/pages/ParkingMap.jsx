import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { isParkingPaidNow } from '../utils/parkingUtils';
import UserLocationMarker from '../components/UserLocationMarker';
import { fetchParkingMachines, fetchParkingZones } from '../api';
import { IoArrowBack, IoLocate, IoInformationCircle } from 'react-icons/io5';
import SEO from '../components/SEO';

// Fix Leaflet Icons
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function ParkingMap() {
  const [zones, setZones] = useState([]);
  const [machines, setMachines] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const navigate = useNavigate();
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    fetchParkingZones().then(setZones).catch(console.error);
    fetchParkingMachines().then(setMachines).catch(console.error);
  }, []);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor. Engedélyezd a böngészőben!")
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-white pt-4 pb-28 px-4 sm:px-6">
      <SEO
        title="Parkolási Zónák & Automatákk Kőszegen"
        description="Parkolási zónák és automaták interaktív térképe."
        url="/parking-map"
      />

      {/* Header section wrapper */}
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/parking"
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-800 dark:text-white hover:scale-105 transition-transform shrink-0"
          >
            <IoArrowBack className="text-sm" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Parkolási Térkép</h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">Zónák, díjak és parkolóautomaták</p>
          </div>
        </div>

        <button
          onClick={handleLocateMe}
          className="px-4 py-2 rounded-full bg-indigo-500 hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <IoLocate className="text-base" />
          <span>Helyzetem</span>
        </button>
      </div>

      {/* MAIN MAP CARD (CSEMPE - rounded-2xl, border, overflow-hidden) */}
      <div className="max-w-6xl mx-auto relative rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 shadow-2xl bg-white dark:bg-[#151515] h-[calc(100vh-210px)] min-h-[460px]">
        <MapContainer
          center={[47.389, 16.540]}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full outline-none"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {zones.map(zone => {
            const isPaid = isParkingPaidNow(zone.hours);
            return zone.lines.map((line, idx) => (
              <Polyline
                key={`${zone.id}-${idx}`}
                positions={line}
                pathOptions={{ color: zone.color, weight: 6, opacity: 0.8, lineCap: 'round' }}
              >
                <Popup className="glass-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-lg text-indigo-600">{zone.name}</strong>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                        {isPaid ? 'FIZETŐS' : 'INGYENES'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Ár:</strong> {zone.price}</p>
                      <p><strong>Idő:</strong> {zone.hours}</p>
                      <p><strong>Fizetés:</strong> {zone.payment.join(', ')}</p>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            ));
          })}

          {machines.map(machine => (
            <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]}>
              <Popup>
                <div className="text-center p-2">
                  <strong className="block text-indigo-600 mb-1">Parkolóautomata</strong>
                  <span className="text-xs text-gray-600 block mb-2">{machine.address}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${machine.coords.lat},${machine.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-indigo-500 hover:opacity-90 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-opacity"
                  >
                    Odaút
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {userPosition && <UserLocationMarker position={userPosition} />}
        </MapContainer>

        {/* --- FLOATING LEGEND --- */}
        <div className={`
              absolute bottom-4 left-4 z-[1000] 
              transition-all duration-300
              ${showLegend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}>
          <div className="bg-white/90 dark:bg-[#1a1c2e]/90 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-white/40 dark:border-white/10 w-48">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Jelmagyarázat</h4>
              <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <IoInformationCircle size={16} />
              </button>
            </div>
            <ul className="space-y-2">
              {zones.map(zone => (
                <li key={zone.id} className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: zone.color }}></span>
                  <span className="truncate">{zone.name}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <img src={markerIcon} alt="" className="w-3 h-4 opacity-80" />
                <span>Automata</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Toggle Legend Button */}
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute bottom-4 left-4 z-[1000] p-3 rounded-full bg-white/90 dark:bg-[#1a1c2e]/90 backdrop-blur-md shadow-lg border border-white/20"
          >
            <IoInformationCircle size={24} className="text-indigo-500" />
          </button>
        )}

      </div>
    </div>
  );
}
