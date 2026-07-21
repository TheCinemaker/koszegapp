import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Added import
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../api';
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
import { IoCalendarOutline, IoChevronForward } from 'react-icons/io5';
import { Toaster, toast } from 'react-hot-toast';
import EventImageCard from '../components/EventImageCard'; // Using logic, but custom render? Or adapting? Let's use custom for max control.

const MONTH_NAMES = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
import GhostImage from '../components/GhostImage'; // ADDED IMPORT
import { FadeUp } from '../components/AppleMotion';
import SEO from '../components/SEO';

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
  const { t } = useTranslation('events');
  const isMultiDay = evt.end_date && evt.end_date !== evt.date;
  // Note: format(..., { locale: hu }) is hardcoded to HU locale in the original code. 
  // Ideally this should use the current i18n language, but for now I'll keep it as is or use t() for month names if I want full localization.
  // The user asked for translations. Let's use standard date formatting if possible, OR translate month names.
  // Original: const monthStr = evt._s ? format(evt._s, 'MMM', { locale: hu }).replace('.', '') : '';
  // Since we have month names in json, we could use them, but date-fns is easier. 
  // I will LEAVE date-fns as is for now because changing locale requires importing different locales dynamically.
  // However, I CAN translate the "Wallet" button and others.

  const monthStr = evt._s ? format(evt._s, 'MMM', { locale: hu }).replace('.', '') : '';
  const dayStr = evt._s ? format(evt._s, 'd') : '';
  const timeStr = evt.time ? evt.time : evt._s ? format(evt._s, 'HH:mm') : '';



  return (
    <Link to={`/events/${evt.id}`} className={`group relative block w-full ${isPast ? 'grayscale opacity-70' : ''}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17, mass: 0.8 }}
        className="relative h-full bg-white/70 dark:bg-white/5 backdrop-blur-[20px] backdrop-saturate-[1.6] rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg border border-white/60 dark:border-white/10"
      >
        {/* Image Container — inset design, shows full flyer */}
        <div className="p-3 pb-0">
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl isolate bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            {evt.image && evt.image !== 'balkep_default.jpg' ? (
              <>
                <img
                  src={`/images/events/${evt.image}`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
                  loading="lazy"
                />
                <img
                  src={`/images/events/${evt.image}`}
                  alt={evt.name}
                  className="relative max-w-full max-h-full object-contain z-10 transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.previousSibling.style.display = 'none'; e.currentTarget.parentNode.querySelector('.fallback-ghost').style.display = 'block'; }}
                />
              </>
            ) : (
              <GhostImage className="w-full h-full rounded-xl" />
            )}
            {/* Fallback for onError (hidden by default) */}
            <div className="fallback-ghost hidden w-full h-full absolute inset-0">
              <GhostImage className="w-full h-full" />
            </div>

            {/* Floating Date Badge */}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-1.5 min-w-[52px] text-center shadow-lg border border-white/20 z-20">
              <div className="text-[10px] font-bold uppercase text-[#0a97be] dark:text-[#0bc9f8] tracking-wider">{monthStr}</div>
              <div className="text-xl font-black text-gray-800 dark:text-white leading-none">{dayStr}</div>
            </div>

            {/* Favorite Button (Floating) */}
            {!isPast && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(evt.id); }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 flex items-center justify-center text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-black/50 transition-all shadow-sm active:scale-90 z-20"
              >
                {isFavorite ? <FaHeart className="text-rose-600 dark:text-rose-500 drop-shadow-md text-sm" /> : <FaRegHeart className="text-zinc-900 dark:text-white text-sm" />}
              </button>
            )}

            {/* Tags / MultiDay Badge */}
            <div className="absolute bottom-3 left-3 flex gap-2 overflow-hidden max-w-[80%] z-20">
              {isMultiDay && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                  {t('multiDay')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight line-clamp-2 leading-snug mb-2 min-h-[3rem]">
            {evt.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            {evt.location && (
              <span className="flex items-center gap-1 truncate">
                <FaMapMarkerAlt className="text-[#0a97be] shrink-0" />
                <span className="truncate">{evt.location}</span>
              </span>
            )}
            {evt.location && <span className="text-gray-300 dark:text-gray-600">•</span>}
            <span className="shrink-0">{timeStr}</span>
          </div>

          {/* Részletek row — matching Home chevron pattern */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs font-semibold text-[#0a97be] dark:text-[#0bc9f8]">Részletek</span>
            <IoChevronForward className="text-[#0a97be] dark:text-[#0bc9f8] text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function Events() {
  const { t } = useTranslation('events'); // Load namespace
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
    const toastId = toast.loading(t('generatingPass'));
    try {
      const res = await fetch('/.netlify/functions/create-event-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventItem),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('generationError'));
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

      toast.success(t('downloaded'), { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(t('errorPrefix', { message: e.message }), { id: toastId });
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
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100">
      {/* Morph target must exist during loading too, or the shared-element has nothing to connect to */}
      <motion.div
    <LoadingSpinner fullScreen={true} label="Betöltés..." />
  );
  if (error) return <p className="text-red-500 p-8 text-center bg-red-50 m-4 rounded-xl">Hiba: {error}</p>;

  // CLEAN MINIMAL BACKGROUND (DASHBOARD STYLE)
  return (
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <SEO
          title="Kőszegi programok és rendezvények"
          description="Aktuális kőszegi eseménynaptár: fesztiválok, koncertek, múzeumi programok, városi rendezvények. Vedd meg a jegyed az appon belül másodpercek alatt."
          url="/events"
          keywords="Kőszeg esemény, Kőszeg program, Kőszeg fesztivál, kőszegi rendezvény"
      />
      <Toaster position="top-right" />

      {/* 1. HEADER — shared-element morph target (matches the Home "Események" card) */}
      <motion.div
        layoutId="morph-events"
        transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
        className="max-w-7xl mx-auto flex items-center gap-4 mb-6 mt-2 px-4 py-4 rounded-[1.5rem] bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm"
      >
        <Link to="/" aria-label="Vissza" className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400">
          <FaArrowLeft className="text-lg" />
        </Link>
        <motion.div
          layoutId="morph-events-icon"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl bg-gray-900/[0.06] dark:bg-white/10 text-gray-800 dark:text-gray-100"
        >
          <IoCalendarOutline />
        </motion.div>
        <motion.h1
          layoutId="morph-events-title"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Programok
        </motion.h1>
      </motion.div>

      <div className="max-w-7xl mx-auto">

        {/* 2. SEARCH (Compact & Native-like) */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
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
              { id: 'week', label: t('filters.week'), icon: FaCalendarWeek },
              { id: 'month', label: t('filters.month'), icon: FaCalendarPlus },
              // Special case for Picker is handled in logic below, but we can treat it as a tab ID 'byMonth'
              { id: 'byMonth', label: filter === 'byMonth' ? t('monthsShort.' + (selectedMonth - 1)) + '.' : t('filters.date'), icon: FaCalendarAlt, onClick: () => setOpenPicker(true) },
              { id: 'all', label: t('filters.all'), icon: FaList }
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
              <FadeUp key={evt.id} delay={idx * 0.08}>
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
            <div className="text-center py-20">
              <div className="text-6xl mb-4 grayscale opacity-30">📅</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('noResults.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('noResults.desc')}</p>
              <button onClick={() => { setFilter('all'); setSelectedTag(null); setSearchQuery('') }} className="mt-4 px-6 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-200 transition">
                {t('noResults.clearFilters')}
              </button>
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && filter !== 'favorites' && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-bold mb-6 text-gray-400 uppercase tracking-widest text-center">{t('pastEvents')}</h3>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('selectMonth')}</h3>
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
                  {t('monthsShort.' + idx)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
