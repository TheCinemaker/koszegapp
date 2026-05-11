import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Added import
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  FaCalendarPlus,
  FaCalendarAlt,
  FaCalendarWeek,
  FaList,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaTimes,
  FaInfoCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaUniversity,
  FaClock,
  FaTicketAlt,
  FaCloudSun
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

// 1. Apple-style Event Card
const GigatrendyCard = ({ evt, isFavorite, toggleFavorite, isPast, onGeneratePass }) => {
  const { t } = useTranslation('events');
  const navigate = useNavigate(); // For redirect
  const isMultiDay = evt.end_date && evt.end_date !== evt.date;

  const monthStr = evt._s ? format(evt._s, 'MMM', { locale: hu }).replace('.', '') : '';
  const dayStr = evt._s ? format(evt._s, 'd') : '';
  const timeStr = evt.time ? evt.time : evt._s ? format(evt._s, 'HH:mm') : '';

  // Extract price from description if possible
  const priceMatch = evt.description?.match(/Jegyár:\s*([\d\.,-]+)/i);
  const displayPrice = priceMatch ? priceMatch[1] : 'Helyszínen';

  return (
    <div className={`group relative w-full bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-2 border border-gray-100 dark:border-gray-700/50 ${isPast ? 'grayscale opacity-70' : ''}`}>

      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-900">
        {evt.image && evt.image !== 'balkep_default.jpg' ? (
          <img
            src={`/images/events/${evt.image}`}
            alt={evt.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}
        <div className="hidden w-full h-full absolute inset-0">
          <GhostImage className="w-full h-full" />
        </div>

        {/* Floating Date Badge (iOS Style) */}
        <div className="absolute top-5 left-5 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-2.5 min-w-[55px] text-center shadow-sm border border-white/20">
          <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none mb-0.5">{monthStr}</div>
          <div className="text-xl font-black text-gray-900 dark:text-white leading-none">{dayStr}</div>
        </div>

        {/* Favorite Button */}
        {!isPast && (
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorite(evt.id); }}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl flex items-center justify-center text-gray-900 dark:text-white hover:bg-white dark:hover:bg-white/20 transition-all active:scale-90"
          >
            {isFavorite ? <FaHeart className="text-rose-500 scale-110" /> : <FaRegHeart />}
          </button>
        )}

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Location Info (Overlayed on image for cleaner look) */}
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">
            <FaMapMarkerAlt className="text-indigo-400" />
            <span className="truncate">{evt.location}</span>
          </div>
          <h3 className="text-xl font-black leading-tight drop-shadow-md line-clamp-2">
            {evt.name}
          </h3>
        </div>
      </div>

      {/* Content / Actions */}
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center text-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Kezdés</span>
            <span className="font-black text-gray-900 dark:text-white">{timeStr}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ár</span>
             <span className="font-black text-indigo-600 dark:text-indigo-400">{displayPrice}{displayPrice !== 'Helyszínen' ? ' Ft' : ''}</span>
          </div>
        </div>

        {/* Compact Pass Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.preventDefault(); onGeneratePass(evt); }}
            className="flex-1 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 transition-colors"
          >
            <img src="/images/apple_badges/addtoapplewallet.png" alt="Wallet" className="h-4 w-auto opacity-80" />
          </button>
          <button
             onClick={(e) => { e.preventDefault(); /* Google logic */ }}
             className="flex-1 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 transition-colors"
          >
            <img src="/images/google_badges/hu_add_to_google_wallet_add-wallet-badge.svg" alt="Google" className="h-4 w-auto opacity-80" />
          </button>
        </div>

        {/* CTA Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/events/${evt.id}`}
            state={{ fromVarszinhaz: true }}
            className="py-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-black text-center text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            Infó
          </Link>
          <button
            onClick={() => toast('Hamarosan elérhető a digitális foglalás!', { icon: '🎟️' })}
            className="py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-center text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-[0.98]"
          >
            Foglalás
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Varszinhaz() {
  const { t } = useTranslation('events'); // Load namespace
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
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
        const varszinhazEvents = sorted.filter(e => e.isVarszinhaz === true || (e.tags && e.tags.includes('várszínház')));
        setEvents(varszinhazEvents);

        const allTags = varszinhazEvents.flatMap(event => event.tags || []);
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

      <div className="max-w-7xl mx-auto flex flex-col items-center mb-8 pt-2 px-2">
        <div className="w-full flex items-center mb-4">
          <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <FaArrowLeft className="text-xl text-gray-900 dark:text-white" />
          </Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <img 
            src="/images/varszinhaz-logo.png" 
            alt="Kőszegi Várszínház" 
            className="h-32 sm:h-44 w-auto object-contain drop-shadow-md"
          />
        </motion.div>
      </div>

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

      {/* 5. TICKET INFO SECTION (Apple Card Style) */}
      <div className="max-w-7xl mx-auto mt-20 mb-12">
        <FadeUp>
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-[40px] p-8 sm:p-12 border border-gray-100 dark:border-gray-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="max-w-3xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                  <FaTicketAlt className="text-xl" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Információ és jegyrendelés</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Jurisics-vár Művelődési Központ és Várszínház</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Elérhetőség</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <FaMapMarkerAlt className="text-gray-400 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">9730 Kőszeg, Rajnis utca 9.</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <FaPhoneAlt className="text-gray-400 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">94/360-113</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <FaEnvelope className="text-gray-400 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">info@koszegivarszinhaz.hu</span>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Átutalási adatok</h4>
                  <div className="p-5 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-3">
                    <div className="flex items-start gap-3">
                      <FaUniversity className="mt-1 text-gray-400" />
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bankszámlaszám (OTP)</div>
                        <div className="text-sm font-black text-gray-900 dark:text-white break-all">11747051-15574493-10050006</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">
                      * Megjegyzésbe: Név, Cím, Előadás dátuma, Jegyek száma
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Hours & Rules */}
              <div className="pt-10 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <FaClock className="text-indigo-500 mt-1" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nyitvatartás</div>
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">H-P: 08:00 - 16:00</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCloudSun className="text-amber-500 mt-1" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Esőnap</div>
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">20:30-kor döntés a kezdésről</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fontos</div>
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">Fizetés SZÉP kártyával is</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
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
