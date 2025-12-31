// src/components/LiveCityMap.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { parseISO, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, format } from 'date-fns';
import { FaFilter, FaLayerGroup, FaLocationArrow, FaPlus, FaMinus, FaGlobe, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaWalking, FaUtensils, FaTimes, FaCog, FaArrowLeft } from 'react-icons/fa';

// --- STYLUS MARKEREK (Gigatrendy CSS) ---
// HTML stringként definiáljuk őket a Leaflet DivIcon-hoz

const createMarkerHtml = (color, iconSvg, isPulsing = false) => `
  <div class="relative flex items-center justify-center w-10 h-10 transition-transform duration-300 transform hover:scale-110">
    ${isPulsing ? `<div class="absolute w-full h-full rounded-full bg-[${color}] opacity-40 animate-ping"></div>` : ''}
    <div class="relative w-8 h-8 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-white" style="background: ${color};">
      ${iconSvg}
    </div>
    <div class="absolute -bottom-1 w-2 h-2 bg-[${color}] transform rotate-45 border-r border-b border-white"></div>
  </div>
`;

// Egyszerű SVG stringek az ikonokhoz (hogy ne kelljen react-dom/server)
const SVG_EVENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="14" height="14"><path d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"/></svg>`;
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="white" width="14" height="14"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.86 18L195 150.3 51.4 171.5C39.2 173.2 29.2 181.5 25.4 193.1s3.2 24.3 12.3 32.7L142 329.6 116.8 473c-1.8 11.7 2.9 23.6 12.1 30.6s21.6 6.9 31.5 1.5l127.7-67.1 127.7 67.1c9.9 5.3 22.1 5.4 31.5-1.5s14-18.9 12.1-30.6l-25.2-143.4 104.3-103.8c9.1-8.4 13.9-19.9 10.1-31.5s-13.8-19.9-26-21.7L381.1 150.3 316.9 18z"/></svg>`;
const SVG_WALK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="white" width="14" height="14"><path d="M208 48c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48zm63.4 87.7l-47.5 31.6c-4.4 2.9-8.4 6.4-11.8 10.3l-18 20.8 47.9 124.7c7 18.2 19 33.4 34.6 44l35.8 24.5c16.7 11.4 20.9 34.1 9.5 50.8s-34.1 20.9-50.8 9.5l-35.8-24.5c-29.2-20-51.4-48.3-64.6-82L149.2 284l-14.7 93.3c-1.9 12.1-7.1 23.4-15.1 32.7L67.7 470.6c-13.1 15.3-36.2 17-51.5 3.9s-17-36.2-3.9-51.5l51.5-60.1c.3-.3 .6-.7 .9-1c5.1-5.9 8.5-13.1 9.7-20.9L108 212.5l-19.5-22.5c-15.3-17.7-18.8-42.5-9.1-64.1l32.3-71.9c8.6-19.2 27.8-31.5 48.8-31.5h.1c21.8 0 41.5 13.3 49.7 33.5l14.1 35.1 37.1-24.7c18.3-12.2 43.1-7.3 55.3 11s7.3 43.1-11 55.3z"/></svg>`;
const SVG_FOOD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="14" height="14"><path d="M416 0C400 0 288 32 288 176V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240 32c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 1.6S32 10 32 19.1V160H160V19.1c0-9.1-7.7-16.5-16.6-17.4C135.2 .9 128 7.8 128 16V144H64V16zm96 144V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240c0-35.3-28.7-64-64-64H96c-35.3 0-64 28.7-64 64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V240c0-113.1 84.4-208 192-208V160z"/></svg>`;

const makeCustomIcon = (color, svg, pulsing) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: createMarkerHtml(color, svg, pulsing),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const ICONS = {
  events: makeCustomIcon('#ec4899', SVG_EVENT),
  eventsToday: makeCustomIcon('#f43f5e', SVG_EVENT, true),
  attractions: makeCustomIcon('#3b82f6', SVG_STAR),
  leisure: makeCustomIcon('#10b981', SVG_WALK),
  restaurants: makeCustomIcon('#f59e0b', SVG_FOOD)
};

