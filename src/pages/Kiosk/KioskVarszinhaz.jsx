// src/pages/Kiosk/KioskVarszinhaz.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLocationOutline, IoSearchOutline, IoTicketOutline, IoSparklesOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchEvents } from '../../api';
import { useKioskLang } from '../../contexts/KioskLangContext';

export default function KioskVarszinhaz() {
  const navigate = useNavigate();
  const { t } = useKioskLang();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMonth, setActiveMonth] = useState('all');

  useEffect(() => {
    fetchEvents()
      .then(data => {
        const norm = data.map(e => ({
          ...e,
          tags: (e.tags || []).map(t => String(t).toLowerCase())
        }));
        const varszinhazEvents = norm.filter(e => e.isVarszinhaz === true || e.tags.includes('várszínház') || e.tags.includes('varszinhaz'));
        const sorted = varszinhazEvents.sort((a, b) => a.date.localeCompare(b.date));
        setEvents(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching Várszínház events for Kiosk:", err);
        setLoading(false);
      });
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (evt.name || '').toLowerCase().includes(q) || 
        (evt.description || '').toLowerCase().includes(q);

      // Month filter
      if (!matchQuery) return false;
      if (activeMonth === 'all') return true;

      // Extract month index (evt.date is usually YYYY-MM-DD)
      const parts = evt.date.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1]);
        if (activeMonth === 'june' && m === 6) return true;
        if (activeMonth === 'july' && m === 7) return true;
        if (activeMonth === 'august' && m === 8) return true;
      }
      return false;
    });
  }, [events, searchQuery, activeMonth]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-8 select-none animate-fadeIn">
        
        {/* Cinematic Puppet Art Hero Banner */}
        <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden w-full aspect-[2.3/1] sm:h-[280px] shadow-2xl border border-zinc-200/30 dark:border-zinc-800/50 bg-slate-950 shrink-0">
          <img 
            src="/images/varszinhaz_hero.png" 
            alt="Kőszegi Várszínház Szezon" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* Search & Month Filter Segmented Control */}
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('varszinhaz.searchPlaceholder')}
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/80 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm transition-all"
            />
            <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400" />
          </div>

          {/* Month Segmented Control */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-200/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/10 dark:border-zinc-850/10">
            {[
              { id: 'all', label: t('varszinhaz.months.all') },
              { id: 'june', label: t('varszinhaz.months.june') },
              { id: 'july', label: t('varszinhaz.months.july') },
              { id: 'august', label: t('varszinhaz.months.august') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveMonth(tab.id)}
                className={`
                  py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200
                  ${activeMonth === tab.id 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events list */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-16 text-zinc-400 text-sm font-semibold">
              {t('varszinhaz.loading')}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm font-semibold">
              {t('varszinhaz.empty')}
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/kiosk/events/${evt.id}`)}
                className="
                  rounded-[2rem] p-5 cursor-pointer overflow-hidden group
                  bg-white/80 dark:bg-zinc-900/60
                  backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                  shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                  transition-all duration-300 flex gap-5 items-center
                "
              >
                {/* Image */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-200/20 bg-zinc-900">
                  <img
                    src={evt.image ? (evt.image.startsWith('http') ? evt.image : `/images/events/${evt.image}`) : '/images/event_default.jpg'}
                    alt={evt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = '/images/event_default.jpg';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-1 min-w-0 text-left">
                  <span className="text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-wider leading-none">
                    {evt.date} • {evt.time || t('common.allDay')}
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug uppercase truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                    {evt.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-none">
                    <IoLocationOutline className="text-sm text-indigo-500 dark:text-indigo-400" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>

                {/* Info badge */}
                <div className="shrink-0 flex items-center justify-center">
                  <div className="px-3.5 py-2 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase flex items-center gap-1">
                    <IoTicketOutline className="text-sm" />
                    {t('common.info')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
