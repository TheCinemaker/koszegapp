import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { parseISO, isSameDay, isBefore, isAfter, format, isValid, startOfDay, differenceInDays } from 'date-fns';
import { hu } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  IoArrowBack, 
  IoStarOutline, 
  IoStar, 
  IoLocation, 
  IoTime, 
  IoInformationCircleOutline, 
  IoClose, 
  IoMapOutline, 
  IoCalendarOutline, 
  IoFlashOutline, 
  IoCompassOutline,
  IoPulseOutline,
  IoPlayForwardOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

// --- HELPER FUNCTIONS ---
function safeParseISO(dateString) {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error(`Invalid date format: "${dateString}"`, error);
    return null;
  }
}

function useOstromFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('ostromFavorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error loading favorites:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ostromFavorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Error saving favorites:", e);
    }
  }, [favorites]);

  const toggleFavorite = (eventId) => {
    setFavorites(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  return { favorites, toggleFavorite };
}

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- PROGRAM CARD COMPONENT ---
function EventCard({ event, onSelect, isFavorite, onToggleFavorite, userLocation }) {
  return (
    <div 
      className={`p-5 rounded-2xl border-l-4 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md mb-4 flex flex-col justify-between
        ${isFavorite 
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-l-amber-500 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-gray-100' 
          : 'bg-white dark:bg-zinc-900 border-l-indigo-500 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-gray-100'
        }
      `}
      onClick={() => onSelect(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          {event.kiemelt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2.5 border border-rose-500/20">
              <IoFlashOutline className="text-xs" /> Kiemelt
            </span>
          )}
          <h4 className="font-extrabold text-base md:text-lg leading-tight tracking-tight">{event.nev}</h4>
          
          <div className="text-xs md:text-sm mt-3 space-y-2 opacity-90">
            <p className="flex items-center gap-2">
              <IoLocation className="text-indigo-500 dark:text-indigo-400 text-sm flex-shrink-0" />
              <span className="font-medium">{event.helyszin.nev}</span>
            </p>
            <p className="flex items-center gap-2">
              <IoTime className="text-indigo-500 dark:text-indigo-400 text-sm flex-shrink-0" />
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
              </span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleFavorite(event.id); 
          }} 
          className="p-2 text-2xl flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-full"
          aria-label={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
        >
          {isFavorite ? (
            <IoStar className="text-amber-500 scale-110 hover:scale-125 transition-transform" />
          ) : (
            <IoStarOutline className="text-gray-400 dark:text-zinc-500 hover:scale-125 transition-transform" />
          )}
        </button>
      </div>

      {userLocation && event.helyszin?.lat && (
        <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${event.helyszin.lat},${event.helyszin.lng}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:opacity-90 flex items-center gap-1.5 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <IoCompassOutline className="text-sm" /> Útvonalterv (Gyalog)
          </a>
        </div>
      )}
    </div>
  );
}

// --- COUNTDOWNS ---
function CountdownToNext({ targetDate }) {
  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isOver: false,
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (timeLeft.isOver) {
    return <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg uppercase tracking-wider">Most kezdődik!</span>;
  }

  return (
    <div className="flex justify-center items-center space-x-2 font-mono">
      {timeLeft.days > 0 && (
        <div className="bg-amber-950/10 dark:bg-white/5 border border-amber-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-center min-w-[60px]">
          <span className="text-2xl font-black block leading-none">{timeLeft.days}</span>
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mt-1">Nap</span>
        </div>
      )}
      <div className="bg-amber-950/10 dark:bg-white/5 border border-amber-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-center min-w-[60px]">
        <span className="text-2xl font-black block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mt-1">Óra</span>
      </div>
      <div className="bg-amber-950/10 dark:bg-white/5 border border-amber-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-center min-w-[60px]">
        <span className="text-2xl font-black block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mt-1">Perc</span>
      </div>
      <div className="bg-amber-950/10 dark:bg-white/5 border border-amber-900/10 dark:border-white/10 rounded-xl px-3 py-2 text-center min-w-[60px]">
        <span className="text-2xl font-black block leading-none text-amber-700 dark:text-amber-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block mt-1">Mp</span>
      </div>
    </div>
  );
}

function InlineCountdown({ targetDate }) {
  const calculateTimeLeft = useCallback(() => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) return { over: true };
    return {
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      over: false,
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (timeLeft.over) {
    return <span className="text-emerald-600 dark:text-emerald-400 font-bold">Azonnal kezdődik!</span>;
  }

  const parts = [];
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} óra`);
  if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes} perc`);
  if (timeLeft.hours === 0 && timeLeft.minutes < 10) parts.push(`${timeLeft.seconds} mp`);

  return (
    <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">
      ({parts.join(' ')} múlva)
    </span>
  );
}

