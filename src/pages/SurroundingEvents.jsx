import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchSurroundingEvents } from '../api';
import {
  format,
  parseISO,
  areIntervalsOverlapping,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaCalendarAlt,
  FaCalendarWeek,
  FaList,
  FaCalendarPlus
} from 'react-icons/fa';
import { IoCalendarOutline, IoChevronForward } from 'react-icons/io5';
import { Toaster, toast } from 'react-hot-toast';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import SEO from '../components/SEO';

const MONTH_SHORT = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

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
        const e = new Date(s); e.setHours(h + 2);
        return { _s: s, _e: e };
      }
    }
    const s = new Date(sBase); s.setHours(0, 0, 0, 0);
    const e = new Date(eBase); e.setHours(23, 59, 59, 999);
    return { _s: s, _e: e };
  }
  return { _s: null, _e: null };
}

const SurroundingEventCard = ({ evt, isFavorite, toggleFavorite, isPast }) => {
  const isMultiDay = evt.end_date && evt.end_date !== evt.date;
  const monthStr = evt._s ? format(evt._s, 'MMM', { locale: hu }).replace('.', '') : '';
  const dayStr = evt._s ? format(evt._s, 'd') : '';
  const timeStr = evt.time ? evt.time : evt._s ? format(evt._s, 'HH:mm') : '';

  return (
    <Link 
      to={`/surrounding-events/${evt.id}`} 
      state={{ fromSurrounding: true }}
      className={`group relative block w-full ${isPast ? 'grayscale opacity-70' : ''}`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="relative h-full bg-white/70 dark:bg-white/5 backdrop-blur-[30px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-white/60 dark:border-white/10 flex flex-col"
      >
        <div className="p-3 pb-0">
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl isolate bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            {evt.image ? (
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
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    e.currentTarget.previousSibling.style.display = 'none'; 
                    e.currentTarget.parentNode.querySelector('.fallback-ghost').style.display = 'block'; 
                  }}
                />
              </>
            ) : (
              <GhostImage className="w-full h-full rounded-xl" />
            )}
            <div className="fallback-ghost hidden w-full h-full absolute inset-0">
              <GhostImage className="w-full h-full" />
            </div>

            <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-1.5 min-w-[52px] text-center shadow-md border border-white/20 z-20">
              <div className="text-[10px] font-bold uppercase text-brand dark:text-brand-light tracking-wider">{monthStr}</div>
              <div className="text-xl font-black text-gray-800 dark:text-white leading-none">{dayStr}</div>
            </div>

            {!isPast && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(evt.id); }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 flex items-center justify-center text-zinc-900 dark:text-white hover:bg-white dark:hover:bg-black/50 transition-all shadow-sm active:scale-90 z-20"
              >
                {isFavorite ? <FaHeart className="text-rose-600 dark:text-rose-500 drop-shadow-md text-sm" /> : <FaRegHeart className="text-zinc-900 dark:text-white text-sm" />}
              </button>
            )}

            <div className="absolute bottom-3 left-3 flex gap-2 overflow-hidden max-w-[80%] z-20">
              {isMultiDay && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/90 text-amber-900 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                  Többnapos
                </span>
              )}
              {evt.settlement && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                  {evt.settlement}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between relative">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight line-clamp-2 leading-snug mb-2 min-h-[3rem]">
              {evt.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {evt.location && (
                <span className="flex items-center gap-1 truncate">
                  <FaMapMarkerAlt className="text-brand dark:text-brand-light shrink-0" />
                  <span className="truncate">{evt.settlement ? `${evt.settlement}, ` : ''}{evt.location}</span>
                </span>
              )}
              {evt.location && <span className="text-gray-300 dark:text-gray-600">•</span>}
              <span className="shrink-0">{timeStr}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-white/10">
            <span className="text-xs font-semibold text-brand dark:text-brand-light">Részletek</span>
            <IoChevronForward className="text-brand dark:text-brand-light text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function SurroundingEvents({ events: propEvents, loading: propLoading }) {
  const { t } = useTranslation('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('all'); // date filter: all, week, month, byMonth
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openPicker, setOpenPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (propEvents && propEvents.length > 0) {
      setEvents(propEvents);
      setLoading(false);
    } else {
      setLoading(true);
      fetchSurroundingEvents()
        .then(data => {
          const norm = data.map(e => ({
            ...e,
            end_date: e.end_date || e.date,
            tags: (e.tags || []).map(t => String(t).toLowerCase())
          }));
          const sorted = norm.slice().sort((a, b) => a.date.localeCompare(b.date));
          setEvents(sorted);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [propEvents]);

  const now = new Date();
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });
  const moStart = startOfMonth(now);
  const moEnd = endOfMonth(now);

  const normalized = useMemo(() => {
    const list = events.map(evt => {
      const { _s, _e } = computeRange(evt);
      return { ...evt, _s, _e };
    });
    return list.sort((a, b) => {
      if (!a._s) return 1;
      if (!b._s) return -1;
      return a._s.getTime() - b._s.getTime();
    });
  }, [events]);

  const filtered = useMemo(() => {
    return normalized
      .filter(evt => {
        if (filter === 'week') return areIntervalsOverlapping({ start: evt._s, end: evt._e }, { start: wkStart, end: wkEnd });
        if (filter === 'month') return areIntervalsOverlapping({ start: evt._s, end: evt._e }, { start: moStart, end: moEnd });
        if (filter === 'byMonth') return evt._s && (evt._s.getMonth() + 1 === selectedMonth);
        return true;
      })
      .filter(evt => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (evt.name?.toLowerCase() || '').includes(q) ||
          (evt.description?.toLowerCase() || '').includes(q) ||
          (evt.settlement?.toLowerCase() || '').includes(q) ||
          (evt.location?.toLowerCase() || '').includes(q);
      });
  }, [normalized, filter, wkStart, wkEnd, moStart, moEnd, selectedMonth, searchQuery]);

  const upcoming = filtered.filter(evt => evt._e && evt._e >= now);
  const past = filtered.filter(evt => evt._e && evt._e < now);

  if (loading) return (
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100">
      <motion.div
        layoutId="morph-surrounding-events"
        transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
        className="max-w-7xl mx-auto flex items-center gap-4 mb-6 mt-2 px-4 py-4 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 shadow-sm"
      >
        <Link to="/" aria-label="Vissza" className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 hover:opacity-90 transition-opacity">
          <FaArrowLeft className="text-lg text-brand dark:text-white" />
        </Link>
        <motion.div
          layoutId="morph-surrounding-events-icon"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl bg-gray-900/[0.06] dark:bg-white/10 text-gray-800 dark:text-gray-100"
        >
          <IoCalendarOutline />
        </motion.div>
        <motion.h1
          layoutId="morph-surrounding-events-title"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Hegyaljai programok
        </motion.h1>
      </motion.div>
      <div className="flex justify-center mt-20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin"></div>
      </div>
    </div>
  );

  if (error) return <p className="text-red-500 p-8 text-center bg-red-50 m-4 rounded-xl">Hiba: {error}</p>;

  return (
    <div className="min-h-screen pb-20 pt-0 px-4 relative text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <SEO
        title="Hegyaljai programok és rendezvények"
        description="Rendezvények és programok a Kőszeg-hegyaljai településeken: Cák, Velem, Bozsok, Lukácsháza és egyéb falvak eseménynaptára."
        url="/surrounding-events"
        keywords="Cák program, Velem program, Bozsok program, Kőszeg környéke, falunap"
      />
      <Toaster position="top-right" />

      {/* 1. HEADER */}
      <motion.div
        layoutId="morph-surrounding-events"
        transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
        className="max-w-7xl mx-auto flex items-center gap-4 mb-6 mt-2 px-4 py-4 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 shadow-sm"
      >
        <Link to="/" aria-label="Vissza" className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-[30px] border border-white/60 dark:border-white/10 hover:opacity-90 transition-opacity">
          <FaArrowLeft className="text-lg text-brand dark:text-white" />
        </Link>
        <motion.div
          layoutId="morph-surrounding-events-icon"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl bg-gray-900/[0.06] dark:bg-white/10 text-gray-800 dark:text-gray-100"
        >
          <IoCalendarOutline />
        </motion.div>
        <motion.h1
          layoutId="morph-surrounding-events-title"
          transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
          className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          Hegyaljai programok
        </motion.h1>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* 2. SEARCH */}
        <div className="mb-4">
          <div className="flex gap-3 h-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keress program névre, településre, leírásra..."
              className="flex-1 h-full px-4 rounded-lg
                         bg-white/60 dark:bg-gray-800/60
                         backdrop-blur-md
                         border border-white/40 dark:border-gray-700/50
                         text-xs font-medium text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/50
                         shadow-sm transition-all duration-300
                         hover:bg-white/80 dark:hover:bg-gray-800/80"
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         bg-indigo-600 text-white shadow-sm
                         hover:bg-indigo-700 hover:scale-105
                         transition-all duration-300
                         active:scale-95"
            >
              <FaSearch className="text-xs" />
            </button>
          </div>
        </div>

        {/* 3. SETTLEMENT FILTER PILLS (Removed) */}

        {/* 4. DATE FILTERS (iOS style control) */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex p-1 bg-gray-200/50 dark:bg-white/10 backdrop-blur-xl rounded-full relative w-full sm:w-auto sm:inline-flex min-w-min">
            {[
              { id: 'all', label: 'Mindegyik', icon: FaList },
              { id: 'week', label: 'Ezen a héten', icon: FaCalendarWeek },
              { id: 'month', label: 'Ebben a hónapban', icon: FaCalendarPlus },
              { id: 'byMonth', label: filter === 'byMonth' ? MONTH_SHORT[selectedMonth - 1] + '.' : 'Hónap választó', icon: FaCalendarAlt, onClick: () => setOpenPicker(true) }
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
                      layoutId="activeSurroundingFilter"
                      className="absolute inset-0 bg-white shadow-sm rounded-full pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 text-[10px] sm:text-xs"><tab.icon /></span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. EVENT GRID */}
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcoming.map((evt, idx) => (
              <FadeUp key={evt.id} delay={idx * 0.08}>
                <SurroundingEventCard
                  evt={evt}
                  isFavorite={isFavorite(evt.id)}
                  toggleFavorite={isFavorite(evt.id) ? removeFavorite : addFavorite}
                />
              </FadeUp>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 grayscale opacity-30">📅</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nincs találat</h3>
            <p className="text-gray-500 dark:text-gray-400">Nincs a szűrésnek megfelelő program ebben az időszakban.</p>
            <button 
              onClick={() => { setFilter('all'); setSearchQuery('') }} 
              className="mt-4 px-6 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-200 transition"
            >
              Szűrők törlése
            </button>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && filter === 'all' && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-bold mb-6 text-gray-400 uppercase tracking-widest text-center">Lezajlott programok</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
              {past.map(evt => (
                <SurroundingEventCard
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

      {/* MONTH PICKER MODAL */}
      {openPicker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpenPicker(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hónap választása</h3>
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
                  {short}.
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
