// src/pages/Kiosk/KioskHome.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  IoCalendarOutline, IoMapOutline, IoRestaurantOutline,
  IoCameraOutline, IoSparklesOutline, IoLocationOutline,
  IoCompassOutline, IoGlobeOutline, IoBrushOutline, IoColorPaletteOutline, IoWalkOutline
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import KioskFlag from '../../components/Kiosk/KioskFlag';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { supabase } from '../../lib/supabaseClient';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

const LANGS = [
  { code: 'hu', label: 'HU' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const kioskIcon = L.divIcon({
  className: 'kiosk-position-icon',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:72px">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:52px;height:52px;border-radius:50%;background:#4f46e5;opacity:0.2;animation:kmap-ping 2s ease-in-out infinite"></div>
      <div style="width:30px;height:30px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 6px 20px rgba(79,70,229,0.55);display:flex;align-items:center;justify-content:center;position:relative;z-index:2">
        <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
      </div>
      <div style="width:2px;height:10px;background:#4f46e5;opacity:0.5;border-radius:1px;margin-top:-1px"></div>
    </div>`,
  iconSize: [72, 72],
  iconAnchor: [36, 62],
});

function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters, nearText = 'Itt van melletted') {
  if (meters === Infinity) return '';
  if (meters < 15) return nearText;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function KioskHome({ appData, weather }) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useKioskLang();
  const [showScreensaver, setShowScreensaver] = useState(() =>
    sessionStorage.getItem('kiosk-started') !== 'true'
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [visitorPhotos, setVisitorPhotos] = useState([]);

  // Predefined authentic local photos of Kőszeg
  const screensaverImages = useMemo(() => {
    const photos = [
      '/images/fo_ter.jpg',
      '/images/hosok_tornya.jpg',
      '/images/jezus_szive_templom.jpg',
      '/images/jurisics_ter.jpg',
      '/images/jurisics_var.jpg',
      '/images/kekes_tanosveny.JPG',
      '/images/labashaz.jpg',
      '/images/sgraffito_haz.jpg',
      '/images/tabornokhaz.jpg',
      '/images/templom_ter.jpg',
      '/images/varoshaza.jpg',
      '/images/zwinger_oregtorony.jpg'
    ];
    return [...photos].sort(() => Math.random() - 0.5);
  }, [showScreensaver]);

  const [approvedDrawings, setApprovedDrawings] = useState([]);

  useEffect(() => {
    if (!showScreensaver) return;
    
    supabase
      .from('kiosk_visitor_messages')
      .select('id, photo_url, visitor_name, message')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data?.length) setVisitorPhotos(data); })
      .catch(() => {});

    supabase
      .from('kiosk_drawings')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data?.length) setApprovedDrawings(data); })
      .catch(() => {});
  }, [showScreensaver]);

  const slides = useMemo(() => {
    const photoSlides = screensaverImages.map(img => ({ type: 'photo', url: img }));
    const drawSlides = approvedDrawings.map(d => ({ type: 'drawing', url: d.image_path, drawing: d }));
    
    const mixed = [];
    let drawIdx = 0;
    
    for (let i = 0; i < photoSlides.length; i++) {
      mixed.push(photoSlides[i]);
      if (drawIdx < drawSlides.length && (i + 1) % 2 === 0) {
        mixed.push(drawSlides[drawIdx]);
        drawIdx++;
      }
    }
    while (drawIdx < drawSlides.length) {
      mixed.push(drawSlides[drawIdx]);
      drawIdx++;
    }
    return mixed.length > 0 ? mixed : photoSlides;
  }, [screensaverImages, approvedDrawings]);

  useEffect(() => {
    if (!showScreensaver) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showScreensaver, slides.length]);

  useEffect(() => {
    const handleIdleTrigger = () => {
      sessionStorage.setItem('kiosk-started', 'false');
      setShowScreensaver(true);
    };
    window.addEventListener('kiosk-idle-trigger', handleIdleTrigger);
    return () => window.removeEventListener('kiosk-idle-trigger', handleIdleTrigger);
  }, []);

  const handleStart = () => {
    sessionStorage.setItem('kiosk-started', 'true');
    setShowScreensaver(false);
  };

  const menuItems = [
    { to: '/kiosk/selfie',      labelKey: 'home.selfie.label',      descKey: 'home.selfie.desc',      icon: IoCameraOutline,     gradient: 'from-pink-500 via-rose-500 to-purple-700',   span: 'col-span-2', highlight: true },
    { to: '/kiosk/attractions', labelKey: 'home.attractions.label', descKey: 'home.attractions.desc', icon: IoMapOutline,         gradient: 'from-emerald-500 to-teal-700',               span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/events',      labelKey: 'home.events.label',      descKey: 'home.events.desc',      icon: IoCalendarOutline,   gradient: 'from-blue-500 to-indigo-700',                span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/gastronomy',  labelKey: 'home.gastronomy.label',  descKey: 'home.gastronomy.desc',  icon: IoRestaurantOutline, gradient: 'from-orange-500 to-red-600',                 span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/varszinhaz',  labelKey: 'home.varszinhaz.label',  descKey: 'home.varszinhaz.desc',  icon: IoSparklesOutline,   gradient: 'from-amber-500 via-orange-500 to-amber-700', span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/services',    labelKey: 'home.services.label',    descKey: 'home.services.desc',    icon: IoCompassOutline,    gradient: 'from-violet-500 to-indigo-800',              span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/map',         labelKey: 'home.map.label',         descKey: 'home.map.desc',         icon: IoGlobeOutline,      gradient: 'from-cyan-500 to-blue-600',                  span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/draw',        labelKey: 'home.draw.label',        descKey: 'home.draw.desc',        icon: IoBrushOutline,      gradient: 'from-amber-500 to-orange-600',               span: 'col-span-2 sm:col-span-1' },
    { to: '/kiosk/draw-gallery',labelKey: 'home.drawGallery.label', descKey: 'home.drawGallery.desc', icon: IoColorPaletteOutline, gradient: 'from-purple-500 to-pink-600', span: 'col-span-2 sm:col-span-1' },
  ];

  if (showScreensaver) {
    return (
      <div onClick={handleStart} className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col justify-between cursor-pointer select-none">
        <div className="absolute inset-0 z-0 bg-black">
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlide;
            if (slide.type === 'drawing') {
              return (
                <div key={idx} className={`absolute inset-0 flex flex-col justify-center items-center transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-110" style={{ backgroundImage: `url(${slide.url})` }} />
                  <img src={slide.url} alt="" className="relative max-w-[85vw] max-h-[70vh] object-contain shadow-2xl rounded-2xl border-4 border-white/20 z-10" />
                  <div className="relative mt-5 z-20 px-6 py-2.5 rounded-full bg-black/70 border border-white/10 text-white font-extrabold text-sm shadow-xl flex items-center gap-2">
                    🎨 {slide.drawing.name} {slide.drawing.age ? `(${slide.drawing.age})` : ''} 
                    {slide.drawing.country ? ` - ${slide.drawing.country}` : ''}
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-55' : 'opacity-0'}`} style={{ backgroundImage: `url(${slide.url})` }} />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
        </div>

        <div className="relative z-10 p-8 w-full flex flex-col items-center gap-1">
          <span className="text-zinc-300 text-xs tracking-[0.25em] font-bold uppercase mb-2">{t('screensaver.terminal')}</span>
          <div className="flex items-center text-readability-shadow">
            <span className="text-4xl font-extrabold text-white tracking-tight uppercase">visit</span>
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent tracking-tighter uppercase ml-1">Kőszeg</span>
          </div>
          <div className="w-12 h-1 bg-indigo-500 rounded-full mt-4" />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center justify-center p-8 text-center gap-6 my-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight uppercase">
              {t('screensaver.headline1')}<br />{t('screensaver.headline2')}
            </h1>
            <p className="text-zinc-200 text-sm font-semibold max-w-sm drop-shadow-md mx-auto">{t('screensaver.subtext')}</p>
          </div>
          <style>{`
            @keyframes breathe {
              0%,100%{transform:scale(1);box-shadow:0 10px 25px -5px rgba(79,70,229,.4)}
              50%{transform:scale(1.04);box-shadow:0 20px 35px -5px rgba(79,70,229,.6)}
            }
            @keyframes breathe-blur {
              0%,100%{transform:scale(.95);opacity:.45}
              50%{transform:scale(1.15);opacity:.75}
            }
            .kiosk-btn-breathe{animation:breathe 3s ease-in-out infinite}
            .kiosk-blur-breathe{animation:breathe-blur 3s ease-in-out infinite}
          `}</style>
          <div className="relative mt-8 group">
            <div className="absolute inset-0 bg-indigo-600 rounded-full blur-2xl kiosk-blur-breathe" />
            <button className="relative px-8 py-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-lg shadow-2xl border border-indigo-400/30 flex items-center gap-3 kiosk-btn-breathe">
              <span>{t('screensaver.cta')}</span>
            </button>
          </div>
        </div>

        {/* ── Visitor Wall Strip ── */}
        {visitorPhotos.length > 0 && (
          <div className="relative z-10 px-6 pb-6 w-full">
            <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.25em] mb-4 text-center">
              📸 Látogatóink Kőszegen
            </p>
            <div className="flex gap-4 overflow-x-hidden justify-center flex-wrap max-h-[320px] overflow-hidden">
              {visitorPhotos.map(p => (
                <div key={p.id} className="relative w-36 h-48 rounded-2xl overflow-hidden border border-white/20 shadow-xl shrink-0 group bg-slate-950/40 backdrop-blur-sm">
                  <img
                    src={p.photo_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-0.5 text-center">
                    {p.visitor_name && (
                      <span className="text-white text-xs font-black truncate drop-shadow-md">
                        {p.visitor_name}
                      </span>
                    )}
                    {p.message && (
                      <span className="text-zinc-200 text-[10px] font-semibold line-clamp-2 leading-tight drop-shadow-sm">
                        {p.message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10 p-8 w-full flex justify-between items-center text-zinc-400 text-xs font-semibold border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <IoLocationOutline className="text-indigo-400 text-base" />
            <span>{t('screensaver.location')}</span>
          </div>
          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                  lang === code
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <KioskFlag code={code} className="w-5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-hidden" style={{ height: '100dvh' }}>
      <KioskHeader />

      <style>{`
        @keyframes kmap-ping {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.25; }
          50%       { transform: translateX(-50%) scale(1.6); opacity: 0; }
        }
        .kiosk-position-icon { background: none !important; border: none !important; }
        .kiosk-small-poi { background: none !important; border: none !important; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 99px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
        }
      `}</style>

      {/* Main split-screen container: stacked on Kiosk vertical screens (Map on top, Bento on bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP: Legible London Map Area */}
        <div className="w-full h-[40%] shrink-0 relative border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-20">
          
          {/* Walking Circle Legend Box */}
          <div className="absolute top-4 right-4 z-[1000] p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-lg flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              {t('map.legendTitle', { defaultValue: 'JELMAGYARÁZAT' })}
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-b-2 border-dashed border-amber-400" />
                <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                  {t('map.walkCircle5Min', { defaultValue: '5 perces séta (400m)' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-b-2 border-dashed border-blue-500" />
                <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                  {t('map.walkCircle15Min', { defaultValue: '15 perces séta (1200m)' })}
                </span>
              </div>
            </div>
          </div>

          <MapContainer
            center={[KIOSK_LAT, KIOSK_LNG]}
            zoom={16}
            className="w-full h-full"
            style={{ height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
            />

            {/* Concentric walking circles */}
            <Circle
              center={[KIOSK_LAT, KIOSK_LNG]}
              radius={400}
              pathOptions={{
                color: '#eab308',
                weight: 1.5,
                dashArray: '8, 8',
                fillColor: '#eab308',
                fillOpacity: 0.03
              }}
            />

            <Circle
              center={[KIOSK_LAT, KIOSK_LNG]}
              radius={1200}
              pathOptions={{
                color: '#2563eb',
                weight: 1.5,
                dashArray: '8, 8',
                fillColor: '#2563eb',
                fillOpacity: 0.01
              }}
            />

            {/* Kiosk location pin */}
            <Marker position={[KIOSK_LAT, KIOSK_LNG]} icon={kioskIcon} zIndexOffset={1000}>
              <Popup>
                <div className="p-3 text-center min-w-[155px]">
                  <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">
                    {t('screensaver.terminal')}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 mt-1">Fő tér 7.</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Portré mellett</p>
                </div>
              </Popup>
            </Marker>

            {/* Render small POI dots for local sights */}
            {appData?.attractions?.map(item => {
              const coords = item.coords || item.coordinates || item.coordinate || null;
              if (!coords?.lat || !coords?.lng) return null;
              const distance = getDistance(KIOSK_LAT, KIOSK_LNG, coords.lat, coords.lng);
              
              const smallPinIcon = L.divIcon({
                className: 'kiosk-small-poi',
                html: `<div style="width:14px;height:14px;border-radius:50%;background:#007AFF;border:1.5px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              });

              return (
                <Marker key={item.id} position={[coords.lat, coords.lng]} icon={smallPinIcon}>
                  <Popup>
                    <div className="p-2 min-w-[140px]">
                      <span className="text-[8px] font-black text-blue-500 uppercase">Látnivaló</span>
                      <h4 className="text-xs font-bold text-zinc-900 mt-0.5">{item.name}</h4>
                      <p className="text-[9px] text-zinc-500 mt-1 flex items-center gap-0.5">
                        <IoWalkOutline /> {Math.max(1, Math.round(distance / 80))} perc ({formatDistance(distance)})
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* BOTTOM: Scrollable Bento grid menu dashboard */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="flex flex-col gap-5">
            
            {/* Welcome message */}
            <div className="flex flex-col gap-1 shrink-0">
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none uppercase">
                {t('home.welcome')}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex items-center gap-1.5">
                <IoLocationOutline className="text-indigo-500 dark:text-indigo-400 text-base" />
                {t('home.location')}
              </p>
            </div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-2 gap-4">
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(item.to)}
                    className={`
                      ${item.span} relative rounded-[2rem] p-5 cursor-pointer overflow-hidden group
                      bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                      shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300
                      hover:scale-[1.005] active:scale-[0.98] flex flex-col justify-between gap-5
                      ${item.highlight ? 'ring-2 ring-rose-500/10 dark:ring-rose-500/5' : ''}
                    `}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-[0.08] dark:opacity-[0.15] blur-3xl rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500`} />
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${item.gradient} text-white shadow-sm group-hover:rotate-3 group-hover:scale-105 transition-all duration-300`}><Icon /></div>
                      {item.highlight && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-500 text-[9px] font-black tracking-wider uppercase border border-rose-500/15">
                          <span className="w-1.2 h-1.2 bg-rose-500 rounded-full" />{t('home.free')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {t(item.labelKey)}
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold leading-relaxed">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
