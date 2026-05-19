// src/pages/Kiosk/KioskMap.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { parseISO, startOfDay } from 'date-fns';
import {
  IoCalendarOutline, IoStarOutline, IoRestaurantOutline,
  IoChevronUpOutline, IoChevronDownOutline,
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchEvents, fetchAttractions, fetchRestaurants } from '../../api';
import { useKioskLang } from '../../contexts/KioskLangContext';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

// ── Marker icon factory (same pattern as LiveCityMap) ──────────────────────
const pinHtml = (color, svgInner, pulsing = false) => `
  <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:48px;height:52px">
    ${pulsing ? `<div style="position:absolute;top:2px;left:50%;transform:translateX(-50%);width:30px;height:30px;border-radius:50%;background:${color};opacity:0.3;animation:kmap-ping 1.5s ease-in-out infinite"></div>` : ''}
    <div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;position:relative;z-index:1">
      ${svgInner}
    </div>
    <div style="width:2px;height:8px;background:rgba(0,0,0,0.2);border-radius:1px;margin-top:-1px"></div>
    <div style="width:6px;height:3px;background:rgba(0,0,0,0.12);border-radius:50%;filter:blur(1px)"></div>
  </div>`;

const SVG_EVENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="13" height="13"><path d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"/></svg>`;
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="white" width="13" height="13"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.86 18L195 150.3 51.4 171.5C39.2 173.2 29.2 181.5 25.4 193.1s3.2 24.3 12.3 32.7L142 329.6 116.8 473c-1.8 11.7 2.9 23.6 12.1 30.6s21.6 6.9 31.5 1.5l127.7-67.1 127.7 67.1c9.9 5.3 22.1 5.4 31.5-1.5s14-18.9 12.1-30.6l-25.2-143.4 104.3-103.8c9.1-8.4 13.9-19.9 10.1-31.5s-13.8-19.9-26-21.7L381.1 150.3 316.9 18z"/></svg>`;
const SVG_FOOD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white" width="13" height="13"><path d="M416 0C400 0 288 32 288 176V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240 32c0-17.7-14.3-32-32-32zM64 16C64 7.8 57.9 1 49.7 1.6S32 10 32 19.1V160H160V19.1c0-9.1-7.7-16.5-16.6-17.4C135.2.9 128 7.8 128 16V144H64V16zm96 144V288c0 35.3 28.7 64 64 64h32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V352 240c0-35.3-28.7-64-64-64H96c-35.3 0-64 28.7-64 64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V240c0-113.1 84.4-208 192-208V160z"/></svg>`;

const makeIcon = (color, svg, pulsing) => L.divIcon({
  className: 'kiosk-map-icon',
  html: pinHtml(color, svg, pulsing),
  iconSize: [48, 52],
  iconAnchor: [24, 52],
  popupAnchor: [0, -54],
});

const ICONS = {
  events:      makeIcon('#FF2D55', SVG_EVENT),
  eventsToday: makeIcon('#FF2D55', SVG_EVENT, true),
  attractions: makeIcon('#007AFF', SVG_STAR),
  restaurants: makeIcon('#FF9500', SVG_FOOD),
};

