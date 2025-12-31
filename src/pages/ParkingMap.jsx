import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { isParkingPaidNow } from '../utils/parkingUtils';
import UserLocationMarker from '../components/UserLocationMarker';
import { fetchParkingMachines, fetchParkingZones } from '../api';
import { IoArrowBack, IoLocate, IoInformationCircle } from 'react-icons/io5';

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
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900">
      {/* --- FLOATING HEADER --- */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
        {/* Back Button */}
        <button
          onClick={() => navigate('/parking')}
          className="pointer-events-auto w-12 h-12 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-gray-800 dark:text-white transition-transform active:scale-95"
        >
          <IoArrowBack size={24} />
        </button>

        {/* Title Pill */}
        <div className="pointer-events-auto px-6 py-3 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 shadow-xl">
          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 uppercase tracking-wide">
            Parkolási Zónák
          </h1>
        </div>

        {/* Locate Me */}
        <button
          onClick={handleLocateMe}
          className="pointer-events-auto w-12 h-12 rounded-full bg-blue-500/90 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-white transition-transform active:scale-95 animate-pulse-slow hover:bg-blue-600"
        >
          <IoLocate size={22} />
        </button>
      </div>

      <MapContainer
        center={[47.389, 16.540]}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
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
                    <strong className="text-lg text-purple-700">{zone.name}</strong>
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
                  className="inline-block bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-blue-600 transition"
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
            absolute bottom-24 left-4 z-[1000] 
            transition-all duration-300
            ${showLegend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <div className="bg-white/80 dark:bg-[#1a1c2e]/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/40 dark:border-white/10 w-48">
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

      {/* Toggle Legend Button (When Hidden) */}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute bottom-24 left-4 z-[1000] p-3 rounded-full bg-white/80 dark:bg-[#1a1c2e]/80 backdrop-blur-md shadow-lg border border-white/20 animate-fade-in-up"
        >
          <IoInformationCircle size={24} className="text-indigo-600 dark:text-indigo-400" />
        </button>
      )}

    </div>
  );
}
