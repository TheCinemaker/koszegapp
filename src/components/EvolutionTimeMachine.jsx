import React, { useState, useEffect } from 'react';
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
    liveUrl: '/tm/v1/',
    name: 'A Kezdetek (v1.0)',
    themeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    headerBg: 'bg-slate-800 text-slate-200 border-b border-slate-700',
    appBg: 'bg-slate-900 text-slate-300 font-sans',
    title: 'Egyszerű Statikus Füzet',
    desc: 'Legelső Git commit (#4fab1cd). 4-5 statikus füzetoldal (Látnivalók, Események), beégetett adatokkal, minimális szürkés elrendezéssel.',
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
    date: '2025. Szeptember 29.',
    gitCommit: '#21c4b2e',
    liveUrl: '/tm/v2/',
    name: 'Az Első Okostérkép & Kőszeg Game 1.0 (v2.0)',
    themeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    headerBg: 'bg-cyan-900 text-white border-b border-cyan-700',
    appBg: 'bg-slate-900 text-slate-200',
    title: 'Interaktív Térkép & Kincskereső Motor',
    desc: 'Megérkezett a Leaflet-alapú vektoros térkép az első gombostűs jelölőkkel, valamint a Kőszeg Game AR Kincskereső első pergamen motorja (#ed29cac).',
    features: ['Leaflet vektoros okostérkép', 'Kőszeg Game AR Kincskereső (v1.0)', 'Parkolási zónák térképes nézete', 'Alapszintű OpenWeather widget'],
    missing: ['Nincs Ráduly L. helyi mérés', 'Nincs Kioszk üzemmód', 'Nincs Digitális Jegy', 'Nincs QR pincér'],
    stats: { pages: '12 oldal', tech: 'Leaflet + OpenWeather + useGame', modules: '2 modul' },
    mockup: {
      type: 'v2',
      items: [
        { name: '🗺️ Leaflet Okostérkép', desc: 'Interaktív gombostűk Kőszeg térképén' },
        { name: '📜 Kőszeg Game AR Kincskereső', desc: 'Történelmi pergamen feladványok' },
        { name: '📅 Városi Eseménynaptár', desc: 'Frissített szűrhető programlista' },
      ],
    }
  },
  {
    id: 'v3',
    version: 'v3.0.0',
    date: '2026. Február 27.',
    gitCommit: '#4a87b32',
    liveUrl: '/tm/v3/',
    name: 'Sötét Mód, Kőszeg Eats & Wallet (v3.0)',
    themeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    headerBg: 'bg-purple-950 text-purple-200 border-b border-purple-800',
    appBg: 'bg-[#0f172a] text-purple-100',
    title: 'Dark Mode, QR-Pincér & Google Wallet',
    desc: 'Megjelent az Apple-stílusú sötét mód (Dark Mode), a Kőszeg Eats éttermi QR-pincér rendelő (#e593237) és a Google/Apple Wallet (.pkpass) kártyaintegráció (#4234194).',
    features: ['Automatikus Sötét / Világos mód', '🍔 Kőszeg Eats QR-pincér rendelés', '💳 Google/Apple Wallet (.pkpass)', 'Fesztivál visszaszámláló modulok'],
    missing: ['Nincs Ráduly L. mérés (júniusban jött!)', 'Nincs recepciós Kioszk', 'Nincs TheTicket szkenner'],
    stats: { pages: '20 oldal', tech: 'Framer Motion + Wallet Service', modules: '3 modul' },
    mockup: {
      type: 'v3',
      items: [
        { name: '🌙 Dark Mode Váltó', desc: 'Subpixel éles Apple típusú felületek' },
        { name: '🍔 Kőszeg Eats QR Pincér', desc: 'Asztali megrendelés & kiszállítás' },
        { name: '💳 CityPass Wallet (.pkpass)', desc: 'Digitális kártya mentése Apple/Google tárcába' },
      ],
    }
  },
  {
    id: 'v4',
    version: 'v4.0.0',
    date: '2026. Június 18.',
    gitCommit: '#4385534',
    liveUrl: '/tm/v4/',
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
    liveUrl: '/',
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

function EraLiveContent({ era }) {
  if (era.id === 'v1') {
    return (
      <div className="space-y-3 font-sans text-slate-300">
        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
          <div className="font-extrabold text-amber-400 mb-1">🏰 Jurisics Vár (Statikus Adatlap)</div>
          <div className="text-[11px] text-slate-400">Történelmi váregyüttes Kőszeg belvárosában. Nyitvatartás: 9:00 - 17:00. Statikus bejegyzés.</div>
        </div>
        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
          <div className="font-extrabold text-amber-400 mb-1">🌲 Óház Kilátó</div>
          <div className="text-[11px] text-slate-400">Túrapont a Kőszegi-hegységben. Magasság: 607 m.</div>
        </div>
        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
          <div className="font-extrabold text-amber-400 mb-1">🅿️ Parkoló Zónák (Statikus Kép)</div>
          <div className="text-[10px] text-slate-400 italic">Beágyazott JPG képmegjelenítés a parkolási díjakról.</div>
        </div>
        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 text-center">
          ⚠️ v1.0 (2025.07.17): Minimális szürkés elrendezés. Nincs térkép, nincs időjárás, nincs animáció.
        </div>
      </div>
    );
  }

  if (era.id === 'v2') {
    return (
      <div className="space-y-3 text-slate-200">
        <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs">
          <div className="flex items-center justify-between font-bold text-cyan-300 mb-1">
            <span>🗺️ Leaflet Okostérkép v2.0</span>
            <span className="text-[9px] bg-cyan-500/20 px-1.5 py-0.5 rounded">Gombostűk</span>
          </div>
          <div className="h-20 bg-slate-950 rounded-lg border border-cyan-800/40 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:8px_8px]" />
            <div className="text-[10px] text-cyan-400 flex items-center gap-1">📍 Jurisics Vár (47.389°N, 16.541°E)</div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
          <div className="font-extrabold text-amber-400 mb-1">📜 Kőszeg Game (AR Kincskereső v1.0)</div>
          <div className="text-[10px] text-amber-200/80">Fejtsd meg a vár rejtélyét! Pergamen stílusú városi játék.</div>
        </div>
      </div>
    );
  }

  if (era.id === 'v3') {
    return (
      <div className="space-y-3 text-purple-100">
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs flex items-center justify-between">
          <span className="font-bold">🌙 Dark Mode Élesítve</span>
          <span className="text-[10px] font-mono text-purple-300">Apple Glass UI</span>
        </div>
        <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-400/30 text-xs">
          <div className="font-bold text-purple-200 mb-1">🍔 Kőszeg Eats QR Pincér Modul</div>
          <div className="text-[10px] opacity-80">Asztali megrendelés, éttermi étlap és kiszállítás nyomonkövetés.</div>
        </div>
        <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs">
          <div className="font-bold text-indigo-300 mb-1">💳 CityPass Wallet (.pkpass)</div>
          <div className="text-[10px] text-indigo-200/80">Digitális váriskártya mentése Apple & Google Tárcába.</div>
        </div>
      </div>
    );
  }

  if (era.id === 'v4') {
    return (
      <div className="space-y-3 text-emerald-100">
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs">
          <div className="font-extrabold text-emerald-300 mb-1 flex items-center justify-between">
            <span>🌤️ Ráduly László & kiemet.hu</span>
            <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">2026.06.18</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
            <div className="bg-black/40 p-1.5 rounded border border-emerald-500/20">
              <div className="text-[9px] text-emerald-400">Hőmérséklet</div>
              <div className="font-extrabold text-xs text-white">21.4 °C</div>
            </div>
            <div className="bg-black/40 p-1.5 rounded border border-emerald-500/20">
              <div className="text-[9px] text-emerald-400">Páratartalom</div>
              <div className="font-extrabold text-xs text-white">68 %</div>
            </div>
            <div className="bg-black/40 p-1.5 rounded border border-emerald-500/20">
              <div className="text-[9px] text-emerald-400">Széllökés</div>
              <div className="font-extrabold text-xs text-white">12 km/h</div>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/30 text-xs">
          <div className="font-bold text-teal-300">🏨 Recepciós B2B Kioszk (/buy-pass)</div>
          <div className="text-[10px] opacity-80 mt-0.5">Hotel tabletekre szánt 10 mp-es váriskártya vásárlás.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-white">
      <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs">
        <div className="flex items-center justify-between font-black text-indigo-300 mb-1">
          <span>🚀 Smart City SuperApp (v5.0)</span>
          <span className="text-[9px] bg-indigo-500/30 px-2 py-0.5 rounded-full font-bold">35+ Modul</span>
        </div>
        <div className="text-[10px] text-slate-300">
          TheTicket Wallet jegyszkenner, Kőszeg Eats QR pincér, Nyitott Porta Napok 14 POI Google térképpel és Gigaluxus Bento Grid UI.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center font-bold text-indigo-300">
          🎫 Ticket Wallet (.pkpass)
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center font-bold text-indigo-300">
          🍷 QR Pincér & Rendelés
        </div>
      </div>
    </div>
  );
}

// Valódi, lebuildelt régi verziók iframe-ben. A /tm/vN/ alatti buildek a
// tényleges régi commitokból készültek (git worktree + vite build --base),
// tehát nem rekonstrukció: ez maga az akkori app fut a telefonkeretben.
function LiveBuildModal({ era, onClose, onPrev, onNext, onSelect }) {
  const [loading, setLoading] = useState(true);

  // A prezenter-kattintó nyíl/space billentyűket küld: ezzel léptethető a demó.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); onPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  // Verzióváltásnál újra töltődik az iframe → újra kell a betöltés-jelző.
  useEffect(() => { setLoading(true); }, [era.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Fejléc: melyik commit fut éppen */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Valódi build · git {era.gitCommit}
          </div>
          <h3 className="text-base sm:text-2xl font-black text-white truncate">{era.name}</h3>
          <p className="text-[10px] sm:text-xs text-slate-400">{era.date} · {era.stats.tech}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full text-slate-200 font-bold"
        >
          Bezárás ✕
        </button>
      </div>

      {/* Verzióváltó sáv — beszéd közben egy kattintás az ugrás */}
      <div className="w-full max-w-4xl flex gap-1.5 mb-3 shrink-0 overflow-x-auto pb-1">
        {ERAS.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              e.id === era.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {e.version} · {e.date}
          </button>
        ))}
      </div>

      {/* Telefonkeret a valódi régi appal */}
      <div className="relative w-full max-w-[390px] flex-1 min-h-[480px] max-h-[75vh] rounded-[36px] border-[10px] border-slate-800 bg-black shadow-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div className="text-[11px] text-slate-400 font-mono">{era.gitCommit} betöltése…</div>
          </div>
        )}
        <iframe
          key={era.id}
          src={era.liveUrl}
          title={`visitKőszeg ${era.version}`}
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0 bg-white"
        />
      </div>

      {/* Léptetés + vésztartalék: új lapon is megnyitható, ha az iframe akadna */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 mt-3 shrink-0">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200"
        >
          ← Korábbi
        </button>
        <a
          href={era.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] sm:text-xs text-slate-500 hover:text-indigo-400 font-mono underline underline-offset-4"
        >
          megnyitás új lapon
        </a>
        <button
          onClick={onNext}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30"
        >
          Következő →
        </button>
      </div>
    </motion.div>
  );
}

