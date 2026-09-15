import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTimeOutline, IoSparkles, IoCheckmarkCircle, IoAlertCircleOutline, IoRocketOutline, IoCalendarOutline, IoLocationOutline, IoQrCodeOutline, IoTicketOutline } from 'react-icons/io5';

const MILESTONES = [
  {
    date: '2025. Július 17.',
    version: 'v1.0.0',
    title: 'Az Első Szárnypróbálgatások',
    desc: 'Első commit a Git-ben (#4fab1cd). Mindössze 5-6 statikus füzetoldal (Látnivalók, Események), beégetett szövegekkel és egyszerű képekkel.',
    badge: 'Statikus Katalógus',
    active: false,
  },
  {
    date: '2025. Ősz',
    version: 'v3.0.0',
    title: 'Élő Okostérkép & Időjárás',
    desc: 'Megérkezett a Leaflet-alapú vektoros okostérkép, a parkolási zónák és Ráduly László / kiemet.hu helyi időjárás-mérései.',
    badge: 'Interaktív Térkép',
    active: false,
  },
  {
    date: '2026. Tavasz',
    version: 'v4.0.0',
    title: 'Szállodai Kioszk & Partneri Adatbekérő',
    desc: 'Elkészült a recepciós Kioszk felület (/buy-pass) és a B2B partneri önkitöltő rendszer (/adatbekero).',
    badge: 'B2B & Kioszk',
    active: false,
  },
  {
    date: '2026. Szeptember (Ma)',
    version: 'v5.0.0',
    title: 'A Smart City SuperApp Ökoszisztéma',
    desc: '35+ aloldal, Wallet (.pkpass) jegymotor, Kőszeg Eats QR-pincér, AR kincskereső és Gigaluxus Bento UI.',
    badge: '100% SuperApp',
    active: true,
  },
];

export default function EvolutionTimeMachine() {
  const [selectedEra, setSelectedEra] = useState('v5'); // 'v1' or 'v5'

  return (
    <div className="w-full max-w-5xl mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-slate-900/90 text-white border border-white/10 shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold uppercase tracking-widest mb-3">
          <IoTimeOutline className="w-4 h-4" /> KőszegApp Időgép & Evolúció
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Honnan hova jutottunk? <span className="text-indigo-400">(2025 ➔ 2026)</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Tapasztald meg interaktívan, hogyan vált az 1 évvel ezelőtti egyszerű digitális füzet Kőszeg városának kiterjedt SuperApp ökoszisztémájává!
        </p>
      </div>

      {/* Interactive Era Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setSelectedEra('v1')}
            className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              selectedEra === 'v1'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IoCalendarOutline className="w-4 h-4" /> 📜 2025. Július 17. (v1.0 Kezdetek)
          </button>
          <button
            onClick={() => setSelectedEra('v5')}
            className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              selectedEra === 'v5'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IoRocketOutline className="w-4 h-4" /> 🚀 2026. Szeptember (v5.0 SuperApp Ma)
          </button>
        </div>
      </div>

      {/* Simulated Live View Comparison */}
      <AnimatePresence mode="wait">
        {selectedEra === 'v1' ? (
          <motion.div
            key="v1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-slate-950 p-6 border border-amber-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono text-xs text-amber-400 font-bold">
                  [RETRÓ VIZUÁL] KőszegAPP 2.0 dev (2025.07.17. - Git #4fab1cd)
                </span>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-semibold border border-amber-500/30">
                Statikus Katalógus Nézet
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-slate-300 text-sm mb-1">🏰 Jurisics Vár</h4>
                  <p className="text-xs text-slate-500">Statikus leírás és nyitvatartás PDF-ből átmásolva.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-slate-300 text-sm mb-1">🌲 Óház Kilátó</h4>
                  <p className="text-xs text-slate-500">Kézi cím és információk, nincs navigáció.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-slate-300 text-sm mb-1">🅿️ Parkoló Információ</h4>
                  <p className="text-xs text-slate-500">Egyetlen beágyazott JPG képernyőkép a zónákról.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2">Korlátok 2025-ben:</h5>
                  <ul className="text-xs text-slate-400 space-y-2">
                    <li className="flex items-center gap-1.5"><IoAlertCircleOutline className="text-amber-400 shrink-0" /> Nincs KőszegPass Kioszk</li>
                    <li className="flex items-center gap-1.5"><IoAlertCircleOutline className="text-amber-400 shrink-0" /> Nincs Wallet (.pkpass) jegy</li>
                    <li className="flex items-center gap-1.5"><IoAlertCircleOutline className="text-amber-400 shrink-0" /> Nincs Kőszeg Eats QR Pincér</li>
                    <li className="flex items-center gap-1.5"><IoAlertCircleOutline className="text-amber-400 shrink-0" /> Nincs Partner /adatbekero</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/20 text-center">
                  <span className="text-xs text-amber-300 font-extrabold">Összesen: 5 Statikus Oldal</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="v5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-slate-950 p-6 border border-indigo-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-indigo-300 font-bold">
                  [MAI ÉLES FELÜLET] visitKőszeg v5.0 SuperApp Ökoszisztéma (2026.09.15.)
                </span>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-semibold border border-indigo-500/30">
                100% Okosváros Ökoszisztéma
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                    <IoLocationOutline /> Élő Leaflet Okostérkép
                  </div>
                  <p className="text-[11px] text-slate-300">Parkolási zónák, automaták és élő geolokáció.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                    <IoTicketOutline /> Wallet (.pkpass) Jegyek
                  </div>
                  <p className="text-[11px] text-slate-300">Apple/Google Wallet 0.2mp jegyek & szkenner.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                    <IoQrCodeOutline /> Kőszeg Eats & QR Pincér
                  </div>
                  <p className="text-[11px] text-slate-300">Asztali QR rendelés & nyomtatós konyhai admin.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                    <IoSparkles /> Recepciós Kioszk & Adatbekérő
                  </div>
                  <p className="text-[11px] text-slate-300">/buy-pass szállodai tablet & /adatbekero B2B.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-indigo-300 text-xs uppercase tracking-wider mb-2">Mai Eredmények:</h5>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-1.5"><IoCheckmarkCircle className="text-emerald-400 shrink-0" /> 35+ Elérhető Aloldal</li>
                    <li className="flex items-center gap-1.5"><IoCheckmarkCircle className="text-emerald-400 shrink-0" /> Ráduly L. & kiemet.hu időjárás</li>
                    <li className="flex items-center gap-1.5"><IoCheckmarkCircle className="text-emerald-400 shrink-0" /> 100% Zero Waste papírmentes</li>
                    <li className="flex items-center gap-1.5"><IoCheckmarkCircle className="text-emerald-400 shrink-0" /> 24/7 Elérhetőség natív PWA-ként</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-500/30 text-center">
                  <span className="text-xs text-indigo-300 font-extrabold">35+ Aloldalas SuperApp</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Milestones */}
      <div className="mt-10 pt-6 border-t border-white/10">
        <h4 className="text-center font-extrabold text-sm uppercase tracking-widest text-slate-400 mb-6">
          A Fejlesztési Mérföldkövek Íve (2025-2026)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MILESTONES.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                m.active
                  ? 'bg-indigo-950/50 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400">{m.date}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    m.active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.version}
                </span>
              </div>
              <h5 className="font-bold text-sm text-white mb-1">{m.title}</h5>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
