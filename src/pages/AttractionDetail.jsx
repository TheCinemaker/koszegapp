import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAttractionById, fetchEvents } from '../api';
import {
  IoArrowBack,
  IoTimeOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoMapOutline,
  IoDiamond,
  IoCalendarOutline,
  IoImagesOutline,
  IoBulbOutline,
  IoInformationCircleOutline,
  IoAccessibilityOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import { motion, useScroll, useTransform } from 'framer-motion';

import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AttractionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attr, setAttr] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 500], [1.1, 1.0]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.5]);
  const backBtnBlur = useTransform(scrollY, [0, 100], [0, 10]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attrData, allEvents] = await Promise.all([
          fetchAttractionById(id),
          fetchEvents()
        ]);

        if (attrData) {
          setAttr(attrData);

          const normalize = (str) => (str || '').toLowerCase()
            .replace(/[‑]/g, '-')
            .replace(/[^a-z0-9áéíóöőúüű]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const attrId = attrData.id?.toLowerCase();
          const attrNameNorm = normalize(attrData.name);

          const related = allEvents.filter(ev => {
            if (!ev.location) return false;
            const locNorm = normalize(ev.location);

            return locNorm.includes(attrNameNorm) ||
              attrNameNorm.includes(locNorm) ||
              (attrId && ev.attractionId === attrId);
          });

          setEvents(related.slice(0, 4));
        }
      } catch (err) {
        console.error("Hiba az adatok betöltésekor:", err);
        setError(err.message || "Ismeretlen hiba történt.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return (
    <LoadingSpinner fullScreen={true} label="Látnivaló betöltése..." />
  );

  if (error || !attr) return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Látnivaló nem található.</h2>
        <button onClick={() => navigate('/attractions')} className="px-8 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30">Vissza a listához</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-x-hidden pb-20 relative">

      {/* --- NAVIGATION (FLOATING APPLE STYLE) --- */}
      <motion.div
        style={{ backdropFilter: `blur(${backBtnBlur}px)` }}
        className="fixed top-24 left-8 z-[100]"
      >
        <button
          onClick={() => navigate('/attractions')}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 text-gray-900 dark:text-white shadow-floating hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          <IoArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[75vh] w-full overflow-hidden bg-black">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="w-full h-full relative"
        >
          {attr.image ? (
            <>
              <img
                src={attr.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
              />
              <img
                src={attr.image}
                alt={attr.name}
                className="relative w-full h-full object-contain z-10"
              />
            </>
          ) : (
            <GhostImage className="w-full h-full" />
          )}
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-light dark:from-surface-dark via-transparent to-transparent z-20" />
        <div className="absolute inset-0 bg-black/10 z-0" />

        {/* Hero Title Container */}
        <div className="absolute bottom-16 left-8 right-8 z-20 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 rounded-full bg-gold/20 backdrop-blur-xl text-gold-light text-[10px] font-semibold uppercase tracking-[0.2em] shadow-card border border-gold/40">
                {attr.category || "Látnivaló"}
              </span>
              {attr.rainSafe && (
                <span className="p-2 rounded-full bg-emerald-500/20 backdrop-blur-xl text-emerald-200 border border-emerald-500/30">
                  <IoSparklesOutline className="text-sm" />
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white dark:text-white drop-shadow-2xl tracking-tight leading-[0.95] max-w-5xl">
              {attr.name}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* --- BENTO CONTENT SHEET --- */}
      <div className="relative z-30 px-6 -mt-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Description Card */}
            <FadeUp>
              <div className="bg-surface-card dark:bg-surface-card-dark rounded-card p-6 lg:p-8 shadow-card border border-slate-200/80 dark:border-white/10">
                <h2 className="text-xs font-semibold text-gold-text dark:text-gold-light uppercase tracking-widest mb-4 flex items-center gap-2">
                  <IoInformationCircleOutline className="text-lg" /> Ismerd meg
                </h2>
                <p className="text-xl md:text-2xl text-gray-900 dark:text-gray-100 font-semibold leading-snug tracking-display">
                  {attr.details || attr.description}
                </p>
              </div>
            </FadeUp>

            {/* 2. History & Details */}
            {attr.history_full && (
              <FadeUp delay={0.1}>
                <div className="bg-surface-card dark:bg-surface-card-dark rounded-card p-6 lg:p-8 shadow-card border border-slate-200/80 dark:border-white/10">
                  <h2 className="text-xs font-semibold text-gold-text dark:text-gold-light uppercase tracking-widest mb-4 flex items-center gap-2">
                    <IoDiamond className="text-lg" /> Történelem
                  </h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      {attr.history_full}
                    </p>
                  </div>
                </div>
              </FadeUp>
            )}

            {/* 3. Near Events */}
            {events.length > 0 && (
              <FadeUp delay={0.2}>
                <div className="bg-surface-card dark:bg-surface-card-dark rounded-card p-6 lg:p-8 shadow-card border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-semibold text-gold-text dark:text-gold-light uppercase tracking-widest flex items-center gap-2">
                      <IoCalendarOutline className="text-lg" /> Közelgő Programok
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((ev, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="p-5 rounded-control bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-gold-text dark:text-gold-light uppercase mb-2 block">{ev.date} • {ev.time}</span>
                            <h3 className="text-base font-semibold dark:text-white leading-tight mb-2">{ev.name}</h3>
                          </div>
                          <Link
                            to={`/events/${ev.id}`}
                            state={{ fromAttraction: { id, name: attr.name } }}
                            className="text-xs font-semibold text-gold-text dark:text-gold-light hover:underline transition-colors"
                          >
                            Részletek →
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            )}

            {/* 4. Gallery Section */}
            {attr.gallery && attr.gallery.length > 0 && (
              <FadeUp delay={0.3}>
                <div className="bg-surface-card dark:bg-surface-card-dark rounded-card p-6 lg:p-8 shadow-card border border-slate-200/80 dark:border-white/10">
                  <h2 className="text-xs font-semibold text-gold-text dark:text-gold-light uppercase tracking-widest mb-6 flex items-center gap-2">
                    <IoImagesOutline className="text-lg" /> Galéria
                  </h2>

                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 snap-x snap-mandatory">
                      {attr.gallery.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          className="min-w-[70vw] md:min-w-[360px] aspect-[3/4] rounded-card overflow-hidden snap-center relative shadow-card border border-white/10"
                        >
                          <img
                            src={img}
                            alt={`${attr.name} galléria kép ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeUp>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">

            {/* Info Card: Hours */}
            <FadeUp delay={0.1}>
              <div className="bg-surface-card dark:bg-surface-card-dark p-6 lg:p-8 rounded-card shadow-card border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30">
                    <IoTimeOutline className="text-lg" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs tracking-widest">Nyitvatartás</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-semibold whitespace-pre-line leading-relaxed text-sm">
                  {attr.hours || "Nincs adat"}
                </p>
              </div>
            </FadeUp>

            {/* Info Card: Tips */}
            {attr.tips && (
              <FadeUp delay={0.2}>
                <div className="bg-brand p-6 lg:p-8 rounded-card shadow-card text-gold-light border border-gold/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold-light flex items-center justify-center border border-gold/40">
                      <IoBulbOutline className="text-lg" />
                    </div>
                    <h3 className="font-semibold uppercase text-xs tracking-widest">Tipp neked</h3>
                  </div>
                  <p className="font-semibold text-base leading-snug text-white">
                    "{attr.tips}"
                  </p>
                </div>
              </FadeUp>
            )}

            {/* Info Card: Fun Fact */}
            {attr.fun_fact && (
              <FadeUp delay={0.3}>
                <div className="bg-surface-card dark:bg-surface-card-dark p-6 lg:p-8 rounded-card shadow-card border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30">
                      <IoSparklesOutline className="text-lg" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs tracking-widest">Tudtad?</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold leading-relaxed italic text-sm">
                    {attr.fun_fact}
                  </p>
                </div>
              </FadeUp>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {attr.phone && (
                <motion.a
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  href={`tel:${attr.phone}`}
                  className="bg-surface-card dark:bg-surface-card-dark p-5 rounded-control flex flex-col items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 shadow-card"
                >
                  <IoCallOutline className="text-xl text-gold-text dark:text-gold-light" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest dark:text-white">Hívás</span>
                </motion.a>
              )}
              {attr.website && (
                <motion.a
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  href={attr.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface-card dark:bg-surface-card-dark p-5 rounded-control flex flex-col items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 shadow-card"
                >
                  <IoGlobeOutline className="text-xl text-gold-text dark:text-gold-light" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest dark:text-white">Web</span>
                </motion.a>
              )}
            </div>

            {/* Sidebar Map */}
            <FadeUp delay={0.5}>
              <div className="rounded-card overflow-hidden h-60 border border-slate-200/80 dark:border-white/10 shadow-card relative group">
                <iframe
                  src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=16&output=embed`}
                  className="w-full h-full border-0 transition-all duration-700"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl text-xs font-semibold uppercase tracking-widest dark:text-white">
                  <IoMapOutline className="inline mr-1" /> Térkép
                </div>
              </div>
            </FadeUp>

          </div>
        </div>
      </div>
    </div>
  );
}
