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
import { FaFilter, FaLayerGroup, FaLocationArrow, FaPlus, FaMinus, FaGlobe, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaWalking, FaUtensils, FaTimes, FaCog, FaArrowLeft, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { IoSearchOutline, IoNavigateOutline, IoCompassOutline, IoLayersOutline } from 'react-icons/io5';

// --- CLEAN APPLE MARKERS (San Francisco Style) ---
// Minimalist pins with vibrant colors and drop shadows
const createMarkerHtml = (color, iconSvg, isPulsing = false) => `
  <div class="relative flex flex-col items-center justify-end w-12 h-12 hover:scale-110 transition-transform duration-300 origin-bottom">
    ${isPulsing ? `<div class="absolute bottom-1 w-8 h-8 rounded-full bg-[${color}] opacity-40 animate-ping"></div>` : ''}
    
    <div class="relative w-8 h-8 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-center border-[2.5px] border-white z-10" style="background: ${color};">
      ${iconSvg}
    </div>
    <div class="w-0.5 h-3 bg-gray-400/50 rounded-full mt-[-2px] z-0"></div>
    <div class="w-2 h-1 bg-black/20 rounded-[100%] blur-[1px]"></div>
  </div>
`;

// Simple SVGs
const SVG_EVENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="12" height="12"><path d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"/></svg>`;
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="white" width="12" height="12"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.86 18L195 150.3 51.4 171.5C39.2 173.2 29.2 181.5 25.4 193.1s3.2 24.3 12.3 32.7L142 329.6 116.8 473c-1.8 11.7 2.9 23.6 12.1 30.6s21.6 6.9 31.5 1.5l127.7-67.1 127.7 67.1c9.9 5.3 22.1 5.4 31.5-1.5s14-18.9 12.1-30.6l-25.2-143.4 104.3-103.8c9.1-8.4 13.9-19.9 10.1-31.5s-13.8-19.9-26-21.7L381.1 150.3 316.9 18z"/></svg>`;
const SVG_WALK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="white" width="12" height="12"><path d="M208 48c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48zm63.4 87.7l-47.5 31.6c-4.4 2.9-8.4 6.4-11.8 10.3l-18 20.8 47.9 124.7c7 18.2 19 33.4 34.6 44l35.8 24.5c16.7 11.4 20.9 34.1 9.5 50.8s-34.1 20.9-50.8 9.5l-35.8-24.5c-29.2-20-51.4-48.3-64.6-82L149.2 284l-14.7 93.3c-1.9 12.1-7.1 23.4-15.1 32.7L67.7 470.6c-13.1 15.3-36.2 17-51.5 3.9s-17-36.2-3.9-51.5l51.5-60.1c.3-.3 .6-.7 .9-1c5.1-5.9 8.5-13.1 9.7-20.9L108 212.5l-19.5-22.5c-15.3-17.7-18.8-42.5-9.1-64.1l32.3-71.9c8.6-19.2 27.8-31.5 48.8-31.5h.1c21.8 0 41.5 13.3 49.7 33.5l14.1 35.1 37.1-24.7c18.3-12.2 43.1-7.3 55.3 11s7.3 43.1-11 55.3z"/></svg>`;
const SVG_FOOD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="12" height="12"><path d="M416 0C400 0 288 32 288 176V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240 32c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 1.6S32 10 32 19.1V160H160V19.1c0-9.1-7.7-16.5-16.6-17.4C135.2 .9 128 7.8 128 16V144H64V16zm96 144V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240c0-35.3-28.7-64-64-64H96c-35.3 0-64 28.7-64 64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V240c0-113.1 84.4-208 192-208V160z"/></svg>`;

const makeCustomIcon = (color, svg, pulsing) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: createMarkerHtml(color, svg, pulsing),
  iconSize: [48, 48],
  iconAnchor: [24, 48], // Bottom center
  popupAnchor: [0, -48]
});