// ── Prominent kiosk "ITT VAGY" position marker ────────────────────────────
const kioskIcon = L.divIcon({
  className: 'kiosk-position-icon',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:72px">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:52px;height:52px;border-radius:50%;background:#4f46e5;opacity:0.2;animation:kmap-ping 2s ease-in-out infinite"></div>
      <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:38px;height:38px;border-radius:50%;background:#4f46e5;opacity:0.15;animation:kmap-ping 2s ease-in-out infinite 0.6s"></div>
      <div style="width:30px;height:30px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 6px 20px rgba(79,70,229,0.55);display:flex;align-items:center;justify-content:center;position:relative;z-index:2">
        <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
      </div>
      <div style="width:2px;height:10px;background:#4f46e5;opacity:0.5;border-radius:1px;margin-top:-1px"></div>
      <div style="background:#4f46e5;color:white;font-size:8px;font-weight:900;padding:2px 7px;border-radius:20px;white-space:nowrap;letter-spacing:0.06em;box-shadow:0 3px 10px rgba(79,70,229,0.45)">ITT VAGY</div>
    </div>`,
  iconSize: [72, 72],
  iconAnchor: [36, 62],
  popupAnchor: [0, -64],
});

// ── Helpers ────────────────────────────────────────────────────────────────
function pickLocations(item) {
  if (!item) return [];
  if (Array.isArray(item.locations)) return item.locations.filter(l => l?.lat && l?.lng);
  const c = item.coords || item.coordinates || item.coordinate || item.location?.coords || null;
  if (c?.lat && c?.lng) return [c];
  if (item.lat && item.lng) return [{ lat: item.lat, lng: item.lng }];
  return [];
}

function isToday(e) {
  const d = e.date ? parseISO(e.date) : null;
  if (!d || isNaN(d)) return false;
  return d.toDateString() === new Date().toDateString();
}

// ── Component ──────────────────────────────────────────────────────────────
export default function KioskMap() {
  const navigate = useNavigate();
  const { t } = useKioskLang();

  const [events, setEvents] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [show, setShow] = useState({ events: true, attractions: true, restaurants: true });
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const today = startOfDay(new Date());
    fetchEvents()
      .then(data => setEvents(data.filter(e => {
        const parsed = parseISO(e.end_date || e.date);
        return parsed && !isNaN(parsed) && parsed >= today;
      })))
      .catch(console.error);
    fetchAttractions().then(setAttractions).catch(console.error);
    fetchRestaurants().then(setRestaurants).catch(console.error);
  }, []);

  const markers = useMemo(() => {
    // Group events by coordinate cluster
    const byCoord = events.reduce((acc, evt) => {
      pickLocations(evt).forEach(loc => {
        const key = `${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
        if (!acc[key]) acc[key] = { pos: loc, items: [] };
        acc[key].items.push(evt);
      });
      return acc;
    }, {});

    const toMarkers = (arr, prefix) => arr.flatMap(item =>
      pickLocations(item).map((pos, i) => ({ key: `${prefix}-${item.id}-${i}`, item, pos }))
    );

    return {
      events: Object.entries(byCoord).map(([k, g]) => ({
        key: `ev-${k}`, pos: g.pos, items: g.items, today: g.items.some(isToday),
      })),
      attractions: toMarkers(attractions, 'attr'),
      restaurants: toMarkers(restaurants, 'rest'),
    };
  }, [events, attractions, restaurants]);

  const LAYERS = [
    { id: 'events',      color: '#FF2D55', icon: <IoCalendarOutline /> },
    { id: 'attractions', color: '#007AFF', icon: <IoStarOutline /> },
    { id: 'restaurants', color: '#FF9500', icon: <IoRestaurantOutline /> },
  ];

  // Shared popup button style
  const popupBtn = { width: '100%', padding: '7px', borderRadius: '9px', background: '#f4f4f5', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer' };

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <KioskHeader />

      <style>{`
        @keyframes kmap-ping {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.25; }
          50%       { transform: translateX(-50%) scale(1.6); opacity: 0; }
        }
        .kiosk-map-icon, .kiosk-position-icon { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(255,255,255,0.97) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 18px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.14) !important;
          padding: 0 !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .leaflet-popup-tip { display: none !important; }
        .leaflet-popup-content { margin: 0 !important; }
      `}</style>

      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={[47.3896, 16.5402]}
          zoom={15}
          className="w-full h-full"
          style={{ height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
          />

          {/* ── Kiosk position — always prominently on top ── */}
          <Marker position={[KIOSK_LAT, KIOSK_LNG]} icon={kioskIcon} zIndexOffset={2000}>
            <Popup>
              <div style={{ padding: '14px 18px', minWidth: '170px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '900', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                  {t('screensaver.terminal')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#18181b', marginBottom: '2px' }}>Fő tér 7.</div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>Portré Étterem mellett</div>
              </div>
            </Popup>
          </Marker>

          {/* ── Event markers ── */}
          {show.events && markers.events.map(({ key, pos, items, today }) => (
            <Marker key={key} position={[pos.lat, pos.lng]} icon={today ? ICONS.eventsToday : ICONS.events}>
              <Popup>
                <div style={{ padding: '12px', minWidth: '210px' }}>
                  {items.map(item => (
                    <div key={item.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f4f4f5' }}>
                      <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF2D55', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
                        {t('map.events')}{isToday(item) ? ` · ${t('map.today')}` : ''}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', lineHeight: 1.3, marginBottom: '5px' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px' }}>
                        {item.date}{item.time ? ` · ${item.time}` : ''}
                      </div>
                      <button onClick={() => navigate(`/kiosk/events/${item.id}`)} style={popupBtn}>
                        {t('map.open')}
                      </button>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Attraction markers ── */}
          {show.attractions && markers.attractions.map(({ key, item, pos }) => (
            <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS.attractions}>
              <Popup>
                <div style={{ padding: '12px', minWidth: '190px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{t('map.attractions')}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>{item.name}</div>
                  <button onClick={() => navigate(`/kiosk/attractions/${item.id}`)} style={popupBtn}>{t('map.open')}</button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Restaurant markers ── */}
          {show.restaurants && markers.restaurants.map(({ key, item, pos }) => (
            <Marker key={key} position={[pos.lat, pos.lng]} icon={ICONS.restaurants}>
              <Popup>
                <div style={{ padding: '12px', minWidth: '190px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF9500', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{t('map.restaurants')}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>{item.name}</div>
                  <button onClick={() => navigate('/kiosk/gastronomy')} style={popupBtn}>{t('map.open')}</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ── Bottom layer toggle panel ── */}
        <div className={`absolute bottom-0 left-0 right-0 z-[1000] transition-transform duration-300 ${panelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'}`}>
          <div className="mx-auto max-w-lg bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl border-t-2 border-indigo-500/30">
            <div
              onClick={() => setPanelOpen(p => !p)}
              className="h-16 flex items-center justify-between px-6 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                {panelOpen
                  ? <IoChevronDownOutline className="text-lg shrink-0" />
                  : <IoChevronUpOutline className="text-lg shrink-0 animate-bounce" />
                }
                <span className="text-xs font-black uppercase tracking-widest">
                  {t('map.layerHint')}
                </span>
              </div>
              <div className="flex gap-1.5">
                {LAYERS.map(l => (
                  <div key={l.id} className={`w-2.5 h-2.5 rounded-full transition-opacity ${show[l.id] ? 'opacity-100' : 'opacity-25'}`} style={{ background: l.color }} />
                ))}
              </div>
            </div>
            <div className="px-6 pb-8 flex gap-3">
              {LAYERS.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setShow(s => ({ ...s, [layer.id]: !s[layer.id] }))}
                  className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-2xl transition-all duration-200 border ${
                    show[layer.id]
                      ? 'shadow-sm border-transparent'
                      : 'opacity-40 grayscale border-zinc-200 dark:border-zinc-800'
                  }`}
                  style={show[layer.id] ? { background: `${layer.color}18`, borderColor: `${layer.color}30` } : {}}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg shadow-sm" style={{ background: layer.color }}>
                    {layer.icon}
                  </div>
                  <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
                    {t(`map.${layer.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
