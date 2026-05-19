// src/pages/Kiosk/KioskHome.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline, IoMapOutline, IoRestaurantOutline,
  IoCameraOutline, IoSparklesOutline, IoLocationOutline,
  IoCompassOutline, IoGlobeOutline
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import KioskFlag from '../../components/Kiosk/KioskFlag';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { supabase } from '../../lib/supabaseClient';

const LANGS = [
  { code: 'hu', label: 'HU' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

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
    // Shuffle the photos to show them in a randomized order each time
    return [...photos].sort(() => Math.random() - 0.5);
  }, [showScreensaver]);

  useEffect(() => {
    if (!showScreensaver) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % screensaverImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showScreensaver, screensaverImages.length]);

  useEffect(() => {
    const handleIdleTrigger = () => {
      sessionStorage.setItem('kiosk-started', 'false');
      setShowScreensaver(true);
    };
    window.addEventListener('kiosk-idle-trigger', handleIdleTrigger);
    return () => window.removeEventListener('kiosk-idle-trigger', handleIdleTrigger);
  }, []);

  // Fetch visitor wall photos whenever screensaver becomes active
  useEffect(() => {
    if (!showScreensaver) return;
    supabase
      .from('kiosk_visitor_messages')
      .select('id, photo_url, visitor_name, message')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data?.length) setVisitorPhotos(data); })
      .catch(() => {});
  }, [showScreensaver]);

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
  ];

  if (showScreensaver) {
    return (
      <div onClick={handleStart} className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col justify-between cursor-pointer select-none">
        <div className="absolute inset-0 z-0 bg-black">
          {screensaverImages.map((img, idx) => (
            <div key={idx} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-55' : 'opacity-0'}`} style={{ backgroundImage: `url(${img})` }} />
          ))}
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
                  {/* Glassmorphic overlay for name & message at the bottom */}
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
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-8 select-none">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none uppercase">{t('home.welcome')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold flex items-center gap-1.5">
            <IoLocationOutline className="text-indigo-500 dark:text-indigo-400 text-base" />
            {t('home.location')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.to)}
                className={`${item.span} relative rounded-[2rem] p-6 cursor-pointer overflow-hidden group bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] flex flex-col justify-between gap-6 ${item.highlight ? 'ring-2 ring-rose-500/20 dark:ring-rose-500/10' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-[0.08] dark:opacity-[0.15] blur-3xl rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500`} />
                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:rotate-3 group-hover:scale-105 transition-all duration-300`}><Icon /></div>
                  {item.highlight && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-500 text-[10px] font-black tracking-wider uppercase border border-rose-500/20">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />{t('home.free')}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 relative z-10">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t(item.labelKey)}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">{t(item.descKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