const userIcon = L.divIcon({
  className: 'leaflet-user-icon',
  html: `<div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse ring-4 ring-blue-500/30"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- Segédfüggvények ---
function normalizeLatLng(obj) { if (!obj || typeof obj.lat !== 'number' || typeof obj.lng !== 'number') { return null; } const out = { lat: obj.lat, lng: obj.lng }; if (obj.label) { out.label = String(obj.label); } return out; }
function pickLocations(item) { if (!item) { return []; } if (Array.isArray(item.locations)) { return item.locations.map(normalizeLatLng).filter(Boolean); } const c = item.coords || item.coordinates || item.coordinate || item.location?.coords || item.location?.coordinates || null; if (c) { const one = normalizeLatLng(c); return one ? [one] : []; } const fb = normalizeLatLng(item); return fb ? [fb] : []; }
function formatEventWhen(e) { const s = e.date ? parseISO(e.date) : null; const ee = e.end_date ? parseISO(e.end_date) : null; if (!s || isNaN(s)) { return e.time ? e.time : 'Időpont később'; } const pad = (n) => String(n).padStart(2, '0'); const d = (dt) => `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`; if (e.time && e.time.trim()) { if (ee && !isNaN(ee) && d(s) !== d(ee)) { return `${d(s)} – ${d(ee)} • ${e.time}`; } return `${d(s)} • ${e.time}`; } if (ee && !isNaN(ee) && d(s) !== d(ee)) { return `${d(s)} – ${d(ee)}`; } return d(s); }
function isEventToday(e) {
  const today = new Date();
  const startDate = e.date ? parseISO(e.date) : null;
  if (!startDate || isNaN(startDate)) { return false; }
  const endDateString = e.end_date || e.date;
  const parsedEndDate = parseISO(endDateString);
  const effectiveEndDate = !parsedEndDate || isNaN(parsedEndDate) ? startDate : parsedEndDate;
  const interval = { start: startOfDay(startDate), end: endOfDay(effectiveEndDate) };
  return isWithinInterval(today, interval);
}

const MONTHS_HU = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

// CartoDB Dark Matter beállítása dark mode-hoz, de most használjunk egy szép clean light módot alapból.
const TILE_STYLES = {
  CartoLight: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  CartoDark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  OSM: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OSM' }
};

// --- Custom Zoom Control Component ---
const CustomControls = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[900] flex flex-col gap-3">
      <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/20 flex flex-col gap-2">
        <button onClick={() => map.zoomIn()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-xl transition-colors text-gray-800 shadow-md">
          <FaPlus />
        </button>
        <button onClick={() => map.zoomOut()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-xl transition-colors text-gray-800 shadow-md">
          <FaMinus />
        </button>
      </div>
    </div>
  );
};

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const navigate = useNavigate();
  const center = [47.3896, 16.5402];

  const [tileKey, setTileKey] = useState('CartoLight');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [show, setShow] = useState({ events: true, attractions: true, leisure: true, restaurants: true });
  const [userPos, setUserPos] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // --- Geolocation ---
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => { },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => { try { navigator.geolocation.clearWatch(id); } catch { } };
  }, []);

  // --- Esemény szűrés ---
  const monthlyEvents = useMemo(() => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const futureEvents = (Array.isArray(events) ? events : []).filter(e => {
      const endDateString = e.end_date || e.date;
      const parsedEndDate = parseISO(endDateString);
      if (isNaN(parsedEndDate)) return false;
      return parsedEndDate >= startOfToday;
    });
    const refDateForMonth = new Date(year, month);
    const monthStart = startOfMonth(refDateForMonth);
    const monthEnd = endOfMonth(refDateForMonth);
    return futureEvents.filter((e) => {
      const startDate = e.date ? parseISO(e.date) : null;
      if (!startDate || isNaN(startDate)) return false;
      const endDateString = e.end_date || e.date;
      const parsedEndDate = parseISO(endDateString);
      const effectiveEndDate = !parsedEndDate || isNaN(parsedEndDate) ? startDate : parsedEndDate;
      return startDate <= monthEnd && effectiveEndDate >= monthStart;
    });
  }, [events, year, month]);

  // --- Markerek előkészítése ---
  // ITT JAVÍTJUK A DUPLICATE KEY HIBÁT: Egyedi kompozit kulcsok generálása
  const markers = useMemo(() => {
    // 1. Events grouping
    const eventsByCoord = monthlyEvents.reduce((acc, event) => {
      const locs = pickLocations(event);
      locs.forEach(loc => {
        const key = `${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
        if (!acc[key]) {
          acc[key] = { pos: loc, items: [] };
        }
        acc[key].items.push(event);
      });
      return acc;
    }, {});

    // Convert to array
    const eventMarkers = Object.entries(eventsByCoord).map(([coordKey, group]) => {
      const isTodayGroup = group.items.some(item => isEventToday(item));
      return {
        key: `grp-${coordKey}`,
        pos: group.pos,
        items: group.items,
        today: isTodayGroup,
      };
    });

    // Helper for other categories to ensure unique keys
    const mapItems = (items, prefix) => (Array.isArray(items) ? items : []).flatMap(item =>
      pickLocations(item).map((pos, idx) => ({
        key: `${prefix}-${item.id || 'no-id'}-${pos.lat.toFixed(5)}-${pos.lng.toFixed(5)}-${idx}`, // UNIQUE KEY FIX
        item,
        pos
      }))
    );

    return {
      events: eventMarkers,
      attractions: mapItems(attractions, 'attr'),
      leisure: mapItems(leisure, 'leis'),
      restaurants: mapItems(restaurants, 'rest'),
    };
  }, [monthlyEvents, attractions, leisure, restaurants]);

  const tile = TILE_STYLES[tileKey] || TILE_STYLES.CartoLight;
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100 dark:bg-gray-900">

      {/* --- POPUP STYLES (Global Override for Leaflet) --- */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37) !important;
          color: inherit !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        .leaflet-container {
          font-family: inherit !important;
        }
        .glass-popup .leaflet-popup-content {
          margin: 12px !important;
          width: auto !important;
        }
      `}</style>

      {/* --- PAGE TITLE TILE (Floating Premium Pill) --- */}
      {/* Slimmer, smaller, positioned higher */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none w-full flex justify-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-xl border border-white/20">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shadow-inner">
            <FaMapMarkerAlt className="text-[10px]" />
          </div>
          <h1 className="text-xs font-bold uppercase tracking-widest text-white text-shadow-sm whitespace-nowrap">Élő várostérkép</h1>
        </div>
      </div>

      {/* --- HEADER CONTROLS (Floating Glass) --- */}
      {/* Positioned at the very corners of the visual frame (inset-2 is approx 8px/0.5rem from edge) */}
      <div className="absolute top-6 left-6 z-40">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`pointer-events-auto w-10 h-10 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/60 flex items-center justify-center transition-all duration-300 ${isPanelOpen ? 'bg-white text-black rotate-180' : 'bg-white text-gray-800 hover:scale-110'}`}
        >
          {isPanelOpen ? <FaTimes /> : <FaFilter className="text-sm" />}
        </button>
      </div>

      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/60 flex items-center justify-center text-gray-800 hover:scale-110 active:scale-90 transition-all duration-300"
          title="Vissza"
        >
          <FaArrowLeft className="text-sm" />
        </button>
      </div>

      {/* --- FILTER DRAWER (Floating Side Panel) --- */}
      <div className={`
          absolute z-50 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          md:top-24 md:left-4 md:w-80 
          bottom-0 left-0 right-0 w-full md:bottom-auto rounded-t-[40px] md:rounded-[40px]
          bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20
          p-6 overflow-hidden origin-bottom md:origin-top-left
          ${isPanelOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-20 md:-translate-y-20 pointer-events-none'}
      `}>
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

        {/* Drawer Handle (Mobile) */}
        <div className="md:hidden w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-6" />

        {/* Controls */}
        <div className="space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-white/10"><FaFilter className="text-sm" /></div>
            <h3 className="font-bold text-lg tracking-wide">Szűrők</h3>
          </div>

          {/* Layers - Grid */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Rétegek</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'events', label: 'Esemény', icon: <FaCalendarAlt />, color: 'from-pink-500 to-rose-500' },
                { id: 'attractions', label: 'Látnivaló', icon: <FaStar />, color: 'from-blue-500 to-cyan-500' },
                { id: 'leisure', label: 'Szabadidő', icon: <FaWalking />, color: 'from-green-500 to-emerald-500' },
                { id: 'restaurants', label: 'Gasztro', icon: <FaUtensils />, color: 'from-amber-500 to-orange-500' },
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setShow(s => ({ ...s, [layer.id]: !s[layer.id] }))}
                  className={`
                                relative flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all overflow-hidden border
                                ${show[layer.id] ? 'bg-white border-white text-gray-800 shadow-lg scale-100' : 'bg-black/20 border-white/5 text-white/40 grayscale scale-95'}
                            `}
                >
                  <div className={`w-8 h-8 rounded-xl ${layer.color} flex items-center justify-center text-sm shadow-sm`}>{layer.icon}</div>
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="p-4 bg-black/20 rounded-3xl border border-white/5 mx-[-8px]">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/50"><FaCalendarAlt /> Időszak</div>
            <div className="flex gap-4 text-white">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-1/3 bg-transparent font-bold outline-none border-b border-white/20 pb-1 focus:border-white transition-colors">
                {availableYears.map(y => <option className="text-black" key={y} value={y}>{y}</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="flex-1 bg-transparent font-bold outline-none border-b border-white/20 pb-1 focus:border-white transition-colors">
                {MONTHS_HU.map((m, i) => <option className="text-black" key={m} value={i}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Map Style */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Térkép stílus</span>
            <div className="flex bg-black/30 rounded-full p-1 border border-white/10">
              {['CartoLight', 'CartoDark', 'OSM'].map(key => (
                <button
                  key={key}
                  onClick={() => setTileKey(key)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${tileKey === key ? 'bg-white text-black shadow-sm' : 'text-white/30 hover:text-white'}`}
                >
                  {key === 'CartoLight' ? 'Sun' : key === 'CartoDark' ? 'M' : 'O'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAP CONTAINER WITH GRADIENT BORDER --- */}
      {/* inset-2 means tight frame. top-0 means BEHIND Header. no mt-16. */}
      <div className="absolute inset-2 top-0 bottom-4 rounded-[32px] p-[3px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl overflow-hidden z-0">
        <div className="w-full h-full rounded-[29px] overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          <MapContainer center={center} zoom={14} className="w-full h-full outline-none" zoomControl={false}>
            <TileLayer url={tile.url} attribution={tile.attr} />
            <CustomControls />

            {/* User Pos */}
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup><div className="font-bold text-center">📍 Itt vagyok</div></Popup>
              </Marker>
            )}

            {/* Events */}
            {show.events && markers.events.map(({ key, pos, items, today }) => (
              <Marker key={key} position={[pos.lat, pos.lng]} icon={today ? ICONS.eventsToday : ICONS.events}>
                <Popup className="glass-popup" maxWidth={280}>
                  <div className="scale-95 origin-top-left">
                    {items.map(item => (
                      <div key={item.id} className="mb-4 last:mb-0">
                        <div className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Esemény</div>
                        <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1"><FaCalendarAlt /> {formatEventWhen(item)}</p>
                        <button onClick={() => navigate(`/events/${item.id}`)} className="text-sm font-semibold text-white bg-pink-500 px-3 py-1.5 rounded-lg shadow-md hover:bg-pink-600 transition-colors w-full">
                          Részletek
                        </button>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Attractions */}
            {show.attractions && markers.attractions.map(({ key, item, pos }) => (
              <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS.attractions}>
                <Popup className="glass-popup" maxWidth={260}>
                  <div className="scale-95 origin-top-left">
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Látnivaló</div>
                    <h3 className="font-bold text-base leading-tight mb-2">{item.name}</h3>
                    <button onClick={() => navigate(`/attractions/${item.id}`)} className="text-xs font-bold text-blue-600 hover:underline">
                      Megnyitás →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Leisure */}
            {show.leisure && markers.leisure.map(({ key, item, pos }) => (
              <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS.leisure}>
                <Popup className="glass-popup" maxWidth={260}>
                  <div className="scale-95 origin-top-left">
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Szabadidő</div>
                    <h3 className="font-bold text-base leading-tight mb-2">{item.name}</h3>
                    <button onClick={() => navigate(`/leisure/${item.id}`)} className="text-xs font-bold text-green-600 hover:underline">
                      Megnyitás →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Restaurants */}
            {show.restaurants && markers.restaurants.map(({ key, item, pos }) => (
              <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS.restaurants}>
                <Popup className="glass-popup" maxWidth={260}>
                  <div className="scale-95 origin-top-left">
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Gasztro</div>
                    <h3 className="font-bold text-base leading-tight mb-2">{item.name}</h3>
                    <button onClick={() => navigate(`/gastronomy/${item.id}`)} className="text-xs font-bold text-amber-600 hover:underline">
                      Megnyitás →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        </div>
      </div>
    </div>
  );
}
