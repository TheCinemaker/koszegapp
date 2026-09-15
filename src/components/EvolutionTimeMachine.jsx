import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoTimeOutline,
  IoCalendarOutline,
  IoRocketOutline,
  IoCheckmarkCircle,
  IoAlertCircleOutline,
  IoPhonePortraitOutline,
  IoMapOutline,
  IoTicketOutline,
  IoRestaurantOutline,
  IoSparkles
} from 'react-icons/io5';

const ERAS = [
  {
    id: 'v1',
    version: 'v1.0.0',
    date: '2025. Július 17.',
    gitCommit: '#4fab1cd',
    name: 'A Kezdetek (v1.0)',
    themeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    headerBg: 'bg-slate-800 text-slate-200 border-b border-slate-700',
    appBg: 'bg-slate-900 text-slate-300 font-sans',
    title: 'Egyszerű Statikus Füzet',
    desc: 'Első commit a Git-ben. 5-6 statikus füzetoldal (Látnivalók, Események), beégetett adatokkal, minimális szürkés elrendezéssel.',
    features: ['4 Statikus POI adatlap', 'Egyszerű eseménylista', 'Beágyazott JPG parkoló-kép', 'Alapvető HTML/CSS elrendezés'],
    missing: ['Nincs Okostérkép', 'Nincs kiemet.hu Időjárás', 'Nincs KőszegPass Kioszk', 'Nincs Wallet (.pkpass) jegy', 'Nincs Kőszeg Eats', 'Nincs /adatbekero'],
    stats: { pages: '5 oldal', tech: 'React 18 + Tailwind v3', modules: '1 modul' },
    mockup: {
      type: 'v1',
      items: [
        { name: '🏰 Jurisics Vár', desc: 'Történelmi műemlék (Statikus felirat)' },
        { name: '🌲 Óház Kilátó', desc: 'Túrahelyszín a hegyekben' },
        { name: '🅿️ Parkolás', desc: 'Sztatikus JPG kép a zónákról' },
      ],
    }
  },
  {
    id: 'v2',
    version: 'v2.0.0',
    date: '2025. Október',
    gitCommit: '#92d3b7a',
    name: 'Az Első Okostérkép (v2.0)',
    themeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    headerBg: 'bg-cyan-900 text-white border-b border-cyan-700',
    appBg: 'bg-slate-900 text-slate-200',
    title: 'Interaktív Térkép Integráció',
    desc: 'Megérkezett a Leaflet-alapú vektoros térkép az első gombostűs jelölőkkel és a geolokáció alapszintű kezelésével.',
    features: ['Leaflet vektoros okostérkép', 'Jelölők a látnivalóknál', 'Parkolási zónák térképes nézete', 'Alapszintű OpenWeather widget'],
    missing: ['Nincs Ráduly L. helyi mérés', 'Nincs Kioszk üzemmód', 'Nincs Digitális Jegy', 'Nincs QR pincér'],
    stats: { pages: '12 oldal', tech: 'Leaflet + OpenWeather', modules: '2 modul' },
    mockup: {
      type: 'v2',
      items: [
        { name: '🗺️ Leaflet Okostérkép', desc: 'Interaktív gombostűk Kőszeg térképén' },
        { name: '📅 Városi Eseménynaptár', desc: 'Frissített szűrhető programlista' },
      ],
    }
  },
  {
    id: 'v3',
    version: 'v3.0.0',
    date: '2026. Január',
    gitCommit: '#fe0518f',
    name: 'Sötét Mód & Fesztiválok (v3.0)',
    themeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    headerBg: 'bg-purple-950 text-purple-200 border-b border-purple-800',
    appBg: 'bg-[#0f172a] text-purple-100',
    title: 'Apple-stílusú Sötét Mód & Visszaszámlálók',
    desc: 'Megjelent a sötét mód (Dark Mode), az Ostromnapok és Kőszegi Szüret visszaszámláló kártyái.',
    features: ['Automatikus Sötét / Világos mód', 'Fesztivál visszaszámláló modulok', 'Kedvencek mentése (Favorites)', 'Finomított kártyás elrendezés'],
    missing: ['Nincs Ráduly L. mérés (júniusban jött!)', 'Nincs recepciós Kioszk', 'Nincs Wallet támogatás'],
    stats: { pages: '20 oldal', tech: 'Framer Motion + DarkModeContext', modules: '3 modul' },
    mockup: {
      type: 'v3',
      items: [
        { name: '🌙 Dark Mode Váltó', desc: 'Subpixel éles Apple típusú felületek' },
        { name: '⏳ Ostromnapok Visszaszámláló', desc: 'Élő visszaszámláló kártyák' },
      ],
    }
  },
  {
    id: 'v4',
    version: 'v4.0.0',
    date: '2026. Június 18.',
    gitCommit: '#8dc5f90',
    name: 'Helyi Időjárás & Kioszk (v4.0)',
    themeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    headerBg: 'bg-emerald-950 text-emerald-200 border-b border-emerald-800',
    appBg: 'bg-[#061814] text-emerald-100',
    title: 'Ráduly László / kiemet.hu & B2B Kioszk',
    desc: 'Git commit #8dc5f90 (2026.06.18.): Beépítésre került a Ráduly László és kiemet.hu kőszegi állomás alapú időjárás dashboardja, valamint a recepciós Kioszk (/buy-pass).',
    features: ['🌤️ Ráduly László & kiemet.hu mérések', '/buy-pass Recepciós Kioszk tabletek', '/adatbekero B2B partneri űrlap', 'KőszegPass digitális kártyaigénylés'],
    missing: ['Nincs QR pincér rendelő', 'Nincs AR kincskereső', 'Nincs AI chatbot élesben'],
    stats: { pages: '28 oldal', tech: 'SmartMixin API + Netlify Edge', modules: '4 modul' },
    mockup: {
      type: 'v4',
      items: [
        { name: '🌤️ Ráduly László & kiemet.hu', desc: 'Pontos kőszegi helyi időjárás (Jun 18)' },
        { name: '🏨 /buy-pass Kioszk', desc: '10 mp-es digitális váriskártya recepciós tableten' },
        { name: '📝 /adatbekero Form', desc: 'Vállalkozói önkiszolgáló adatfrissítő' },
      ],
    }
  },
  {
    id: 'v5',
    version: 'v5.0.0',
    date: '2026. Szeptember (Ma)',
    gitCommit: '#7e30273',
    name: 'Smart City SuperApp (v5.0)',
    themeColor: 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300 font-extrabold shadow-lg shadow-indigo-500/30',
    headerBg: 'bg-[#0b2740] text-white border-b border-indigo-500/30',
    appBg: 'bg-[#030303] text-white',
    title: 'Teljes SuperApp Ökoszisztéma',
    desc: '35+ aloldalas Gigaluxus Bento-Grid ökoszisztéma: TheTicket Wallet (.pkpass) jegymotor szkennerrel, Kőszeg Eats QR-pincér, AR kincskereső és belső tesztüzemű KőszegAI.',
    features: ['35+ Elérhető Aloldal & B2B Modul', 'TheTicket Wallet (.pkpass) & Beléptető Szkenner', 'Kőszeg Eats & QR-Pincér platform', 'Kőszeg Game AR Kincskereső', 'Apple-level Bento Grid UI/UX'],
    missing: [],
    stats: { pages: '35+ oldal', tech: 'SuperApp Edge Stack (v5.0)', modules: 'Minden Modul Éles' },
    mockup: {
      type: 'v5',
      items: [
        { name: '🎫 Wallet (.pkpass) Jegyek', desc: '0.2 mp vásárlás & kapus szkenner' },
        { name: '🍷 Kőszeg Eats QR Pincér', desc: 'Asztali megrendelő & konyhai nyomtatás' },
        { name: '🌤️ Ráduly László & kiemet.hu', desc: 'Élő helyi időjárás dashboard' },
        { name: '💎 AR Kincskereső Játék', desc: 'Tartózkodási időt növelő gamifikáció' },
      ],
    }
  }
];

