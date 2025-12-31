import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchParking, fetchParkingMachines, fetchParkingZones } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import UserLocationMarker from '../components/UserLocationMarker';
import {
  IoArrowBack,
  IoMapOutline,
  IoTimeOutline,
  IoWalletOutline,
  IoCarSportOutline,
  IoNavigateOutline,
  IoWarningOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import GhostImage from '../components/GhostImage';
import { motion } from 'framer-motion';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

export default function ParkingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [park, setPark] = useState(null);
  const [machines, setMachines] = useState([]);
  const [zone, setZone] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchParking(),
      fetchParkingMachines(),
      fetchParkingZones()
    ]).then(([parkingData, machinesData, zonesData]) => {
      const foundPark = parkingData.find(p => String(p.id) === id);
      if (!foundPark) {
        setError('Nem található ilyen parkoló.');
        return;
      }
      setPark(foundPark);
      setMachines(machinesData);
      const foundZone = zonesData.find(z => z.id === foundPark.zone_id);
      setZone(foundZone);
    }).catch(err => {
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => setUserPosition([position.coords.latitude, position.coords.longitude]),
      () => alert("Hiba a pozíció lekérésekor. Engedélyezd a böngészőben!")
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !park) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A parkoló nem található."}</p>
        <button
          onClick={() => navigate('/parking')}
          className="px-6 py-3 bg-purple-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  const isPaid = isParkingPaidNow(park.hours);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-rose-500 selection:text-white">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {park.image ? (
          <ParallaxImage
            src={`/images/${park.image}`}
            className="w-full h-full"
            scale={1.15}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/parking')}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title (Parallaxed) */}
        <motion.div
          className="absolute bottom-16 left-6 right-6 z-20 flex flex-col items-start gap-3"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {isPaid !== null && (
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-white shadow-lg ${isPaid ? 'bg-rose-500/80' : 'bg-emerald-500/80'} `}>
              {isPaid ? <IoWarningOutline className="text-sm" /> : <IoCheckmarkCircle className="text-sm" />}
              {isPaid ? 'Jelenleg Fizetős' : 'Jelenleg Ingyenes'}
            </span>
          )}
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {park.name}
          </h1>
        </motion.div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative -mt-10 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp duration={1}>
          <div className="
              bg-white/80 dark:bg-[#1a1c2e]/90
              backdrop-blur-[50px]
              rounded-[3rem]
              border border-white/40 dark:border-white/5
              shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]
              p-8 sm:p-12
              min-h-[50vh]
          ">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* LEFT COLUMN: Map & Zones (Moved Map here for better desktop layout) */}
              <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">

                {/* Map Section */}
                <FadeUp delay={0.2}>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
                    <IoMapOutline className="text-indigo-500" />
                    Térkép
                    <button
                      onClick={handleLocateMe}
                      className="ml-auto text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-gray-200 transition-colors"
                    >
                      Hol vagyok?
                    </button>
                  </h2>

                  <div className="h-96 w-full bg-gray-200 rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner relative z-0">
                    {park.coords && zone ? (
                      <MapContainer
                        center={[park.coords.lat, park.coords.lng]}
                        zoom={16}
                        scrollWheelZoom={true} // Allow scroll now that it's in a larger area
                        className="h-full w-full"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                        {zone.lines.map((line, idx) => (
                          <Polyline key={idx} positions={line} pathOptions={{ color: zone.color, weight: 7, opacity: 0.9 }} />
                        ))}
                        {machines.map(machine => (
                          <Marker key={machine.id} position={[machine.coords.lat, machine.coords.lng]}>
                            <Popup>
                              <div className="text-center">
                                <strong className="block mb-1 text-indigo-600">Parkolóautomata</strong>
                                <span>{machine.address}</span>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        {userPosition && <UserLocationMarker position={userPosition} />}
                      </MapContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 font-medium">Térképadatok betöltése...</div>
                    )}
                  </div>
                </FadeUp>

                {park.zones && park.zones.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 pl-2">Érintett Utcák</p>
                    <div className="flex flex-wrap gap-2">
                      {park.zones.map((zone, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/5">
                          {zone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar Stats & Info */}
              <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">

                {/* Info Grid */}
                <FadeUp delay={0.1}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800/30 flex flex-col items-center justify-center text-center gap-2">
                      <IoCarSportOutline className="text-3xl text-indigo-600 dark:text-indigo-400" />
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-indigo-800 dark:text-indigo-200">{park.capacity || 'N/A'}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 opacity-80">Kapacitás</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-3xl border border-purple-100 dark:border-purple-800/30 flex flex-col items-center justify-center text-center gap-2">
                      <IoWalletOutline className="text-3xl text-purple-600 dark:text-purple-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-purple-800 dark:text-purple-200 leading-tight">{park.price || 'Ingyenes'}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 opacity-80 decoration-slice">Ár / Óra</span>
                      </div>
                    </div>
                  </div>
                </FadeUp>

                {/* Details Card */}
                <FadeUp delay={0.2}>
                  <div className="bg-gray-100 dark:bg-black/30 rounded-3xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <IoTimeOutline className="text-indigo-500" />
                      Részletek
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Időszak</span>
                        <span className="text-base font-bold text-gray-900 dark:text-white block">{park.hours}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Fizetés</span>
                        <span className="text-base font-bold text-gray-900 dark:text-white block">{park.payment && park.payment.join(', ')}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Cím</span>
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300 block">{park.address}</span>
                      </div>
                    </div>
                  </div>
                </FadeUp>

                {/* Navigation Button */}
                {park.coords && (
                  <FadeUp delay={0.3}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${park.coords.lat},${park.coords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors group shadow-lg shadow-blue-500/30"
                    >
                      <IoNavigateOutline className="text-2xl group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-lg">Odaút Tervezése</span>
                    </a>
                  </FadeUp>
                )}

              </div>
            </div>

          </div>
        </FadeUp>
      </div>

    </div>
  );
}
