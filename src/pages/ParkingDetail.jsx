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
import LoadingSpinner from '../components/LoadingSpinner';

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
      <LoadingSpinner fullScreen={true} label="Parkoló adatai..." />
    );
  }

  if (error || !park) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A parkoló nem található."}</p>
        <button
          onClick={() => navigate('/parking')}
          className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  const isPaid = isParkingPaidNow(park.hours);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-x-hidden pb-10">

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {park.image ? (
          <ParallaxImage
            src={`/images/parking/${park.image}`}
            className="w-full h-full object-cover"
            scale={1.05}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/parking')}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-floating hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title */}
        <motion.div
          className="absolute bottom-12 left-6 right-6 z-20 flex flex-col items-start gap-3"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {isPaid !== null && (
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-white shadow-card ${isPaid ? 'bg-rose-500/90' : 'bg-emerald-500/90'} `}>
              {isPaid ? <IoWarningOutline className="text-sm" /> : <IoCheckmarkCircle className="text-sm" />}
              {isPaid ? 'Jelenleg Fizetős' : 'Jelenleg Ingyenes'}
            </span>
          )}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-tight leading-none max-w-4xl">
            {park.name}
          </h1>
        </motion.div>
      </div>

      {/* --- CONTENT SHEET --- */}
      <div className="relative -mt-8 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp duration={1}>
          <div className="
              bg-surface-card dark:bg-surface-card-dark
              backdrop-blur-md
              rounded-card
              border border-slate-200/80 dark:border-white/10
              shadow-card
              p-6 sm:p-10
              min-h-[50vh]
          ">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT COLUMN: Map & Zones */}
              <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">

                {/* Map Section */}
                <FadeUp delay={0.2}>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
                    <IoMapOutline className="text-gold-text dark:text-gold-light" />
                    Térkép
                    <button
                      onClick={handleLocateMe}
                      className="ml-auto text-xs font-semibold bg-gold/15 text-gold-text dark:text-gold-light px-3 py-1.5 rounded-control border border-gold/30 hover:bg-brand hover:text-gold-light transition-colors"
                    >
                      Hol vagyok?
                    </button>
                  </h2>

                  <div className="h-80 w-full rounded-card overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-card relative z-0">
                    {park.coords && zone ? (
                      <MapContainer
                        center={[park.coords.lat, park.coords.lng]}
                        zoom={16}
                        scrollWheelZoom={true}
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
                                <strong className="block mb-1 text-zinc-600">Parkolóautomata</strong>
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-2">Érintett Utcák</p>
                    <div className="flex flex-wrap gap-2">
                      {park.zones.map((zone, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-xs font-semibold border border-slate-200/60 dark:border-white/5">
                          {zone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar */}
              <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">

                {/* Info Grid */}
                <FadeUp delay={0.1}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-control border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1.5">
                      <IoCarSportOutline className="text-2xl text-gold-text dark:text-gold-light" />
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{park.capacity || 'N/A'}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Kapacitás</span>
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-control border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1.5">
                      <IoWalletOutline className="text-2xl text-gold-text dark:text-gold-light" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{park.price || 'Ingyenes'}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ár / Óra</span>
                      </div>
                    </div>
                  </div>
                </FadeUp>

                {/* Details Card */}
                <FadeUp delay={0.2}>
                  <div className="bg-slate-100 dark:bg-white/5 rounded-control p-6 border border-slate-200/60 dark:border-white/5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <IoTimeOutline className="text-gold-text dark:text-gold-light" />
                      Részletek
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Időszak</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{park.hours}</span>
                      </div>
                      <div className="w-full h-px bg-slate-200 dark:bg-white/10" />
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Fizetés</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{park.payment && park.payment.join(', ')}</span>
                      </div>
                      <div className="w-full h-px bg-slate-200 dark:bg-white/10" />
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Cím</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">{park.address}</span>
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
                      className="w-full bg-brand text-gold-light p-4 rounded-control flex items-center justify-center gap-3 transition-opacity hover:opacity-90 group shadow-card border border-gold/30"
                    >
                      <IoNavigateOutline className="text-xl group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-base">Odaút Tervezése</span>
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