// --- INFO MODAL (HELP) ---
function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md px-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl max-w-md w-full p-6 relative border border-gray-100 dark:border-zinc-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          <IoClose />
        </button>
        <h2 className="text-lg font-black text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
          <IoInformationCircleOutline className="text-2xl" /> Használati útmutató
        </h2>
        <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-3">
            <IoPulseOutline className="text-amber-700 dark:text-amber-400 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <strong>Élő nézet:</strong> Mindig megmutatja, hogy mi zajlik most, és mi kezdődik legközelebb a városban.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <IoCalendarOutline className="text-amber-700 dark:text-amber-400 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <strong>Teljes Program:</strong> Kereshető és szűrhető programnaptár a teljes hétvégére, napokra bontva.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <IoStarOutline className="text-amber-700 dark:text-amber-400 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <strong>Kedvencek:</strong> Jelöld be a kedvenc programjaidat a csillaggal, így offline módban is azonnal elérd őket a Kedvencek fül alatt.
            </div>
          </li>
        </ul>
        <div className="mt-6 text-center">
          <button 
            onClick={onClose} 
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl transition shadow-md focus:outline-none"
          >
            Értettem!
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function OstromPage() {
  const location = useLocation();

  // Query parameter toggle (?demo=true)
  const queryParams = new URLSearchParams(location.search);
  const isDemoMode = queryParams.get('demo') === 'true' || queryParams.get('test') === 'true';

  const [view, setView] = useState('today');
  const { favorites, toggleFavorite } = useOstromFavorites();
  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [nextEvents, setNextEvents] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Ostromnapok Official Start (2026. augusztus 7. 10:00)
  const ostromStart = useMemo(() => new Date('2026-08-07T10:00:00'), []);
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = ostromStart - new Date();
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
      isOver: diff < 0
    };
  });

  // Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = ostromStart - new Date();
      setTimeLeft({
        days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
        minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
        seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
        isOver: diff < 0
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ostromStart]);

  // Evaluate current and upcoming events
  const evaluateEvents = useCallback(() => {
    if (events.length === 0) {
      setCurrentEvents([]);
      setNextEvents([]);
      return;
    }
    const now = new Date();
    const today = events.filter(e => isSameDay(e.start, now));
    const curr = today.filter(e => isBefore(e.start, now) && isAfter(e.end, now));
    const nextToday = today.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
    
    setCurrentEvents(curr);
    
    if (nextToday.length > 0) {
      const nextGroup = nextToday.filter(e => e.start.getTime() === nextToday[0].start.getTime());
      setNextEvents(nextGroup);
    } else {
      const allFutureEvents = events.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
      if (allFutureEvents.length > 0) {
        const nextGroup = allFutureEvents.filter(e => e.start.getTime() === allFutureEvents[0].start.getTime());
        setNextEvents(nextGroup);
      } else {
        setNextEvents([]);
      }
    }
  }, [events]);

  // Fetch JSON files
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const dataPath = isDemoMode ? '/data/programok_demo.json' : '/data/ostrom_programok.json';
        const resp = await fetch(dataPath);
        if (!resp.ok) throw new Error(`Fetch error: ${resp.statusText}`);
        
        const data = await resp.json();
        const allEvents = Array.isArray(data) 
          ? data.flatMap(dayObj => Array.isArray(dayObj.esemenyek) ? dayObj.esemenyek : [])
          : [];
        
        const parsedEvents = allEvents.map(event => {
          const start = safeParseISO(event.idopont);
          if (!start) return null;
          const end = safeParseISO(event.veg_idopont) || new Date(start.getTime() + 60 * 60 * 1000);
          return {
            ...event,
            start,
            end,
            kiemelt: !!event.kiemelt
          };
        }).filter(Boolean);
        
        setEvents(parsedEvents);
      } catch (err) {
        console.error("Error loading program schedule:", err);
        setError(err.message || "Hiba történt az adatok feldolgozásakor.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation warning:', err.message)
      );
    }
  }, [isDemoMode]);

  // Evaluator loop
  useEffect(() => {
    evaluateEvents();
    const eventCheckTimer = setInterval(evaluateEvents, 10000);
    return () => clearInterval(eventCheckTimer);
  }, [evaluateEvents]);

  // Filtered Favorites
  const favoriteEvents = useMemo(() => {
    return events.filter(e => favorites.includes(e.id)).sort((a, b) => a.start - b.start);
  }, [events, favorites]);

  // Grouped schedule day-by-day
  const fullProgramGrouped = useMemo(() => {
    return events.reduce((acc, event) => {
      const dayKey = startOfDay(event.start).getTime();
      if (!acc[dayKey]) {
        acc[dayKey] = { date: event.start, events: [] };
      }
      acc[dayKey].events.push(event);
      return acc;
    }, {});
  }, [events]);

  const mapFocusEvent = currentEvents.length > 0 ? currentEvents[0] : nextEvents[0];

  const getNextEventDayInfo = () => {
    if (!nextEvents || nextEvents.length === 0) return "";
    const nextDate = nextEvents[0].start;
    const now = new Date();
    if (isSameDay(nextDate, now)) return "";
    const dayDiff = differenceInDays(startOfDay(nextDate), startOfDay(now));
    if (dayDiff === 1) return `(Holnap, ${format(nextDate, 'HH:mm')}-kor)`;
    return `(${dayDiff} nap múlva, ${format(nextDate, 'eeee', { locale: hu })})`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans antialiased">
      {/* TEST MODE WARNING (No emojis) */}
      {isDemoMode && (
        <div className="bg-red-700 text-white text-center py-2 px-4 text-xs font-semibold z-30 shadow-md">
          TESZT ÜZEMMÓD: A tesztprogramok percre pontosan futnak. (Teszt dátum: 2025. július 24.)
        </div>
      )}

      {/* STUNNING HERO HEADER (Mobile-first, high impact with user custom image) */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-zinc-900 shadow-md">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700"
          style={{ backgroundImage: `url('/images/ostrom_2026/ostromhero.png')` }}
        />
        {/* Gradient Overlay for high-end text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-zinc-950/25 to-black/55 dark:from-zinc-950 dark:via-zinc-950/30 dark:to-black/60" />
        
        {/* Floating Actions on Top (Glassmorphic) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <Link 
            to="/" 
            className="p-2.5 rounded-full bg-black/45 dark:bg-zinc-900/50 backdrop-blur-md text-white hover:bg-black/60 transition active:scale-90 border border-white/10"
            aria-label="Vissza"
          >
            <IoArrowBack className="text-lg" />
          </Link>
          <button 
            onClick={() => setShowHelpModal(true)} 
            className="p-2.5 rounded-full bg-black/45 dark:bg-zinc-900/50 backdrop-blur-md text-white hover:bg-black/60 transition active:scale-90 border border-white/10" 
            aria-label="Információ"
          >
            <IoInformationCircleOutline className="text-lg" />
          </button>
        </div>

        {/* Text Overlay at bottom of Hero */}
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-600 border border-amber-500 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
            Kiemelt rendezvény
          </span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase text-white drop-shadow-md mt-2">
            XIX. Ostromnapok
          </h1>
          <p className="text-xs font-bold tracking-widest text-amber-300 drop-shadow-md mt-0.5">
            2026. augusztus 7. – 9.
          </p>
        </div>
      </div>

      {/* COUNTDOWN BANNER (OFFICIAL COUNTDOWN ONLY) */}
      {!timeLeft.isOver && !isDemoMode && (
        <div className="bg-amber-900/10 dark:bg-zinc-900/30 text-gray-800 dark:text-white text-center p-4 border-b border-gray-200 dark:border-zinc-900 z-10">
          <p className="text-[10px] uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-2 font-black">Kezdésig hátralévő idő</p>
          <CountdownToNext targetDate={ostromStart} />
        </div>
      )}

      {/* CORE CONTAINER */}
      <main className="flex-grow max-w-3xl w-full mx-auto p-4 flex flex-col justify-between">
        
        {/* VIEW NAVIGATION TABS (Premium pill selector) */}
        <div className="mb-6 flex bg-gray-200/60 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-gray-300/10">
          <button 
            onClick={() => setView('today')} 
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold tracking-wide transition duration-300 flex items-center justify-center gap-1.5
              ${view === 'today' 
                ? 'bg-indigo-500 text-white shadow-md font-bold' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
          >
            <IoPulseOutline className="text-base" /> Élő
          </button>
          <button 
            onClick={() => setView('full')} 
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold tracking-wide transition duration-300 flex items-center justify-center gap-1.5
              ${view === 'full' 
                ? 'bg-indigo-500 text-white shadow-md font-bold' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
          >
            <IoCalendarOutline className="text-base" /> Teljes Program
          </button>
          <button 
            onClick={() => setView('favorites')} 
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-extrabold tracking-wide transition duration-300 flex items-center justify-center gap-1.5
              ${view === 'favorites' 
                ? 'bg-indigo-500 text-white shadow-md font-bold' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
          >
            <IoStar className="text-base" /> Kedvencek
          </button>
        </div>

        {/* CONTENT SWITCH */}
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <LoadingSpinner fullScreen={false} label="Programok betöltése..." />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-6 rounded-3xl">
            <IoAlertCircleOutline className="text-4xl text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="text-base font-bold text-red-700 dark:text-red-400">Hiba történt a betöltéskor</p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            
            {/* LIVE TAB */}
            {view === 'today' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Clean Coming Soon block for empty main database */}
                {events.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 dark:border-zinc-900/80 text-center shadow-sm">
                    <IoCalendarOutline className="text-5xl text-amber-800 dark:text-amber-500/80 mb-4" />
                    <h3 className="text-lg font-black tracking-tight uppercase text-amber-900 dark:text-amber-400">Hamarosan! (Coming soon...)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed font-medium">
                      A XIX. Kőszegi Ostromnapok részletes, hivatalos programfüzete hamarosan elérhetővé válik ebben a menüpontban. Látogass vissza később!
                    </p>
                  </div>
                )}

                {events.length > 0 && (
                  <div className="space-y-6 flex-grow">
                    
                    {/* CURRENTLY RUNNING (100% static, no animations/pulsing) */}
                    <div>
                      {currentEvents.length > 0 ? (
                        <div>
                          <h3 className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-600 flex-shrink-0" />
                            Jelenleg zajlik ({currentEvents.length})
                          </h3>
                          {currentEvents.map(e => (
                            <EventCard 
                              key={e.id} 
                              event={e} 
                              onSelect={setSelectedProgram} 
                              isFavorite={favorites.includes(e.id)} 
                              onToggleFavorite={toggleFavorite} 
                              userLocation={userLocation} 
                            />
                          ))}
                        </div>
                      ) : (
                        nextEvents.length > 0 && (
                          <div className="bg-amber-600/[0.06] dark:bg-amber-400/[0.04] border border-amber-600/10 dark:border-amber-500/10 p-5 rounded-[1.75rem] text-center">
                            <p className="text-sm font-extrabold text-amber-800 dark:text-amber-400">Jelenleg nincs aktív esemény.</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">A következő program kezdete</p>
                            <div className="mt-4">
                              <CountdownToNext targetDate={nextEvents[0].start} />
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* UPCOMING NEXT */}
                    {nextEvents.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <IoPlayForwardOutline className="text-xs" /> Következő programok
                          </span>
                          {isSameDay(nextEvents[0].start, new Date()) ? (
                            <InlineCountdown targetDate={nextEvents[0].start} />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 tracking-normal capitalize">{getNextEventDayInfo()}</span>
                          )}
                        </h3>
                        {nextEvents.map(e => (
                          <EventCard 
                            key={e.id} 
                            event={e} 
                            onSelect={setSelectedProgram} 
                            isFavorite={favorites.includes(e.id)} 
                            onToggleFavorite={toggleFavorite} 
                            userLocation={userLocation} 
                          />
                        ))}
                      </div>
                    )}

                    {/* ALL RUN EVENTS COMPLETE */}
                    {currentEvents.length === 0 && nextEvents.length === 0 && (
                      <div className="text-center py-10 bg-white/60 dark:bg-zinc-900/60 rounded-3xl p-6 border border-gray-100 dark:border-zinc-900">
                        <p className="text-sm font-bold text-gray-500">A mai napra véget értek a programok.</p>
                        <p className="text-xs text-gray-400 mt-1">Köszönjük a részvételt!</p>
                      </div>
                    )}

                    {/* MOBILE FLOATING COMPASS MAP */}
                    {userLocation && mapFocusEvent && (
                      <div className="bg-white/60 dark:bg-zinc-900/40 rounded-[2rem] p-4 border border-gray-200 dark:border-zinc-900 shadow-sm">
                        <div className="mb-3.5 flex justify-between items-center">
                          <div>
                            <h4 className="font-extrabold text-xs text-amber-800 dark:text-amber-500 uppercase tracking-wider">
                              {currentEvents.length > 0 ? 'Aktuális helyszín térképe' : 'Következő helyszín térképe'}
                            </h4>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">{mapFocusEvent.helyszin.nev}</p>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${mapFocusEvent.helyszin.lat},${mapFocusEvent.helyszin.lng}&travelmode=walking`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <IoCompassOutline /> Gyalogos útvonal
                          </a>
                        </div>
                        <div className="h-[240px] rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800/80 z-10">
                          <MapContainer 
                            center={[mapFocusEvent.helyszin.lat, mapFocusEvent.helyszin.lng]} 
                            zoom={16} 
                            scrollWheelZoom={false} 
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[userLocation.lat, userLocation.lng]}>
                              <Popup><strong>Pozíciód</strong></Popup>
                            </Marker>
                            {currentEvents.map(e => e.helyszin?.lat && (
                              <Marker key={`map-curr-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}>
                                <Popup>
                                  <strong>{e.nev}</strong><br/>
                                  <span>{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</span>
                                </Popup>
                              </Marker>
                            ))}
                            {nextEvents.map(e => e.helyszin?.lat && !currentEvents.some(c => c.id === e.id) && (
                              <Marker key={`map-next-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]} icon={blueIcon}>
                                <Popup>
                                  <strong>{e.nev}</strong><br/>
                                  <span>Kezdés: {format(e.start, 'HH:mm')}</span>
                                </Popup>
                              </Marker>
                            ))}
                          </MapContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FULL PROGRAM SCHEDULE TAB */}
            {view === 'full' && (
              <div className="space-y-6">
                {events.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-white/60 dark:bg-zinc-900/40 rounded-[2rem] border border-gray-200/50 dark:border-zinc-900">
                    <IoCalendarOutline className="text-5xl text-amber-800 dark:text-amber-500/80 mb-4 mx-auto" />
                    <h3 className="text-lg font-black tracking-tight uppercase text-amber-900 dark:text-amber-400">Hamarosan!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">A teljes program naptár feltöltés alatt áll.</p>
                  </div>
                ) : (
                  Object.values(fullProgramGrouped)
                    .sort((a, b) => a.date - b.date)
                    .map(({ date, events: dayEvents }) => (
                      <div key={date.getTime()} className="space-y-4">
                        <h3 className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest border-b border-gray-200 dark:border-zinc-900 pb-2 capitalize">
                          {format(date, 'MMMM d. (eeee)', { locale: hu })}
                        </h3>
                        {dayEvents
                          .sort((a, b) => a.start - b.start)
                          .map(event => (
                            <EventCard 
                              key={event.id} 
                              event={event} 
                              onSelect={setSelectedProgram} 
                              isFavorite={favorites.includes(event.id)} 
                              onToggleFavorite={toggleFavorite} 
                              userLocation={userLocation} 
                            />
                          ))}
                      </div>
                    ))
                )}
              </div>
            )}

            {/* FAVORITES TAB */}
            {view === 'favorites' && (
              <div className="space-y-4">
                {favoriteEvents.length > 0 ? (
                  favoriteEvents.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onSelect={setSelectedProgram} 
                      isFavorite={true} 
                      onToggleFavorite={toggleFavorite} 
                      userLocation={userLocation} 
                    />
                  ))
                ) : (
                  <div className="text-center py-16 bg-white/60 dark:bg-zinc-900/40 rounded-[2rem] border border-gray-200 dark:border-zinc-900">
                    <IoStarOutline className="text-5xl text-gray-400 dark:text-zinc-600 mb-4 mx-auto" />
                    <p className="text-sm font-black text-gray-500">Nincsenek jelölt kedvenceid.</p>
                    <p className="text-xs text-gray-400 mt-2">Kattints a csillag ikonra a programok mellett!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE PREMIUM iOS BOTTOM SHEET MODAL (Emoji-free) */}
      {selectedProgram && (
        <div 
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4"
          onClick={() => setSelectedProgram(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-6 relative border-t border-gray-200 dark:border-zinc-800 animate-slide-up max-h-[85vh] overflow-y-auto flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Swipe/Drag iOS indicator line */}
              <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 block sm:hidden" />

              <div className="flex justify-between items-start mb-4">
                <div className="pr-6">
                  {selectedProgram.kiemelt && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2.5 border border-rose-500/20">
                      Kiemelt Program
                    </span>
                  )}
                  <h3 className="text-lg md:text-xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">{selectedProgram.nev}</h3>
                </div>
                <button 
                  onClick={() => setSelectedProgram(null)} 
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 bg-gray-100 dark:bg-zinc-800 rounded-full transition"
                  aria-label="Bezárás"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="space-y-4 my-5 text-sm text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-3.5 p-4 bg-gray-50 dark:bg-zinc-950/30 rounded-xl border border-gray-200/50 dark:border-zinc-900/50">
                  <IoLocation className="text-xl text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Helyszín</p>
                    <p className="font-extrabold text-gray-900 dark:text-white mt-0.5">{selectedProgram.helyszin.nev}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 bg-gray-50 dark:bg-zinc-950/30 rounded-xl border border-gray-200/50 dark:border-zinc-900/50">
                  <IoTime className="text-xl text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Időpont</p>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {format(selectedProgram.start, 'yyyy. MMMM d. (eeee)', { locale: hu })}<br/>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                        {format(selectedProgram.start, 'HH:mm')} – {format(selectedProgram.end, 'HH:mm')}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedProgram.leiras && (
                  <div className="p-5 bg-gray-50 dark:bg-zinc-800/10 rounded-xl border border-gray-200/50 dark:border-zinc-800/40 leading-relaxed text-gray-700 dark:text-gray-300">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-2">Program leírása</p>
                    <p className="whitespace-pre-line text-xs md:text-sm font-medium">{selectedProgram.leiras}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
              <button 
                onClick={() => {
                  toggleFavorite(selectedProgram.id);
                }}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition duration-300 flex items-center justify-center gap-2
                  ${favorites.includes(selectedProgram.id)
                    ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }
                `}
              >
                {favorites.includes(selectedProgram.id) ? (
                  <>
                    <IoStar className="text-amber-500 text-base" />
                    Eltávolítás a kedvencekből
                  </>
                ) : (
                  <>
                    <IoStarOutline className="text-base" />
                    Kedvencekhez ad
                  </>
                )}
              </button>

              {userLocation && selectedProgram.helyszin?.lat && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedProgram.helyszin.lat},${selectedProgram.helyszin.lng}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-500 hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl text-center text-xs transition-opacity shadow-md flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <IoCompassOutline className="text-base" /> Indulás oda
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
