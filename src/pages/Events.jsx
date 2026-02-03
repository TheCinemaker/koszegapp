import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../api';
import UniversalNav from '../components/UniversalNav'; // ADDED IMPORT
import {
  format,
  parseISO,
  areIntervalsOverlapping,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  endOfDay,
  addHours
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaCalendarPlus, // For Month/Picker
  FaCalendarAlt, // NEW: For Date Picker button
  FaCalendarWeek, // NEW: For Week
  FaList,         // NEW: For All
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaTimes,
  FaUtensils,
  FaCloudSun,
  FaRunning,
  FaBed,
  FaParking,
  FaInfoCircle,
  FaGem
} from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';
import EventImageCard from '../components/EventImageCard'; // Using logic, but custom render? Or adapting? Let's use custom for max control.

const MONTH_NAMES = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
import GhostImage from '../components/GhostImage'; // ADDED IMPORT
import { FadeUp } from '../components/AppleMotion';

// --- Helper Logic (Same as before) ---
function computeRange(evt) {
  if (evt?.date) {
    const sBase = parseISO(evt.date);
    const eBase = parseISO(evt.end_date || evt.date);
    if (evt.time && typeof evt.time === 'string') {
      const t = evt.time.replace(/\s/g, '');
      if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) {
        const [ts, te] = t.split('-');
        const [hs, ms] = ts.split(':').map(Number);
        const [he, me] = te.split(':').map(Number);
        const s = new Date(sBase); s.setHours(hs, ms ?? 0, 0, 0);
        const e = new Date(eBase); e.setHours(he, me ?? 0, 0, 0);
        return { _s: s, _e: e };
      }
      if (/^\d{2}:\d{2}$/.test(t)) {
        const [h, m] = t.split(':').map(Number);
        const s = new Date(sBase); s.setHours(h, m ?? 0, 0, 0);
        const e = addHours(s, 2);
        return { _s: s, _e: e };
      }
    }
    const s = new Date(sBase); s.setHours(0, 0, 0, 0);
    const e = new Date(eBase); e.setHours(23, 59, 59, 999);
    return { _s: s, _e: e };
  }
  if (evt?.date && evt.date.includes('/')) {
    const [a, b] = evt.date.split('/');
    return { _s: parseISO(a), _e: parseISO(b) };
  }
  return { _s: null, _e: null };
}

