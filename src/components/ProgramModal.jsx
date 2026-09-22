/* --- FÁJL: ProgramModal.jsx (Többnyelvű, dinamikus visszaszámláló) --- */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { parseISO, isSameDay, isBefore, isAfter, format, isValid, startOfDay, differenceInDays } from 'date-fns';
import { hu, enUS, de } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  IoClose,
  IoInformationCircleOutline,
  IoWineOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoNavigateOutline,
  IoStar,
  IoStarOutline,
  IoRadioOutline,
  IoListOutline,
  IoCarOutline,
  IoWarningOutline,
  IoNotificationsOutline,
  IoCheckmarkCircleOutline,
  IoPlaySkipForwardOutline
} from 'react-icons/io5';
import ProgramDetailsSheet from './ProgramDetailsSheet';
import { useFavorites } from '../contexts/FavoritesContext';

const localeMap = { hu, en: enUS, de };

// ---- Helpers ----
function safeParseISO(s) { if (!s) return null; try { const d = parseISO(s); return isValid(d) ? d : null; } catch { return null; } }

function EventCard({ event, onSelect, isFavorite, onToggleFavorite, userLocation }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const cls = "p-3 rounded-card border-l-4 cursor-pointer transition mb-2 bg-surface-card dark:bg-surface-card-dark shadow-card hover:shadow-floating " + (isFavorite ? "border-gold" : "border-brand/30 dark:border-brand-light/30");
  return (
    <div className={cls} onClick={() => onSelect(event)}>
      <div className="flex items-start justify-between">
        <div className="flex-grow pr-2">
          <p className="font-bold text-brand dark:text-white">{event.nev?.[lang] || event.nev?.hu}</p>
          <div className="text-sm mt-1 text-slate-600 dark:text-zinc-300 space-y-1">
            <p className="flex items-center gap-1.5"><IoLocationOutline className="shrink-0" />{event.helyszin?.nev?.[lang] || event.helyszin?.nev?.hu}</p>
            <p className="flex items-center gap-1.5"><IoTimeOutline className="shrink-0" />{format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }} className="p-2 text-xl flex-shrink-0" aria-label={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}>
          {isFavorite ? <IoStar className="text-gold transition-transform duration-200 transform hover:scale-125" /> : <IoStarOutline className="text-slate-400 dark:text-zinc-500 transition-transform duration-200 transform hover:scale-125" />}
        </button>
      </div>
      {userLocation && event.helyszin?.lat && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${event.helyszin.lat},${event.helyszin.lng}&travelmode=walking`}
          target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gold-text dark:text-gold-light underline hover:opacity-80"
          onClick={e => e.stopPropagation()}
        ><IoNavigateOutline />{t('programModal.routePlanner')}</a>
      )}
    </div>
  );
}

function InfoModal({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-surface-card dark:bg-surface-card-dark rounded-surface shadow-floating max-w-md w-full p-6 relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand/5 dark:bg-white/10 text-brand dark:text-white flex items-center justify-center hover:opacity-80 transition" aria-label="Bezárás">
          <IoClose className="text-lg" />
        </button>
        <h2 className="text-xl font-extrabold text-brand dark:text-white mb-4 flex items-center gap-2">
          <IoInformationCircleOutline className="text-gold-text dark:text-gold-light text-2xl" />
          {t('infoModal.title')}
        </h2>
        <ul className="space-y-4 text-slate-700 dark:text-zinc-300">
          <li className="flex items-start gap-3"><IoRadioOutline className="text-xl mt-0.5 text-gold-text dark:text-gold-light shrink-0" /><div><Trans i18nKey="infoModal.item1" components={{ strong: <strong className="text-brand dark:text-white" /> }} /></div></li>
          <li className="flex items-start gap-3"><IoListOutline className="text-xl mt-0.5 text-gold-text dark:text-gold-light shrink-0" /><div><Trans i18nKey="infoModal.item2" components={{ strong: <strong className="text-brand dark:text-white" /> }} /></div></li>
          <li className="flex items-start gap-3"><IoStarOutline className="text-xl mt-0.5 text-gold-text dark:text-gold-light shrink-0" /><div><Trans i18nKey="infoModal.item3" components={{ strong: <strong className="text-brand dark:text-white" /> }} /></div></li>
          <li className="flex items-start gap-3"><IoWineOutline className="text-xl mt-0.5 text-gold-text dark:text-gold-light shrink-0" /><div><Trans i18nKey="infoModal.item4" components={{ strong: <strong className="text-brand dark:text-white" /> }} /></div></li>
        </ul>
        <div className="mt-6 text-center">
          <button onClick={onClose} className="bg-brand hover:opacity-90 text-gold-light font-bold py-2.5 px-6 rounded-full border border-gold/40 transition">{t('infoModal.button')}</button>
        </div>
      </div>
    </div>
  );
}

function TrafficInfo() {
  const { t } = useTranslation();
  const items = t('programModal.traffic.items', { returnObjects: true });
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="animate-fadein">
      <div className="mb-4 p-4 rounded-card bg-gold-soft dark:bg-gold/10 border border-gold/30 flex items-start gap-3">
        <IoWarningOutline className="text-xl text-gold-text dark:text-gold-light shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-brand dark:text-gold-light">{t('programModal.traffic.intro')}</p>
      </div>
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="p-4 rounded-card bg-surface-card dark:bg-surface-card-dark shadow-card">
            <h4 className="flex items-center gap-2 font-bold text-brand dark:text-white text-sm mb-1.5">
              <IoCarOutline className="text-gold-text dark:text-gold-light shrink-0" />
              {item.title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mt-4">{t('programModal.traffic.footer')}</p>
    </div>
  );
}

// ---- Countdown widgets ----
function CountdownToNext({ targetDate }) {
  const { t } = useTranslation();
  const calc = useCallback(() => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isOver: false
    };
  }, [targetDate]);
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => { const t = setInterval(() => setTimeLeft(calc()), 1000); return () => clearInterval(t); }, [calc]);
  if (timeLeft.isOver) return <span className="font-bold text-emerald-600 text-2xl">{t('programModal.nowStarting')}</span>;
  return (
    <div className="flex justify-center items-baseline space-x-2 sm:space-x-4 font-mono tabular-nums">
      {timeLeft.days > 0 && (<div className="text-center"><span className="text-4xl font-bold text-brand dark:text-white">{timeLeft.days}</span><span className="block text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t('programModal.timeUnits.day')}</span></div>)}
      <div className="text-center"><span className="text-4xl font-bold text-brand dark:text-white">{String(timeLeft.hours).padStart(2, '0')}</span><span className="block text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t('programModal.timeUnits.hour')}</span></div>
      <div className="text-center"><span className="text-4xl font-bold text-brand dark:text-white">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="block text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t('programModal.timeUnits.minute')}</span></div>
      <div className="text-center"><span className="text-4xl font-bold text-brand dark:text-white">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="block text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t('programModal.timeUnits.second')}</span></div>
    </div>
  );
}

function InlineCountdown({ targetDate }) {
  const { t } = useTranslation();
  const calc = useCallback(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { over: true };
    return { hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60), over: false };
  }, [targetDate]);
  const [tl, setTl] = useState(calc);
  useEffect(() => { const t = setInterval(() => setTl(calc()), 1000); return () => clearInterval(t); }, [calc]);
  if (tl.over) return <span className="text-emerald-600 font-semibold animate-pulse">{t('programModal.nowStartingInline')}</span>;
  const parts = [];
  if (tl.hours > 0) parts.push(`${tl.hours} ${t('programModal.inlineTimeUnits.hour')}`);
  if (tl.minutes > 0) parts.push(`${tl.minutes} ${t('programModal.inlineTimeUnits.minute')}`);
  if (tl.hours === 0 && tl.minutes < 10) parts.push(`${tl.seconds} ${t('programModal.inlineTimeUnits.second')}`);
  return <span className="text-gold-text dark:text-gold-light font-semibold">{t('programModal.inlineCountdownFormat', { parts: parts.join(' ') })}</span>;
}

// ---- Main component ----
export default function ProgramModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const locale = localeMap[lang] || hu;

  const [view, setView] = useState('today');
  // Use global useFavorites hook
  const { favorites, toggleFavorite } = useFavorites();
  const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' && window.Notification ? Notification.permission : 'unsupported');
  const [weatherData, setWeatherData] = useState(null);
  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [nextEvents, setNextEvents] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Dinamikus legkorábbi jövőbeli kezdés számítása
  const computeFestivalStart = useCallback((list) => {
    const future = list.filter(e => e.start.getTime() > Date.now()).map(e => e.start.getTime());
    const all = list.map(e => e.start.getTime());
    const ts = (future.length ? Math.min(...future) : (all.length ? Math.min(...all) : null));
    return ts ? new Date(ts) : null;
  }, []);

  const evaluateEvents = useCallback(() => {
    if (events.length === 0) return;
    const now = new Date();
    const today = events.filter(e => isSameDay(e.start, now));
    const curr = today.filter(e => isBefore(e.start, now) && isAfter(e.end, now));
    const nextToday = today.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
    setCurrentEvents(curr);
    if (nextToday.length > 0) {
      const nextGroup = nextToday.filter(e => e.start.getTime() === nextToday[0].start.getTime());
      setNextEvents(nextGroup);
    } else {
      const allFuture = events.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
      if (allFuture.length > 0) {
        const nextGroup = allFuture.filter(e => e.start.getTime() === allFuture[0].start.getTime());
        setNextEvents(nextGroup);
      } else {
        setNextEvents([]);
      }
    }
  }, [events]);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch('/data/programok.json');
        if (!resp.ok) throw new Error(`Hálózati hiba: ${resp.statusText}`);
        const daily = await resp.json();
        if (!Array.isArray(daily)) throw new Error("A programok.json formátuma nem megfelelő (nem tömb).");

        const flat = daily.flatMap(d => Array.isArray(d?.esemenyek) ? d.esemenyek : []);
        const parsed = flat.map(p => {
          const start = safeParseISO(p.idopont);
          if (!start) return null;
          const end = safeParseISO(p.veg_idopont) || new Date(start.getTime() + 60 * 60000);
          return { ...p, start, end, kiemelt: !!p.kiemelt };
        }).filter(Boolean);

        setEvents(parsed);

        // Weather (opcionális)
        fetch('/.netlify/functions/weather-proxy?type=weather&lang=hu')
          .then(r => r.json())
          .then(d => { if (d && (d.cod === 200 || d.main)) setWeatherData({ temp: Math.round(d.main.temp), description: d.weather[0].description, icon: d.weather[0].icon }); })
          .catch(() => { });

        // Induló visszaszámláló célpont beállítása az első eseményhez
        const start = computeFestivalStart(parsed);
        if (start) {
          const calc = () => {
            const diff = start.getTime() - Date.now();
            return {
              days: Math.max(0, Math.floor(diff / 86400000)),
              hours: Math.max(0, Math.floor((diff / 3600000) % 24)),
              minutes: Math.max(0, Math.floor((diff / 60000) % 60)),
              seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
              isOver: diff < 0
            };
          };
          setTimeLeft(calc());
          const t = setInterval(() => setTimeLeft(calc()), 1000);
          return () => clearInterval(t);
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        }
      } catch (e) {
        setError(e.message || 'Ismeretlen hiba történt a programok betöltésekor.');
      } finally {
        setIsLoading(false);
      }
    }
    const cleanup = load();
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('Helymeghatározás hiba:', err.message)
    );
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => { });
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [computeFestivalStart]);

  useEffect(() => {
    const eventCheck = setInterval(evaluateEvents, 10000);
    evaluateEvents();
    return () => clearInterval(eventCheck);
  }, [evaluateEvents]);

  useEffect(() => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const favDetails = events.filter(e => favorites.includes(String(e.id)));
      navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_FAVORITES', favorites: favDetails });
    }
  }, [favorites, events]);

  const handleNotificationPermission = () => { if (window.Notification) Notification.requestPermission().then(setNotificationPermission); };

  // Safe comparison with String(e.id)
  const isFavoriteProgram = (id) => favorites.includes(String(id));
  const favoriteEvents = useMemo(() => events.filter(e => isFavoriteProgram(e.id)).sort((a, b) => a.start - b.start), [events, favorites]);

  const fullProgramGrouped = useMemo(() => events.reduce((acc, e) => {
    const key = startOfDay(e.start).getTime();
    if (!acc[key]) acc[key] = { date: e.start, events: [] };
    acc[key].events.push(e);
    return acc;
  }, {}), [events]);

  const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const mapFocusEvent = currentEvents.length > 0 ? currentEvents[0] : nextEvents[0];

  const tabs = [
    { id: 'today', label: t('programModal.live'), icon: IoRadioOutline },
    { id: 'full', label: t('programModal.fullProgram'), icon: IoListOutline },
    { id: 'favorites', label: t('programModal.favorites'), icon: IoStarOutline },
    { id: 'traffic', label: t('programModal.trafficTab'), icon: IoCarOutline }
  ];

  return (
    <>
      <div className="fixed inset-y-4 sm:inset-y-8 inset-x-2 sm:inset-x-0 z-[999] px-2 pb-4 pointer-events-none">
        <div className="max-w-3xl mx-auto flex flex-col h-full pointer-events-auto">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-brand text-white p-3 rounded-t-surface shadow-floating flex justify-between items-center border-b border-gold/30">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <IoWineOutline className="text-gold-light" />
                {t('programModal.title')}
              </h2>
              <button onClick={() => setShowInfoModal(true)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition" aria-label="Súgó">
                <IoInformationCircleOutline className="text-lg" />
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {weatherData && (
                <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                  <img src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} alt={weatherData.description} className="w-6 h-6" />
                  <span className="text-sm font-bold tabular-nums">{weatherData.temp}°C</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full">
                <button onClick={() => i18n.changeLanguage('hu')} className={`px-2 h-6 rounded-full text-[11px] font-bold transition flex items-center justify-center ${lang === 'hu' ? 'bg-gold text-brand' : 'text-white/70 hover:text-white'}`} aria-label="Magyar">HU</button>
                <button onClick={() => i18n.changeLanguage('en')} className={`px-2 h-6 rounded-full text-[11px] font-bold transition flex items-center justify-center ${lang === 'en' ? 'bg-gold text-brand' : 'text-white/70 hover:text-white'}`} aria-label="English">EN</button>
                <button onClick={() => i18n.changeLanguage('de')} className={`px-2 h-6 rounded-full text-[11px] font-bold transition flex items-center justify-center ${lang === 'de' ? 'bg-gold text-brand' : 'text-white/70 hover:text-white'}`} aria-label="Deutsch">DE</button>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition" aria-label="Bezárás">
                <IoClose className="text-lg" />
              </button>
            </div>
          </div>

          {/* Global countdown to first event */}
          {!timeLeft.isOver && (
            <div className="sticky top-[58px] z-10 bg-brand-deep/95 backdrop-blur-sm text-white text-center p-2 shadow-inner">
              <span className="font-mono text-sm tabular-nums">
                {t('programModal.countdownPrefix')}{' '}
                {t('programModal.countdownFormat', { days: timeLeft.days, hours: timeLeft.hours, minutes: timeLeft.minutes, seconds: timeLeft.seconds })}
              </span>
            </div>
          )}

          {/* Body */}
          <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-b-surface shadow-floating flex-grow overflow-y-auto">
            <div className="mb-4 flex overflow-x-auto no-scrollbar border-b border-brand/10 dark:border-white/10">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap transition-colors ${view === id ? 'border-gold text-gold-text dark:text-gold-light' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-white'}`}
                >
                  <Icon className="text-base" />
                  {label}
                </button>
              ))}
            </div>

            {view !== 'traffic' && isLoading ? (
              <div className="text-center py-10"><p className="text-lg font-semibold text-gold-text dark:text-gold-light">Programok betöltése...</p></div>
            ) : view !== 'traffic' && error ? (
              <div className="text-center py-10 bg-red-50 dark:bg-red-900/30 p-4 rounded-card">
                <p className="text-lg font-bold text-red-700 dark:text-red-300">Hiba történt!</p>
                <p className="text-sm text-red-600 dark:text-red-200 mt-1">{error}</p>
              </div>
            ) : (
              <>
                {view !== 'traffic' && notificationPermission === 'default' && (
                  <div className="bg-gold-soft dark:bg-gold/10 border border-gold/30 text-brand dark:text-gold-light p-3 rounded-card mb-4 text-center animate-fadein">
                    <p className="font-semibold mb-2 flex items-center justify-center gap-2"><IoNotificationsOutline />Szeretnél értesítést kapni, mielőtt a kedvenc programjaid kezdődnek?</p>
                    <button onClick={handleNotificationPermission} className="bg-brand hover:opacity-90 text-gold-light font-bold py-1.5 px-4 rounded-full border border-gold/40">Értesítések engedélyezése</button>
                  </div>
                )}
                {view !== 'traffic' && notificationPermission === 'denied' && (<p className="text-xs text-center text-slate-500 dark:text-zinc-400 mb-4">Az értesítések le vannak tiltva a böngésződben. A beállításokban tudod engedélyezni.</p>)}

                {view === 'today' && (
                  <>
                    {events.length > 0 && currentEvents.length === 0 && nextEvents.length === 0 && (
                      <p className="text-center text-lg text-gold-text dark:text-gold-light italic py-6 flex items-center justify-center gap-2"><IoCheckmarkCircleOutline />{t('programModal.festivalOver')}</p>
                    )}

                    <div className="mb-6">
                      {currentEvents.length > 0 ? (
                        <div className="animate-fadein">
                          <h3 className="section-title border-brand/20 dark:border-white/10 text-brand dark:text-white flex items-center gap-2"><IoRadioOutline className="text-gold-text dark:text-gold-light" />{t('programModal.currentlyRunning')} ({currentEvents.length})</h3>
                          {currentEvents.map(e => (
                            <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={isFavoriteProgram(e.id)} onToggleFavorite={toggleFavorite} userLocation={userLocation} />
                          ))}
                        </div>
                      ) : nextEvents.length > 0 && (
                        <div className="text-center bg-surface-card dark:bg-surface-card-dark shadow-card p-4 rounded-card animate-fadein">
                          <p className="text-lg font-semibold text-brand dark:text-white">{t('programModal.noCurrentEvent')}</p>
                          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{t('programModal.countdownStartsIn')}</p>
                          <div className="mt-2"><CountdownToNext targetDate={nextEvents[0].start} /></div>
                        </div>
                      )}
                    </div>

                    {nextEvents.length > 0 && (
                      <div className="mb-4 animate-fadein">
                        <h3 className="section-title border-brand/20 dark:border-white/10 text-brand dark:text-white flex items-baseline gap-2">
                          <span className="flex items-center gap-2"><IoPlaySkipForwardOutline className="text-gold-text dark:text-gold-light" />{t('programModal.nextEvent')}</span>
                          {isSameDay(nextEvents[0].start, new Date())
                            ? <InlineCountdown targetDate={nextEvents[0].start} />
                            : <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">
                              {format(nextEvents[0].start, "PPPPp", { locale })}
                            </span>
                          }
                        </h3>
                        {nextEvents.map(e => (
                          <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={isFavoriteProgram(e.id)} onToggleFavorite={toggleFavorite} userLocation={userLocation} />
                        ))}
                      </div>
                    )}

                    {userLocation && mapFocusEvent && (
                      <div className="mt-6">
                        <div className="mb-2 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-brand dark:text-white">{currentEvents.length > 0 ? t('programModal.currentlyRunning') : t('programModal.nextEvent')}</h4>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">{mapFocusEvent.helyszin?.nev?.[lang] || mapFocusEvent.helyszin?.nev?.hu}</p>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${mapFocusEvent.helyszin.lat},${mapFocusEvent.helyszin.lng}&travelmode=walking`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold text-gold-text dark:text-gold-light underline hover:opacity-80 flex items-center gap-1.5"
                          ><IoNavigateOutline /><span>{t('programModal.takeMeThere')}</span></a>
                        </div>
                        <div className="h-[250px] rounded-card overflow-hidden border border-brand/20 dark:border-white/10">
                          <MapContainer center={[mapFocusEvent.helyszin.lat, mapFocusEvent.helyszin.lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[userLocation.lat, userLocation.lng]}><Popup>Itt vagy</Popup></Marker>
                            {currentEvents.map(e => (
                              <Marker key={`map-curr-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}>
                                <Popup><strong>{e.nev?.[lang] || e.nev?.hu}</strong><br />{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</Popup>
                              </Marker>
                            ))}
                            {nextEvents.map(e => !currentEvents.some(c => c.id === e.id) && (
                              <Marker key={`map-next-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]} icon={blueIcon}>
                                <Popup><strong>{e.nev?.[lang] || e.nev?.hu}</strong><br />{t('programModal.startsAt')} {format(e.start, 'HH:mm')}</Popup>
                              </Marker>
                            ))}
                          </MapContainer>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {view === 'full' && (
                  <div className="space-y-6 animate-fadein">
                    {Object.values(fullProgramGrouped)
                      .sort((a, b) => a.date - b.date)
                      .map(({ date, events: dayEvents }) => (
                        <div key={date.getTime()}>
                          <h3 className="section-title border-brand/20 dark:border-white/10 text-brand dark:text-white capitalize">
                            {format(date, 'MMMM d. (eeee)', { locale })}
                          </h3>
                          {dayEvents.sort((a, b) => a.start - b.start).map(event => (
                            <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isFavorite={isFavoriteProgram(event.id)} onToggleFavorite={toggleFavorite} userLocation={userLocation} />
                          ))}
                        </div>
                      ))}
                  </div>
                )}

                {view === 'favorites' && (
                  <div className="animate-fadein">
                    {favoriteEvents.length > 0 ? (
                      favoriteEvents.map(event => (
                        <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isFavorite={true} onToggleFavorite={toggleFavorite} userLocation={userLocation} />
                      ))
                    ) : (
                      <p className="text-center text-lg text-gold-text dark:text-gold-light italic py-6">
                        {t('programModal.favoritesEmptyTitle')}<br />{t('programModal.favoritesEmptySubtitle')}
                      </p>
                    )}
                  </div>
                )}

                {view === 'traffic' && <TrafficInfo />}
              </>
            )}
          </div>
        </div>
      </div>

      <ProgramDetailsSheet program={selectedProgram} onClose={() => setSelectedProgram(null)} />
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </>
  );
}