const ICONS = {
  events: makeCustomIcon('#FF2D55', SVG_EVENT),
  eventsToday: makeCustomIcon('#FF2D55', SVG_EVENT, true),
  attractions: makeCustomIcon('#007AFF', SVG_STAR),
  leisure: makeCustomIcon('#34C759', SVG_WALK),
  restaurants: makeCustomIcon('#FF9500', SVG_FOOD)
};

const userIcon = L.divIcon({
  className: 'leaflet-user-icon',
  html: `<div class="relative w-4 h-4 rounded-full bg-[#007AFF] border-[3px] border-white shadow-lg animate-pulse ring-1 ring-black/10"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- HELPERS ---
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

// Clean Light Mode map with Apple-like tones
const TILE_STYLES = {
  CartoLight: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  CartoDark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  OSM: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OSM' }
};

// --- CONTROLS ---
const AppleControls = () => {
  const map = useMap();
  return (
    <div className="absolute top-24 right-4 z-[900] flex flex-col gap-3 pointer-events-auto">
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] border border-white/40 flex flex-col overflow-hidden">
        <button onClick={() => map.zoomIn()} className="w-11 h-11 flex items-center justify-center text-black/70 hover:bg-black/5 active:bg-black/10 transition-colors border-b border-black/10">
          <FaPlus className="text-sm" />
        </button>
        <button onClick={() => map.zoomOut()} className="w-11 h-11 flex items-center justify-center text-black/70 hover:bg-black/5 active:bg-black/10 transition-colors">
          <FaMinus className="text-sm" />
        </button>
      </div>
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 16 })}
        className="w-11 h-11 flex items-center justify-center bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] border border-white/40 text-blue-500 hover:bg-white active:bg-blue-50 transition-colors"
      >
        <IoNavigateOutline className="text-xl transform rotate-45" />
      </button>
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
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Default closed as requested

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

  // --- Filtering Logic (Same as before) ---
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

  const markers = useMemo(() => {
    // 1. Events grouping
    const eventsByCoord = monthlyEvents.reduce((acc, event) => {
      const locs = pickLocations(event);
      locs.forEach(loc => {
        const key = `${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
        if (!acc[key]) acc[key] = { pos: loc, items: [] };
        acc[key].items.push(event);
      });
      return acc;
    }, {});

    const eventMarkers = Object.entries(eventsByCoord).map(([coordKey, group]) => ({
      key: `grp-${coordKey}`,
      pos: group.pos,
      items: group.items,
      today: group.items.some(item => isEventToday(item)),
    }));

    // Helper for other categories
    const mapItems = (items, prefix) => (Array.isArray(items) ? items : []).flatMap(item =>
      pickLocations(item).map((pos, idx) => ({
        key: `${prefix}-${item.id || 'no-id'}-${pos.lat.toFixed(5)}-${pos.lng.toFixed(5)}-${idx}`,
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
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* Global CSS for Popups */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-radius: 18px !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2) !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
             display: none !important; /* Cleaner look without tip */
        }
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
      `}</style>

      {/* --- HEADER --- */}
      {/* Search Bar / Back Button Combo */}
      <div className="absolute top-0 left-0 right-0 p-4 z-[900] pointer-events-none flex gap-3 safe-area-top">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border border-black/5 flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          <FaArrowLeft className="text-lg opacity-70" />
        </button>

        <div className="flex-1 pointer-events-auto max-w-md mx-auto shadow-[0_8px_20px_rgba(0,0,0,0.08)] rounded-full bg-white/90 backdrop-blur-xl border border-black/5 flex items-center px-4 h-12 gap-3 transition-all hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
          <IoSearchOutline className="text-xl opacity-40" />
          <input
            type="text"
            placeholder="Keress helyeket..."
            className="flex-1 bg-transparent border-none outline-none text-base font-medium placeholder-gray-400"
          />
        </div>

        <div className="w-12 h-12" /> {/* Spacer for symmetry if needed, or Profile button */}
      </div>


      {/* --- BOTTOM SHEET (Apple Maps Style) --- */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-[1000] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}
      >
        <div className="mx-auto max-w-lg md:max-w-md w-full md:mr-4 md:mb-4 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl rounded-t-[32px] md:rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/20 overflow-hidden flex flex-col max-h-[60vh]">

          {/* Grab Handle */}
          <div
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="h-9 flex flex-col items-center justify-center cursor-pointer active:opacity-50 pt-2"
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full mb-1" />
            {!isPanelOpen && (
              <FaChevronUp className="text-gray-400 text-xs animate-bounce opacity-70" />
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-8 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Felfedezés</h2>

            {/* Layer Toggles */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'events', label: 'Események', icon: <FaCalendarAlt />, color: 'bg-pink-500', activeBg: 'bg-pink-500/10 text-pink-600' },
                { id: 'attractions', label: 'Látnivalók', icon: <FaStar />, color: 'bg-blue-500', activeBg: 'bg-blue-500/10 text-blue-600' },
                { id: 'leisure', label: 'Szabadidő', icon: <FaWalking />, color: 'bg-green-500', activeBg: 'bg-green-500/10 text-green-600' },
                { id: 'restaurants', label: 'Gasztro', icon: <FaUtensils />, color: 'bg-orange-500', activeBg: 'bg-orange-500/10 text-orange-600' },
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setShow(s => ({ ...s, [layer.id]: !s[layer.id] }))}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-transparent ${show[layer.id] ? `${layer.activeBg} ring-1 ring-inset ring-black/5` : 'bg-gray-100 dark:bg-white/5 opacity-60 grayscale'}`}
                >
                  <div className={`w-8 h-8 rounded-full ${layer.color} text-white flex items-center justify-center text-xs shadow-sm`}>
                    {layer.icon}
                  </div>
                  <span className="font-semibold text-sm">{layer.label}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider opacity-50">Időszak</span>
                <FaCalendarAlt className="opacity-30" />
              </div>
              <div className="flex gap-4">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-transparent font-semibold outline-none text-lg w-1/3"
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-transparent font-semibold outline-none text-lg flex-1 text-right"
                >
                  {MONTHS_HU.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAP --- */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={center}
          zoom={14}
          className="w-full h-full outline-none bg-[#F2F2F7] dark:bg-[#1C1C1E]"
          zoomControl={false}
        >
          <TileLayer url={tile.url} attribution={tile.attr} />
          <AppleControls />

          {/* User */}
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup><div className="font-semibold text-center px-1">📍 Jelenlegi helyzeted</div></Popup>
            </Marker>
          )}

          {/* Markers Logic (Same as before, just rendering) */}
          {show.events && markers.events.map(({ key, pos, items, today }) => (
            <Marker key={key} position={[pos.lat, pos.lng]} icon={today ? ICONS.eventsToday : ICONS.events}>
              <Popup className="glass-popup">
                <div className="p-3 min-w-[200px]">
                  {items.map(item => (
                    <div key={item.id} className="mb-3 last:mb-0 border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">Esemény</div>
                      <h3 className="font-bold text-base leading-tight mb-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{formatEventWhen(item)}</p>
                      <button onClick={() => navigate(`/events/${item.id}`)} className="w-full py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold transition-colors">Megnyitás</button>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}

          {['attractions', 'leisure', 'restaurants'].map(type =>
            show[type] && markers[type].map(({ key, item, pos }) => (
              <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS[type]}>
                <Popup className="glass-popup">
                  <div className="p-3 min-w-[180px]">
                    <h3 className="font-bold text-base leading-tight mb-2">{item.name}</h3>
                    <button
                      onClick={() => navigate(`/${type === 'attractions' ? 'attractions' : type === 'restaurants' ? 'gastronomy' : 'leisure'}/${item.id}`)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Adatlap megnyitása
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))
          )}

        </MapContainer>
      </div>
    </div>
  );
}
