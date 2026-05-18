// src/pages/Kiosk/KioskParking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { IoCarSportOutline, IoLocationOutline, IoWalkOutline, IoCardOutline, IoTimeOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchParkingZones, fetchParkingMachines } from '../../api';
import { getDistance, formatDistance } from './KioskAttractions';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

export default function KioskParking() {
  const [zones, setZones] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchParkingZones(), fetchParkingMachines()])
      .then(([zonesData, machinesData]) => {
        if (isMounted) {
          setZones(zonesData || []);
          setMachines(machinesData || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load parking data in Kiosk:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Compute distances for parking machines and sort by proximity
  const sortedMachines = useMemo(() => {
    return (machines || [])
      .map(m => {
        // Machines might have coords: { lat, lng } or direct lat/lng
        const mLat = m.coords?.lat || m.lat;
        const mLng = m.coords?.lng || m.lng;
        const dist = getDistance(KIOSK_LAT, KIOSK_LNG, mLat, mLng);
        return { ...m, _distance: dist };
      })
      .sort((a, b) => a._distance - b._distance);
  }, [machines]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-8 select-none animate-fadeIn">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoCarSportOutline className="text-sm" />
            Parkolási Tájékoztató
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            Parkolási Rend Kőszegen
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            Ismerje meg a városi parkolási zónákat, díjakat, és keresse meg a legközelebbi fizetőautomatát.
          </p>
        </div>

        {/* Zones Presentation */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none uppercase">
            Parkolási Zónák & Árak
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Zone 1 / A (Red) */}
            <div className="rounded-3xl p-6 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/15 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black tracking-wider uppercase">
                  Kiemelt / Piros Zóna
                </span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">400 Ft/óra</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 text-xs font-semibold leading-relaxed">
                Kőszeg közvetlen belvárosi magja, történelmi utcái és a Vár környéki parkolók.
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-rose-500/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="text-xs text-rose-500" />
                  <span>Díjköteles: H-P 8:00 - 18:00, Szo 8:00 - 12:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <IoCardOutline className="text-xs text-rose-500" />
                  <span>Készpénz, Bankkártya, Mobil SMS fizetés</span>
                </div>
              </div>
            </div>

            {/* Zone 2 / B (Yellow) */}
            <div className="rounded-3xl p-6 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/15 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-black tracking-wider uppercase">
                  Normál / Sárga Zóna
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-500 font-mono">240 Ft/óra</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 text-xs font-semibold leading-relaxed">
                Belváros peremén elhelyezkedő parkolók, utcák (pl. Várkör távolabbi szakaszai).
              </p>
              <div className="flex flex-col gap-2 pt-2 border-t border-amber-500/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="text-xs text-amber-500" />
                  <span>Díjköteles: H-P 8:00 - 18:00, Szo 8:00 - 12:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <IoCardOutline className="text-xs text-amber-500" />
                  <span>Készpénz, Mobil SMS fizetés</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Closest Automatons */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none uppercase">
            Legközelebbi fizetőautomaták
          </h3>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-zinc-400 text-sm font-semibold animate-pulse">
                Automaták betöltése...
              </div>
            ) : sortedMachines.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-semibold">
                Nincsenek elérhető automata adatok.
              </div>
            ) : (
              sortedMachines.slice(0, 4).map((mach, idx) => (
                <div
                  key={mach.id || idx}
                  className="
                    rounded-2xl p-4 bg-white/80 dark:bg-zinc-900/60
                    backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/80
                    shadow-sm flex items-center justify-between gap-4
                  "
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white leading-none">
                      {mach.name || `${idx + 1}. számú automata`}
                    </h4>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                      <IoLocationOutline className="text-xs text-indigo-500 dark:text-indigo-400" />
                      {mach.address || 'Kőszeg Belváros'}
                    </span>
                  </div>

                  <span className="shrink-0 flex items-center gap-0.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                    <IoWalkOutline className="text-sm" />
                    {formatDistance(mach._distance)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