function toICS(evt) {
  if (!evt._s || !evt._e) return '';
  const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `SUMMARY:${evt.name}`,
    `DTSTART:${dt(evt._s)}`, `DTEND:${dt(evt._e)}`,
    `LOCATION:${evt.location || ''}`,
    `DESCRIPTION:${(evt.description || '').replace(/\r?\n/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\n');
}

// --- GIGATRENDY COMPONENTS ---

// 1. Floating Glass Card
const GigatrendyCard = ({ evt, isFavorite, toggleFavorite, isPast, onGeneratePass }) => {
  const isMultiDay = evt.end_date && evt.end_date !== evt.date;
  const monthStr = evt._s ? format(evt._s, 'MMM', { locale: hu }).replace('.', '') : '';
  const dayStr = evt._s ? format(evt._s, 'd') : '';
  const timeStr = evt.time ? evt.time : evt._s ? format(evt._s, 'HH:mm') : '';

  return (
    <div className={`group relative w-full bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 border border-white/40 dark:border-gray-700/40 ${isPast ? 'grayscale opacity-70' : ''}`}>

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {evt.image && evt.image !== 'balkep_default.jpg' ? (
          <img
            src={`/images/events/${evt.image}`}
            alt={evt.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}
        {/* Fallback for onError (hidden by default) */}
        <div className="hidden w-full h-full absolute inset-0">
          <GhostImage className="w-full h-full" />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        {/* Floating Date Badge */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-2 min-w-[60px] text-center shadow-lg border border-white/20">
          <div className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">{monthStr}</div>
          <div className="text-2xl font-black text-gray-800 dark:text-white leading-none">{dayStr}</div>
        </div>

        {/* Apple Wallet Badge (Official Style) */}
        {!isPast && onGeneratePass && (
          <button
            onClick={(e) => { e.preventDefault(); onGeneratePass(evt); }}
            className="absolute top-4 left-20 h-10 px-3 bg-black rounded-lg flex items-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/10"
            title="Hozzáadás az Apple Wallethez"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-white text-[10px] font-semibold tracking-tight">Wallet</span>
          </button>
        )}

        {/* Favorite Button (Floating) */}
        {!isPast && (
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorite(evt.id); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all shadow-lg active:scale-90"
          >
            {isFavorite ? <FaHeart className="text-rose-500 drop-shadow-md" /> : <FaRegHeart />}
          </button>
        )}

        {/* Tags / MultiDay Badge */}
        <div className="absolute bottom-4 left-4 flex gap-2 overflow-hidden max-w-[80%]">
          {isMultiDay && (
            <span className="px-3 py-1 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
              Többnapos
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 relative">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 line-clamp-2 leading-tight min-h-[3.5rem]">
          {evt.name}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          {evt.location && (
            <span className="flex items-center gap-1 truncate max-w-[60%]">
              <FaMapMarkerAlt className="text-indigo-500 shrink-0" />
              <span className="truncate">{evt.location}</span>
            </span>
          )}
          <span className="mx-1">•</span>
          <span>{timeStr}</span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mt-auto">
          <Link
            to={`/events/${evt.id}`}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-center text-sm hover:bg-indigo-600 hover:text-white transition-colors duration-300"
          >
            Részletek
          </Link>

          <a
            href={`data:text/calendar;charset=utf8,${encodeURIComponent(toICS(evt))}`}
            download={`${evt.name.replace(/\s+/g, '_')}.ics`}
            className="w-12 h-11 flex items-center justify-center rounded-xl bg-indigo-50/50 dark:bg-gray-700/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100 dark:border-gray-600"
            title="Naptárba mentés"
          >
            <FaCalendarPlus />
          </a>
        </div>
      </div>
    </div>
  );
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openPicker, setOpenPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleGeneratePass = async (eventItem) => {
    const toastId = toast.loading("Wallet Pass készítése...");
    try {
      const res = await fetch('/.netlify/functions/create-event-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventItem),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generálási hiba');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventItem.id}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Letöltve!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(`Hiba: ${e.message}`, { id: toastId });
    }
  };

  // --- Initial Fetch ---
  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then(data => {
        const norm = data.map(e => ({
          ...e,
          end_date: e.end_date || e.date,
          tags: (e.tags || []).map(t => String(t).toLowerCase())
        }));
        const sorted = norm.slice().sort((a, b) => a.date.localeCompare(b.date));
        setEvents(sorted);

        const allTags = sorted.flatMap(event => event.tags || []);
        const tagCounts = allTags.reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {});
        const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 10);
        setTags(topTags);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });
  const moStart = startOfMonth(now);
  const moEnd = endOfMonth(now);

  const normalized = useMemo(() => {
    return events.map(evt => {
      const { _s, _e } = computeRange(evt);
      return { ...evt, _s, _e };
    });
  }, [events]);

  const filtered = useMemo(() => {
    return normalized
      .filter(evt => {
        if (filter === 'favorites') return isFavorite(evt.id) && evt._e && evt._e >= now;
        if (filter === 'week') return areIntervalsOverlapping({ start: evt._s, end: evt._e }, { start: wkStart, end: wkEnd });
        if (filter === 'month') return areIntervalsOverlapping({ start: evt._s, end: evt._e }, { start: moStart, end: moEnd });
        if (filter === 'byMonth') return evt._s && (evt._s.getMonth() + 1 === selectedMonth);
        return true;
      })
      .filter(evt => !selectedTag || (evt.tags && evt.tags.includes(selectedTag)))
      .filter(evt => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (evt.name?.toLowerCase() || '').includes(q) ||
          (evt.description?.toLowerCase() || '').includes(q) ||
          (evt.location?.toLowerCase() || '').includes(q);
      });
  }, [normalized, filter, wkStart, wkEnd, moStart, moEnd, selectedMonth, selectedTag, searchQuery, isFavorite]);

  const upcoming = filtered.filter(evt => evt._e && evt._e >= now);
  const past = filtered.filter(evt => evt._e && evt._e < now);

  // --- Render ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-2xl animate-spin"></div>
    </div>
  );
  if (error) return <p className="text-red-500 p-8 text-center bg-red-50 m-4 rounded-xl">Hiba: {error}</p>;

  // CLEAN MINIMAL BACKGROUND (DASHBOARD STYLE)
  return (
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* 1. SIMPLE HEADER (Back + Title) */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mb-6 pt-2">
        <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <FaArrowLeft className="text-xl text-gray-900 dark:text-white" />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Események
        </h1>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* 2. SEARCH (Compact & Native-like) */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keresés..."
              className="flex-1 h-full px-4 rounded-lg
                         bg-white/60 dark:bg-gray-800/60
                         backdrop-blur-md
                         border border-white/40 dark:border-gray-700/50
                         text-xs font-medium text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                         shadow-sm transition-all duration-300
                         hover:bg-white/80 dark:hover:bg-gray-800/80"
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         gradient-vibrant-primary text-white shadow-sm
                         hover:shadow-md hover:scale-105
                         transition-all duration-300
                         active:scale-95"
            >
              <FaSearch className="text-xs" />
            </button>
          </div>
        </div>

        {/* 3. FILTERS (Compact Pills - Native iOS Feel) */}
        {/* 3. FILTERS (iOS Segmented Control Style) */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex p-1 bg-gray-200/50 dark:bg-white/10 backdrop-blur-xl rounded-full relative w-full sm:w-auto sm:inline-flex min-w-min">
            {[
              { id: 'week', label: 'HETI', icon: FaCalendarWeek },
              { id: 'month', label: 'HAVI', icon: FaCalendarPlus },
              // Special case for Picker is handled in logic below, but we can treat it as a tab ID 'byMonth'
              { id: 'byMonth', label: filter === 'byMonth' ? MONTH_SHORT[selectedMonth - 1] + '.' : 'DÁTUM', icon: FaCalendarAlt, onClick: () => setOpenPicker(true) },
              { id: 'all', label: 'MIND', icon: FaList }
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.onClick) tab.onClick();
                    else setFilter(tab.id);
                  }}
                  className={`
                    relative z-10 flex items-center justify-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-colors duration-200 flex-1 sm:flex-none whitespace-nowrap
                    ${isActive ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white shadow-sm rounded-full pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {/* Icon & Text relative z-index higher than background */}
                  <span className="relative z-10 text-[10px] sm:text-xs"><tab.icon /></span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. EVENT GRID */}
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcoming.map((evt, idx) => (
              <FadeUp key={evt.id} delay={idx * 0.15} duration={1.6}>
                <GigatrendyCard
                  evt={evt}
                  isFavorite={isFavorite(evt.id)}
                  toggleFavorite={isFavorite(evt.id) ? removeFavorite : addFavorite}
                  onGeneratePass={handleGeneratePass}
                />
              </FadeUp>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 grayscale opacity-30">📅</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nincs találat</h3>
            <p className="text-gray-500 dark:text-gray-400">Próbálj más szűrési feltételeket.</p>
            <button onClick={() => { setFilter('all'); setSelectedTag(null); setSearchQuery('') }} className="mt-4 px-6 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-200 transition">
              Szűrők törlése
            </button>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && filter !== 'favorites' && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-bold mb-6 text-gray-400 uppercase tracking-widest text-center">Lezajlott Események</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
              {past.map(evt => (
                <GigatrendyCard
                  key={evt.id}
                  evt={evt}
                  isFavorite={false}
                  toggleFavorite={() => { }}
                  isPast={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MONTH PICKER MODAL (Clean Design) */}
      {openPicker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpenPicker(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hónap kiválasztása</h3>
              <button onClick={() => setOpenPicker(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_SHORT.map((short, idx) => (
                <button
                  key={short}
                  onClick={() => { setSelectedMonth(idx + 1); setFilter('byMonth'); setOpenPicker(false); }}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedMonth === idx + 1
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-600 hover:text-indigo-600'
                    }`}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