export default function EvolutionTimeMachine() {
  const [activeEraId, setActiveEraId] = useState('v5');
  const [showModal, setShowModal] = useState(false);
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
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1.5"><IoPhonePortraitOutline className="text-indigo-400" /> Mobil Nézet ({activeEra.version})</span>
            <button
              onClick={() => setShowModal(true)}
              className="text-[10px] font-extrabold text-white flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full border border-indigo-400/40 shadow-lg shadow-indigo-600/30"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ▶ Élő build futtatása
            </button>
          </div>

          {/* Simulated Mobile Device Frame */}
          <div className="w-full max-w-[340px] h-[520px] rounded-[40px] border-[8px] border-slate-800 bg-black shadow-2xl overflow-hidden relative flex flex-col justify-between">

            {/* Phone Top Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
            </div>

            {/* App Header */}
            <div className={`pt-6 pb-3 px-4 ${activeEra.headerBg} transition-colors duration-500`}>
              <div className="text-[11px] font-black uppercase tracking-widest flex items-center justify-between">
                <span>visitKőszeg</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-black/40 font-mono">{activeEra.version}</span>
              </div>
              <div className="text-[10px] opacity-80 font-medium mt-0.5">{activeEra.date}</div>
            </div>

            {/* App Content Body */}
            <div className={`flex-1 p-4 overflow-y-auto ${activeEra.appBg} transition-colors duration-500`}>
              <div className="text-[11px] font-bold mb-3 border-b border-white/10 pb-1">
                {activeEra.title}
              </div>

              <EraLiveContent era={activeEra} />
            </div>

            {/* Phone Bottom Bar */}
            <div className="py-2.5 px-4 bg-slate-900 border-t border-white/10 flex justify-around text-slate-400 text-xs">
              <IoMapOutline className={activeEra.id !== 'v1' ? 'text-indigo-400' : 'opacity-30'} />
              <IoTicketOutline className={activeEra.id === 'v5' || activeEra.id === 'v3' ? 'text-indigo-400' : 'opacity-30'} />
              <IoRestaurantOutline className={activeEra.id === 'v5' || activeEra.id === 'v3' ? 'text-indigo-400' : 'opacity-30'} />
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
            <span>Tárgyalási tipp: Nyomj a gombokra az evolúció bemutatásához!</span>
            <IoSparkles className="text-indigo-400 shrink-0 text-base" />
          </div>
        </div>

      </div>

      {/* FULL-SCREEN ÉLŐ BUILD MODAL — a valódi régi commitok futnak benne */}
      <AnimatePresence>
        {showModal && (
          <LiveBuildModal
            era={activeEra}
            onClose={() => setShowModal(false)}
            onSelect={setActiveEraId}
            onPrev={() => {
              const i = ERAS.findIndex(e => e.id === activeEraId);
              setActiveEraId(ERAS[(i - 1 + ERAS.length) % ERAS.length].id);
            }}
            onNext={() => {
              const i = ERAS.findIndex(e => e.id === activeEraId);
              setActiveEraId(ERAS[(i + 1) % ERAS.length].id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