export default function EvolutionTimeMachine() {
  const [activeEraId, setActiveEraId] = useState('v5');
  const activeEra = ERAS.find(e => e.id === activeEraId) || ERAS[ERAS.length - 1];

  return (
    <div className="w-full max-w-6xl mx-auto my-6 p-4 sm:p-8 rounded-3xl bg-slate-950 text-white border border-white/10 shadow-2xl backdrop-blur-2xl">
      {/* Top Title Bar */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold uppercase tracking-widest mb-3">
          <IoTimeOutline className="w-4 h-4" /> visitKőszeg Verzió-Időgép (2025 ➔ 2026)
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          Az App Szoftver-Evolúciója
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Kattints az 5 kiemelt mérföldkőre, és nézd meg élőben a Git commit történet alapján, hogyan alakult a kezelőfelület az elmúlt 14 hónap során!
        </p>
      </div>

      {/* ERA SELECTOR TABS (5 Versions) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 p-2 rounded-2xl bg-black/60 border border-white/10">
        {ERAS.map((era) => {
          const isSelected = era.id === activeEraId;
          return (
            <button
              key={era.id}
              onClick={() => setActiveEraId(era.id)}
              className={`p-3 rounded-xl transition-all duration-300 text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-[1.03] z-10'
                  : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{era.version}</span>
                {isSelected && <IoCheckmarkCircle className="text-white text-xs" />}
              </div>
              <div className="font-bold text-xs truncate">{era.name}</div>
              <div className="text-[10px] opacity-70 mt-1">{era.date}</div>
            </button>
          );
        })}
      </div>

      {/* MAIN COMPARISON SCREEN (Device Canvas + Inventory Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: SIMULATED PHONE VIEWPORT CANVAS */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
            <IoPhonePortraitOutline className="text-indigo-400" /> Szimulált Mobil Kijelző ({activeEra.version})
          </div>

          {/* Simulated Mobile Device Frame */}
          <div className="w-full max-w-[340px] h-[520px] rounded-[40px] border-[8px] border-slate-800 bg-black shadow-2xl overflow-hidden relative flex flex-col justify-between">

            {/* Simulated Phone Top Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
            </div>

            {/* Simulated App Header */}
            <div className={`pt-6 pb-3 px-4 ${activeEra.headerBg} transition-colors duration-500`}>
              <div className="text-[11px] font-black uppercase tracking-widest flex items-center justify-between">
                <span>visitKőszeg</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-black/40 font-mono">{activeEra.version}</span>
              </div>
              <div className="text-[10px] opacity-80 font-medium mt-0.5">{activeEra.date}</div>
            </div>

            {/* Simulated App Content Body */}
            <div className={`flex-1 p-4 overflow-y-auto ${activeEra.appBg} transition-colors duration-500`}>
              <div className="text-[11px] font-bold mb-3 border-b border-white/10 pb-1">
                {activeEra.title}
              </div>

              <div className="space-y-2.5">
                {activeEra.mockup.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-xl bg-white/[0.07] border border-white/10 text-left"
                  >
                    <div className="text-xs font-extrabold">{item.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                  </motion.div>
                ))}
              </div>

              {activeEra.id === 'v1' && (
                <div className="mt-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 text-center">
                  ⚠️ 2025 Július: Statikus felület helyi időjárási adatok nélkül.
                </div>
              )}

              {activeEra.id === 'v4' && (
                <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 text-center">
                  🌤️ 2026 Június 18. (Git #8dc5f90): Ráduly László & kiemet.hu helyi időjárás beépítve!
                </div>
              )}

              {activeEra.id === 'v5' && (
                <div className="mt-4 p-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 text-center font-bold">
                  🚀 2026 Szeptember: Teljes 35+ aloldalas SuperApp Ökoszisztéma!
                </div>
              )}
            </div>

            {/* Simulated Phone Bottom Bar */}
            <div className="py-2.5 px-4 bg-slate-900 border-t border-white/10 flex justify-around text-slate-400 text-xs">
              <IoMapOutline className={activeEra.id !== 'v1' ? 'text-indigo-400' : 'opacity-30'} />
              <IoTicketOutline className={activeEra.id === 'v5' ? 'text-indigo-400' : 'opacity-30'} />
              <IoRestaurantOutline className={activeEra.id === 'v5' ? 'text-indigo-400' : 'opacity-30'} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED ERA INVENTORY & BREAKDOWN */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border ${activeEra.themeColor}`}>
                Git Commit: {activeEra.gitCommit}
              </span>
              <span className="text-xs text-slate-400 font-bold">{activeEra.date}</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2">{activeEra.name}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              {activeEra.desc}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 text-center text-xs mb-4">
              <div>
                <div className="text-slate-500 text-[10px]">Terjedelem</div>
                <div className="font-extrabold text-indigo-300">{activeEra.stats.pages}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Technológia</div>
                <div className="font-extrabold text-indigo-300 truncate">{activeEra.stats.tech}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Státusz</div>
                <div className="font-extrabold text-indigo-300 truncate">{activeEra.stats.modules}</div>
              </div>
            </div>

            {/* Included Features */}
            <div className="mb-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <IoCheckmarkCircle /> Beépített Funkciók ({activeEra.version}):
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-200">
                {activeEra.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Features in this Era */}
            {activeEra.missing.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <IoAlertCircleOutline /> Ebben a verzióban még hiányzott:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-400">
                  {activeEra.missing.map((m, i) => (
                    <li key={i} className="flex items-center gap-1.5 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5 opacity-70">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
            <span>Tárgyalási tipp: Kattints a gombokra az evolúció látványos bemutatásához!</span>
            <IoSparkles className="text-indigo-400 shrink-0 text-base" />
          </div>
        </div>

      </div>
    </div>
  );
}
